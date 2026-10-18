export const releaseHeader = 'X-Roomedy-Release';
export function releaseMismatch(
  request: Request,
  release: string,
): Response | null {
  if (
    !release ||
    request.headers.get(releaseHeader) === release ||
    (!request.headers.has(releaseHeader) && request.method === 'GET')
  )
    return null;
  return new Response(
    JSON.stringify({
      error: {
        code: 'not-available',
        message: 'This version changed. Preserve your layout before reloading.',
        reference: 'release-changed',
        retryable: false,
      },
    }),
    {
      status: 409,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        [releaseHeader]: release,
      },
    },
  );
}
export function stampRelease(response: Response, release: string) {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  if (release) response.headers.set(releaseHeader, release);
  return response;
}
