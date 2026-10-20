import { safeErrorSchema, errorMessages } from '@roomedy/contracts/api';
import {
  admissionResultSchema,
  operationResultSchema,
  recognitionInputSchema,
} from '@roomedy/contracts/operations';
import type { OperationResult } from '@roomedy/contracts/operations';
import { POLICY, VERSIONS } from '@roomedy/contracts/policy';
import { readOperationResponse as read } from '../session/operation-client';
export { operationAvailability as recognitionAvailability } from '../session/operation-client';
import { releaseTransport } from '../session/release-client';
import type { ReviewController } from './review-controller';

type Transport = typeof fetch;
export const FAKE_PROCESSING_PREVIEW_MS = 2800;
interface ProcessingOptions {
  openStudio?: boolean;
  previewProcessing?: boolean;
}
async function previewProcessing(ms: number, signal: AbortSignal) {
  if (ms <= 0 || signal.aborted) return;
  await new Promise<void>((resolve) => {
    const done = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', done);
      resolve();
    };
    const timer = setTimeout(done, ms);
    signal.addEventListener('abort', done, { once: true });
    if (signal.aborted) done();
  });
}
const base = '/api/roomedy/v1/';
const outcomes: Record<
  Exclude<OperationResult['kind'], 'completed'>,
  string
> = {
  refused:
    'These photos could not be interpreted. Change photos or continue manually.',
  incomplete:
    'The photo response was incomplete. Your photos are still here; try again.',
  malformed:
    'The photo response could not be used. Your photos are still here; try again.',
  cancelled: 'Processing cancelled. Your photos are still here.',
  timeout: 'Photo processing took too long. Try again or build manually.',
  'too-large':
    'The photo response was too large. Try fewer photos or continue manually.',
  unavailable: 'Photo processing is unavailable. Continue with manual setup.',
  failed:
    'Photo processing could not finish. Your photos are still here; try again.',
  'invalid-image':
    'These prepared photos could not be decoded. Try another photo or continue manually.',
};
/** Explicit user action only. All awaits are fenced by ReviewController, including ignored aborts. */
export async function draftFromPhotos(
  controller: ReviewController,
  transport: Transport = fetch,
  options: ProcessingOptions = {},
) {
  const startedAt = Date.now();
  const prepared = controller.photos.preparedRequest();
  if (!prepared) {
    controller.notify(
      'Wait for all selected photos to be ready, or remove a failed photo.',
    );
    return;
  }
  const token = controller.beginDraftOperation();
  if (!token) return;
  const abort = new AbortController(),
    signal = AbortSignal.any([
      abort.signal,
      AbortSignal.timeout(POLICY.operationBridgeMs),
    ]);
  const timedOut = () => {
    if (controller.isCurrent(token))
      controller.endDraftOperation(token, outcomes.timeout);
  };
  signal.addEventListener('abort', timedOut, { once: true });
  controller.ownOperation(token, () => {
    signal.removeEventListener('abort', timedOut);
    abort.abort();
  });
  const current = () => controller.isCurrent(token) && !signal.aborted;
  const finish = (message: string) => {
    if (controller.isCurrent(token))
      controller.endDraftOperation(token, message);
  };
  transport = releaseTransport(transport, () =>
    finish(
      'This version changed. Your photos are still here. Return to Room choices to build manually, or reload when ready; selected photos cannot recover.',
    ),
  );
  try {
    const images: { id: string; data: string }[] = [];
    for (const [index, image] of prepared.images.entries()) {
      const bytes = new Uint8Array(await image.arrayBuffer());
      if (!current()) return;
      let binary = '';
      for (let offset = 0; offset < bytes.length; offset += 16_384)
        binary += String.fromCharCode(
          ...bytes.subarray(offset, offset + 16_384),
        );
      images.push({ id: prepared.manifest[index]!.id, data: btoa(binary) });
    }
    const draft = controller.getSnapshot().draft;
    const input = recognitionInputSchema.parse({
      schemaVersion: VERSIONS.schema,
      catalogueVersion: VERSIONS.catalogue,
      rulesVersion: VERSIONS.rules,
      kind: 'recognize-room',
      condition: draft.room.intent.condition,
      identity: {
        workspaceId: token.reviewId,
        generation: token.generation,
        operationId: token.operationId,
        roomId: draft.room.roomId,
        inputRevision: token.inputRevision,
      },
      manifest: prepared.manifest,
      images,
    });
    const post = async (
      path: 'admission' | 'recognize-room',
      value: unknown,
    ) => {
      const response = await transport(base + path, {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(value),
        signal,
      });
      return read(response, signal);
    };
    if (!current()) return;
    controller.draftProgress(token, 'drafting');
    const admitted = await post('admission', { input, proof: null });
    if (!current()) return;
    const failure = safeErrorSchema.safeParse(admitted);
    if (failure.success) {
      finish(errorMessages[failure.data.error.code]);
      return;
    }
    const grant = admissionResultSchema.safeParse(admitted);
    if (!grant.success || grant.data.kind !== 'granted') {
      finish(
        'Photo processing needs verification that is unavailable here. Continue manually.',
      );
      return;
    }
    const raw = await post('recognize-room', {
      input,
      grant: grant.data.grant,
    });
    if (!current()) return;
    const error = safeErrorSchema.safeParse(raw);
    if (error.success) {
      finish(errorMessages[error.data.error.code]);
      return;
    }
    const parsed = operationResultSchema.safeParse(raw);
    if (
      !parsed.success ||
      JSON.stringify(parsed.data.identity) !== JSON.stringify(input.identity)
    ) {
      finish(outcomes.malformed);
      return;
    }
    const result = parsed.data;
    if (result.kind === 'completed' && result.draft) {
      if (options.openStudio) {
        controller.draftProgress(token, 'opening');
        if (options.previewProcessing && result.simulation)
          await previewProcessing(
            FAKE_PROCESSING_PREVIEW_MS - (Date.now() - startedAt),
            signal,
          );
        if (current())
          controller.openStudioFromPhotos(
            token,
            result.draft,
            result.simulation,
          );
      } else controller.applyHypothesis(token, result.draft, result.simulation);
    } else
      finish(outcomes[result.kind === 'completed' ? 'malformed' : result.kind]);
  } catch {
    finish(
      signal.aborted
        ? outcomes.timeout
        : 'Photo processing could not connect. Your photos are still here; try again.',
    );
  }
}
