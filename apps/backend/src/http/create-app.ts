import express from 'express';
import type { ErrorRequestHandler, Express } from 'express';
import type { Runtime } from '../runtime/create-runtime.js';
import { safeError } from './errors.js';
import { createHash, timingSafeEqual } from 'node:crypto';
import {
  admissionInputSchema,
  operationRequestSchema,
} from '@roomedy/contracts/operations';
import { readBody, BodyError } from './body.js';

/** Inert factory: never loads env, listens, or composes a live provider. */
export function createApp(runtime: Runtime): Express {
  const app = express();
  app.disable('x-powered-by');
  app.disable('etag');
  app.enable('case sensitive routing');
  app.enable('strict routing');
  app.use((req, res, next) => {
    res.set({
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    const release = runtime.config.releaseId;
    if (release) {
      res.set('X-Roomedy-Release', release);
      if (
        (req.headers['x-roomedy-release'] !== release &&
          req.method === 'POST') ||
        (req.headers['x-roomedy-release'] !== undefined &&
          req.headers['x-roomedy-release'] !== release)
      ) {
        res
          .set('Cache-Control', 'no-store')
          .status(409)
          .json(safeError('not-available', runtime.nextId()));
        return;
      }
    }
    next();
  });
  const gets = ['/v1/health', '/v1/ready', '/v1/config'];
  const posts = [
    '/v1/admission',
    '/v1/recognize-room',
    '/v1/assistant',
    '/v1/sourcing',
  ];
  app.use((req, res, next) => {
    if (!gets.includes(req.path) && !posts.includes(req.path)) {
      res.status(404).json(safeError('not-found', runtime.nextId()));
      return;
    }
    if (
      req.originalUrl !== req.path ||
      (gets.includes(req.path) ? req.method !== 'GET' : req.method !== 'POST')
    ) {
      res.status(400).json(safeError('invalid-input', runtime.nextId()));
      return;
    }
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
  for (const path of posts) {
    app.post(path, async (req, res) => {
      const fail = (code: Parameters<typeof safeError>[0], status: number) => {
        res.set('Connection', 'close');
        res.status(status).json(safeError(code, runtime.nextId()));
      };
      if (!runtime.config.bridgeSecret) {
        fail('not-available', 503);
        return;
      }
      const expected = createHash('sha256')
        .update(`Bearer ${runtime.config.bridgeSecret}`)
        .digest();
      const actual = createHash('sha256')
        .update(req.get('authorization') ?? '')
        .digest();
      if (
        !timingSafeEqual(expected, actual) ||
        req.get('origin') !== runtime.config.frontendOrigin
      ) {
        fail('forbidden', 403);
        return;
      }
      const release = runtime.operations.admission.takeIntake();
      if (!release) {
        fail('busy', 429);
        return;
      }
      const abort = new AbortController();
      const disconnected = () => {
        if (!res.writableEnded) abort.abort();
      };
      res.on('close', disconnected);
      try {
        const raw = await readBody(req, abort.signal);
        if (path === '/v1/admission') {
          const parsed = admissionInputSchema.safeParse(raw);
          if (!parsed.success) {
            fail('invalid-input', 400);
            return;
          }
          const result = await runtime.operations.grant(
            parsed.data.input,
            parsed.data.proof,
            abort.signal,
          );
          if (!res.destroyed)
            res
              .status(
                'error' in result
                  ? result.error.code === 'busy'
                    ? 429
                    : 503
                  : 200,
              )
              .json(result);
        } else {
          const parsed = operationRequestSchema.safeParse(raw);
          if (!parsed.success || parsed.data.input.kind !== path.slice(4)) {
            fail('invalid-input', 400);
            return;
          }
          release(); // Request parsing ownership ends; run acquires independent shared work admission.
          const result = await runtime.operations.run(
            parsed.data.input,
            parsed.data.grant,
            abort.signal,
          );
          if (!res.destroyed)
            res
              .status(
                'error' in result
                  ? result.error.code === 'busy'
                    ? 429
                    : result.error.code === 'invalid-grant'
                      ? 409
                      : 503
                  : 200,
              )
              .json(result);
        }
      } catch (error) {
        if (!res.destroyed) {
          if (error instanceof BodyError)
            fail(
              error.code,
              error.code === 'body-limit'
                ? 413
                : error.code === 'timeout'
                  ? 408
                  : 400,
            );
          else {
            runtime.log({
              code: 'request-failed',
              reference: runtime.nextId(),
            });
            fail('internal-error', 500);
          }
        }
      } finally {
        release();
        res.off('close', disconnected);
      }
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
