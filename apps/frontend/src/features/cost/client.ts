import {
  sourcingInputSchema,
  admissionResultSchema,
  operationResultSchema,
} from '@roomedy/contracts/operations';
import type { OperationInput } from '@roomedy/contracts/operations';
import { safeErrorSchema, errorMessages } from '@roomedy/contracts/api';
import { readOperationResponse } from '../session/operation-client';
import { obtainAdmission } from '../session/admission-client';
import { operationAvailability } from '../session/operation-client';
import { POLICY, VERSIONS } from '@roomedy/contracts/policy';
import type { SessionController } from '../session/controller';
import type { SourcingBrief } from '@roomedy/contracts/sourcing';
import { sourcingBriefSchema } from '@roomedy/contracts/sourcing';

/** One explicit foreground operation; visible retirement does not await an untrusted transport. */
export function beginResearch(
  controller: SessionController,
  brief: SourcingBrief,
  transport: typeof fetch = fetch,
) {
  if (!sourcingBriefSchema.safeParse(brief).success) return null;
  const state = controller.getSnapshot();
  if (
    !controller.canEdit() ||
    state.destination !== 'cost' ||
    !state.cost ||
    state.candidate
  )
    return null;
  const token = controller.beginOperation();
  if (!token) return null;
  const input = sourcingInputSchema.parse({
    schemaVersion: VERSIONS.schema,
    catalogueVersion: VERSIONS.catalogue,
    rulesVersion: VERSIONS.rules,
    kind: 'sourcing',
    identity: token,
    costRevision: state.cost.revision,
    locality: state.cost.settings.locality,
    brief,
  });
  const abort = new AbortController();
  let stop: (
    value: Awaited<ReturnType<typeof researchProducts>>,
  ) => void = () => {};
  const stopped = new Promise<Awaited<ReturnType<typeof researchProducts>>>(
    (resolve) => {
      stop = resolve;
    },
  );
  const cancel = () => {
    abort.abort();
    stop({
      ok: false,
      message: 'Research cancelled. Your accepted prices are unchanged.',
    });
  };
  const release = controller.ownResource(cancel, token);
  const timer = setTimeout(() => {
    abort.abort();
    stop({
      ok: false,
      message: 'Research took too long. You can continue with manual prices.',
    });
  }, POLICY.operationBridgeMs);
  const result = (async () => {
    try {
      const work = (async () => {
        const config = await operationAvailability(abort.signal, transport);
        if (!config?.capabilities.sourcing)
          return {
            ok: false as const,
            message:
              'Research is unavailable here. Enter a manual price or allowance.',
          };
        const answer = await researchProducts(input, abort.signal, transport);
        if (answer.ok && answer.simulation !== (config.mode === 'fake'))
          return {
            ok: false as const,
            message:
              'The research mode could not be verified. Accepted prices are unchanged.',
          };
        return answer;
      })().catch(() => ({
        ok: false as const,
        message:
          'Research could not finish. Your accepted prices are unchanged.',
      }));
      const answer = await Promise.race([work, stopped]);
      if (
        !controller.isCurrent(token) ||
        controller.getSnapshot().cost?.revision !== input.costRevision
      )
        return {
          ok: false as const,
          message: 'This research belongs to an earlier design or cost scope.',
        };
      controller.completeOperation(token, () => {});
      return { ...answer, input };
    } finally {
      clearTimeout(timer);
      release?.();
    }
  })();
  return { cancel, result };
}
export async function researchProducts(
  input: Extract<OperationInput, { kind: 'sourcing' }>,
  signal: AbortSignal,
  transport: typeof fetch = fetch,
) {
  const parsed = sourcingInputSchema.parse(input);
  const post = async (path: 'admission' | 'sourcing', body: unknown) => {
    const response = await transport('/api/roomedy/v1/' + path, {
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
    return readOperationResponse(response, signal);
  };
  const fail = (message: string) => ({ ok: false as const, message });
  const admission = await obtainAdmission(parsed, signal, (body) =>
    post('admission', body),
  );
  const error = safeErrorSchema.safeParse(admission);
  if (error.success) return fail(errorMessages[error.data.error.code]);
  const grant = admissionResultSchema.safeParse(admission);
  if (!grant.success || grant.data.kind !== 'granted')
    return fail(
      'Research verification is unavailable. You can enter a manual price.',
    );
  const raw = await post('sourcing', {
    input: parsed,
    grant: grant.data.grant,
  });
  const operationError = safeErrorSchema.safeParse(raw);
  if (operationError.success)
    return fail(errorMessages[operationError.data.error.code]);
  const result = operationResultSchema.safeParse(raw);
  if (
    result.success &&
    JSON.stringify(result.data.identity) === JSON.stringify(parsed.identity)
  ) {
    if (result.data.kind === 'timeout')
      return fail(
        'Research reached its time limit. Your accepted prices are unchanged. Try a specific product or supplier page, or enter a manual allowance.',
      );
    if (result.data.kind === 'refused')
      return fail(
        'This research request could not be answered. Your accepted prices are unchanged. Try another product or enter a manual allowance.',
      );
    if (result.data.kind === 'malformed')
      return fail(
        'The source response could not be verified. Your accepted prices are unchanged. Try a specific variant or enter a manual allowance.',
      );
  }
  if (
    !result.success ||
    JSON.stringify(result.data.identity) !== JSON.stringify(parsed.identity) ||
    result.data.kind !== 'completed' ||
    !result.data.sourcing
  )
    return fail(
      'Research could not finish. Your accepted prices are unchanged.',
    );
  return {
    ok: true as const,
    reply: result.data.sourcing,
    simulation: result.data.simulation,
  };
}
