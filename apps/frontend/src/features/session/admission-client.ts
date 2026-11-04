import { admissionResultSchema } from '@roomedy/contracts/operations';
import type {
  OperationInput,
  VerificationChallenge,
} from '@roomedy/contracts/operations';
import { requestVerification } from '../verification/state';
import { VerificationFailureError } from '../verification/failure';
import type { OperationProgress } from './operation-deadline';

/** A proof is requested only after server admission asks; one deliberate attempt, no retry. */
export async function obtainAdmission(
  input: OperationInput,
  signal: AbortSignal,
  post: (body: {
    input: OperationInput;
    proof: string | null;
  }) => Promise<unknown>,
  verify: (
    challenge: VerificationChallenge,
    signal: AbortSignal,
  ) => Promise<string | null> = requestVerification,
  progress?: OperationProgress,
) {
  signal.throwIfAborted();
  const first = await post({ input, proof: null });
  signal.throwIfAborted();
  const parsed = admissionResultSchema.safeParse(first);
  if (
    !parsed.success ||
    parsed.data.kind !== 'verification' ||
    parsed.data.state !== 'interaction' ||
    !parsed.data.challenge ||
    parsed.data.simulation
  )
    return first;
  let proof: string | null;
  progress?.('verification');
  try {
    proof = await verify(parsed.data.challenge, signal);
  } catch (error) {
    signal.throwIfAborted();
    if (!(error instanceof VerificationFailureError)) throw error;
    return {
      kind: 'verification',
      state: 'failed',
      simulation: false,
      reason: error.reason,
    };
  } finally {
    if (!signal.aborted) progress?.('request');
  }
  signal.throwIfAborted();
  if (!proof)
    return { kind: 'verification', state: 'failed', simulation: false };
  return post({ input, proof });
}
