export const EXAMPLE_PHOTOS = [
  {
    path: '/landing/bedroom-wide.webp',
    label: 'Bedroom view',
    purpose: 'room' as const,
  },
  {
    path: '/landing/bedroom-narrow.webp',
    label: 'Bedside detail',
    purpose: 'furniture' as const,
  },
] as const;
/** Fixed local licensed crops, bounded before joining chunks; ordinary decoder still validates pixels. */
export async function loadExamplePhotos(
  signal: AbortSignal,
  transport: typeof fetch = fetch,
) {
  const bounded = AbortSignal.any([signal, AbortSignal.timeout(15_000)]);
  const photos: Blob[] = [];
  for (const example of EXAMPLE_PHOTOS) {
    const response = await transport(example.path, {
      signal: bounded,
      credentials: 'same-origin',
      cache: 'force-cache',
    });
    if (!response.ok || !response.body || bounded.aborted)
      throw new Error('example-unavailable');
    const reader = response.body.getReader(),
      chunks: Uint8Array<ArrayBuffer>[] = [];
    let bytes = 0;
    const cancel = () => {
      void reader.cancel().catch(() => {});
    };
    bounded.addEventListener('abort', cancel, { once: true });
    try {
      while (true) {
        if (bounded.aborted) throw new Error('example-cancelled');
        const next = await reader.read();
        if (bounded.aborted) throw new Error('example-cancelled');
        if (next.done) break;
        bytes += next.value.byteLength;
        if (bytes > 256 * 1024 || chunks.length >= 128)
          throw new Error('example-bound');
        chunks.push(new Uint8Array(next.value));
      }
      if (!bytes) throw new Error('example-empty');
      photos.push(new Blob(chunks, { type: 'image/webp' }));
    } finally {
      bounded.removeEventListener('abort', cancel);
      await reader.cancel().catch(() => {});
      reader.releaseLock();
    }
  }
  return photos;
}
