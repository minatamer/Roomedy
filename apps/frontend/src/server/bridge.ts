import 'server-only';
import { bridgeGet } from './bridge-core';
import type { PublicOperation } from './bridge-core';
import { bridgePost } from './bridge-post';
import type { MutationOperation } from './bridge-post';

export function forwardGet(operation: PublicOperation, request: Request) {
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
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  return bridgeGet(
    operation,
    process.env.ROOMEDY_BACKEND_ORIGIN || 'http://127.0.0.1:4321',
    request.signal,
  );
}
export function forwardPost(operation: MutationOperation, request: Request) {
  return bridgePost(operation, request, {
    backendOrigin:
      process.env.ROOMEDY_BACKEND_ORIGIN || 'http://127.0.0.1:4321',
    publicOrigin: process.env.ROOMEDY_PUBLIC_ORIGIN || 'http://127.0.0.1:4320',
    secret: process.env.ROOMEDY_BRIDGE_SECRET || '',
  });
}
