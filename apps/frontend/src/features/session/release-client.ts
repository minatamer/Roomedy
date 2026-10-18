/** Build identity is public comparison data, never mode, measurement or operation authority. */
export function releaseTransport(
  transport: typeof fetch,
  mismatch: () => void,
  expected = process.env.NEXT_PUBLIC_ROOMEDY_RELEASE_ID ?? '',
): typeof fetch {
  if (!expected) return transport;
  return async (input, init) => {
    const headers = new Headers(init?.headers);
    headers.set('X-Roomedy-Release', expected);
    const response = await transport(input, { ...init, headers });
    if (response.headers.get('X-Roomedy-Release') !== expected) {
      void response.body?.cancel().catch(() => undefined);
      mismatch();
      throw new Error('client-release');
    }
    return response;
  };
}
