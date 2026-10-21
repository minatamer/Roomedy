import { admissionResultSchema } from '@roomedy/contracts/operations';
import type {
  OperationInput,
  VerificationChallenge,
} from '@roomedy/contracts/operations';
import { requestVerification } from '../verification/state';

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
  const proof = await verify(parsed.data.challenge, signal);
  signal.throwIfAborted();
  if (!proof)
    return { kind: 'verification', state: 'failed', simulation: false };
  return post({ input, proof });
}
