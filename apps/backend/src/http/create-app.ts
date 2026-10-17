import express from 'express';
import type { ErrorRequestHandler, Express } from 'express';
import type { Runtime } from '../runtime/create-runtime.js';
import { safeError } from './errors.js';

/** Inert factory: never loads env, listens, or composes a live provider. */
export function createApp(runtime: Runtime): Express {
  const app = express();
  app.disable('x-powered-by');
  app.disable('etag');
  app.use((_req, res, next) => {
    res.set({
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    next();
  });
  app.get('/v1/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.get('/v1/ready', (_req, res) => {
    res.json(runtime.readiness);
  });
  app.get('/v1/config', (_req, res) => {
    res.json(runtime.publicConfig);
  });
  for (const path of ['/v1/admission', '/v1/recognize-room', '/v1/assistant']) {
    app.post(path, (_req, res) => {
      res.status(503).json(safeError('not-available', runtime.nextId()));
    });
  }
  app.use((_req, res) => {
    res.status(404).json(safeError('not-found', runtime.nextId()));
  });
  const onError: ErrorRequestHandler = (_error, _req, res, _next) => {
    const body = safeError('internal-error', runtime.nextId());
    runtime.log({ code: 'request-failed', reference: body.error.reference });
    res.status(500).json(body);
  };
  app.use(onError);
  return app;
}
