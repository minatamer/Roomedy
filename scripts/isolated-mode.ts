import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import { syncBuiltinESMExports } from 'node:module';

export function isolateOffline() {
  process.env.APP_ENV = 'test';
  process.env.FAKE_MODE = 'true';
  process.env.PAID_DEMO_ENABLED = 'false';
  process.env.ROOMEDY_RELEASE_ID = '';
  process.env.NEXT_PUBLIC_ROOMEDY_RELEASE_ID = '';
  delete process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_MODEL;
  delete process.env.ROOMEDY_BRIDGE_SECRET;
  delete process.env.TURNSTILE_SITE_KEY;
  delete process.env.TURNSTILE_SECRET_KEY;
  globalThis.fetch = async () => {
    throw new Error('test-network-denied');
  };
  const local = (host: unknown) =>
    typeof host === 'string' &&
    ['127.0.0.1', '::1', 'localhost'].includes(host);
  const connect = net.Socket.prototype.connect;
  net.Socket.prototype.connect = function (
    this: net.Socket,
    ...args: Parameters<typeof connect>
  ) {
    const first: unknown = args[0];
    const options =
      typeof first === 'object' && first !== null
        ? (first as { host?: unknown; path?: unknown })
        : undefined;
    const host =
      options?.host ?? (typeof args[1] === 'string' ? args[1] : 'localhost');
    if (options?.path || !local(host)) throw new Error('test-network-denied');
    return Reflect.apply(connect, this, args);
  } as typeof connect;
  for (const module of [http, https]) {
    const request = module.request;
    module.request = ((...args: Parameters<typeof request>) => {
      const first = args[0];
      const host =
        typeof first === 'string' || first instanceof URL
          ? new URL(first).hostname
          : (first?.hostname ?? first?.host ?? 'localhost');
      if (!local(host)) throw new Error('test-network-denied');
      return Reflect.apply(request, module, args);
    }) as typeof request;
  }
  syncBuiltinESMExports();
}
