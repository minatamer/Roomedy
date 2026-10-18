const hash = (v) => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
const image = (v) => typeof v === 'string' && /^sha256:[a-f0-9]{64}$/.test(v);
/** Bound actual decoded bytes and retained fragments before materializing probe responses. */
export async function readProbeBody(response, maximum) {
  if (
    !response.body ||
    !Number.isSafeInteger(maximum) ||
    maximum < 0 ||
    maximum > 16 * 1024 * 1024
  )
    throw new Error('release-response-bound');
  const reader = response.body.getReader(),
    parts = [];
  let bytes = 0,
    fragments = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      bytes += next.value.byteLength;
      if (bytes > maximum || ++fragments > 4096)
        throw new Error('release-response-bound');
      parts.push(next.value);
    }
    return Buffer.concat(parts, bytes);
  } finally {
    void reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
export const requiredProbes = [
  'non-root',
  'runtime-imports',
  'private-files-excluded',
  'health',
  'fake-ready',
  'bridge',
  'anonymous-post-denied',
  'assets-and-worker',
  'shutdown',
];
/** Fresh image inspection is a separate caller-supplied observation, never read from proof itself. */
export function verifyProof(inventory, proof, inspected) {
  if (
    !proof ||
    proof.kind !== 'linux-runtime' ||
    proof.version !== 1 ||
    proof.platform !== 'linux/amd64' ||
    !hash(proof.inputDigest) ||
    proof.inputDigest !== inventory.inputDigest
  )
    throw new Error('release-stale-input');
  if (JSON.stringify(proof.identities) !== JSON.stringify(inventory.identities))
    throw new Error('release-tool-identity');
  if (!inspected || inspected.platform !== 'linux/amd64')
    throw new Error('release-linux-observation-required');
  for (const name of ['frontend', 'backend']) {
    const record = proof.images?.[name],
      actual = inspected.images?.[name];
    if (
      !record ||
      !actual ||
      !image(record.id) ||
      record.id !== actual.id ||
      record.inputDigest !== inventory.inputDigest ||
      actual.inputDigest !== inventory.inputDigest ||
      actual.user !== 'node'
    )
      throw new Error('release-image-mismatch');
  }
  if (
    !Array.isArray(proof.probes) ||
    proof.probes.length !== requiredProbes.length ||
    requiredProbes.some(
      (name) =>
        proof.probes.filter((p) => p.name === name && p.passed === true)
          .length !== 1,
    )
  )
    throw new Error('release-probes-incomplete');
  return {
    kind: 'verified-linux-runtime',
    inputDigest: inventory.inputDigest,
    images: proof.images,
    hosted: false,
    live: false,
  };
}
