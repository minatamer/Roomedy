import 'server-only';
import { bridgeGet } from './bridge-core';
import type { PublicOperation } from './bridge-core';

export function forwardGet(operation: PublicOperation, request: Request) {
  return bridgeGet(
    operation,
    process.env.ROOMEDY_BACKEND_ORIGIN || 'http://127.0.0.1:4321',
    request.signal,
  );
}
