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
const base = '/api/roomedy/v1/';
const outcomes: Record<
  Exclude<OperationResult['kind'], 'completed'>,
  string
> = {
  refused:
    'These photos could not be interpreted. Change photos or continue manually.',
  incomplete:
    'The photo response was incomplete. Your photos and current sketch are preserved.',
  malformed:
    'The photo response could not be used. Your photos and current sketch are preserved.',
  cancelled:
    'Photo drafting cancelled. Your photos and current sketch are preserved.',
  timeout: 'Photo drafting took too long. Retry or continue manually.',
  'too-large':
    'The photo response was too large. Try fewer photos or continue manually.',
  unavailable: 'Photo drafting is unavailable. Continue with manual setup.',
  failed:
    'Photo drafting could not finish. Your photos and current sketch are preserved.',
  'invalid-image':
    'These prepared photos could not be decoded. Try another photo or continue manually.',
};
/** Explicit user action only. All awaits are fenced by ReviewController, including ignored aborts. */
export async function draftFromPhotos(
  controller: ReviewController,
  transport: Transport = fetch,
) {
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
      'This version changed. Your sketch and photos are still here. Continue manually, or reload when ready; photos and drafts cannot recover.',
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
        'Photo drafting needs verification that is unavailable here. Continue manually.',
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
    if (result.kind === 'completed' && result.draft)
      controller.applyHypothesis(token, result.draft, result.simulation);
    else
      finish(outcomes[result.kind === 'completed' ? 'malformed' : result.kind]);
  } catch {
    finish(
      signal.aborted
        ? outcomes.timeout
        : 'Photo drafting could not connect. Your photos and current sketch are preserved.',
    );
  }
}
