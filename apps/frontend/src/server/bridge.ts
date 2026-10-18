import 'server-only';
import { serviceFetch } from './service-identity';
import { releaseMismatch, stampRelease } from './release-response';
const release = process.env.ROOMEDY_RELEASE_ID ?? '';
const origin = process.env.ROOMEDY_BACKEND_ORIGIN || 'http://127.0.0.1:4321';
const identity = process.env.ROOMEDY_SERVICE_IDENTITY || 'none';
let authenticated: typeof fetch | undefined;
const upstreamFetch: typeof fetch = async (input, init) => {
  authenticated ??= serviceFetch(origin, identity);
  const headers = new Headers(init?.headers);
  if (release) headers.set('X-Roomedy-Release', release);
  return authenticated(input, { ...init, headers });
};
const unavailable = () =>
  stampRelease(
    Response.json(
      {
        error: {
          code: 'upstream-unavailable',
          message: 'The service is unavailable. Please try again shortly.',
          reference: 'bridge-request',
          retryable: true,
        },
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    ),
    release,
  );
import { bridgeGet } from './bridge-core';
import type { PublicOperation } from './bridge-core';
import { bridgePost } from './bridge-post';
import type { MutationOperation } from './bridge-post';

export async function forwardGet(operation: PublicOperation, request: Request) {
  const changed = releaseMismatch(request, release);
  if (changed) return changed;
  if (
    request.method !== 'GET' ||
    new URL(request.url).search ||
    new URL(request.url).pathname !== `/api/roomedy/v1/${operation}`
  )
    return Response.json(
      {
        error: {
          code: 'invalid-input',
          message: 'Check the information and try again.',
          reference: 'bridge-request',
          retryable: false,
        },
      },
      {
        status: 400,
        headers: {
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
        },
      },
    );
  try {
    return stampRelease(
      await bridgeGet(operation, origin, request.signal, upstreamFetch),
      release,
    );
  } catch {
    return unavailable();
  }
}
export async function forwardPost(
  operation: MutationOperation,
  request: Request,
) {
  const changed = releaseMismatch(request, release);
  if (changed) return changed;
  try {
    return stampRelease(
      await bridgePost(
        operation,
        request,
        {
          backendOrigin: origin,
          publicOrigin:
            process.env.ROOMEDY_PUBLIC_ORIGIN || 'http://127.0.0.1:4320',
          secret: process.env.ROOMEDY_BRIDGE_SECRET || '',
        },
        upstreamFetch,
      ),
      release,
    );
  } catch {
    return unavailable();
  }
}
