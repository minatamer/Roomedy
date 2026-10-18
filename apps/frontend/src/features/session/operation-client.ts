import { publicConfigSchema } from '@roomedy/contracts/api';
import { POLICY } from '@roomedy/contracts/policy';
import { BoundedBytes } from '@roomedy/contracts/bounded-bytes';
type Transport = typeof fetch;
const base = '/api/roomedy/v1/';
export async function readOperationResponse(
  response: Response,
  signal: AbortSignal,
  maximum = POLICY.providerOutputBytes,
): Promise<unknown> {
  if (!response.body) throw new Error('response');
  const reader = response.body.getReader(),
    packed = new BoundedBytes(maximum, POLICY.providerOutputFragments);
  try {
    while (true) {
      signal.throwIfAborted();
      const next = await reader.read();
      signal.throwIfAborted();
      if (next.done) break;
      packed.append(next.value);
    }
    return JSON.parse(
      new TextDecoder('utf-8', { fatal: true }).decode(packed.take()),
    ) as unknown;
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
export async function operationAvailability(
  signal: AbortSignal,
  transport: Transport = fetch,
) {
  const combined = AbortSignal.any([
    signal,
    AbortSignal.timeout(POLICY.intakeMs),
  ]);
  try {
    const response = await transport(base + 'config', {
      signal: combined,
      cache: 'no-store',
      credentials: 'same-origin',
    });
    if (!response.ok) return null;
    const parsed = publicConfigSchema.safeParse(
      await readOperationResponse(response, combined, 16_384),
    );
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
