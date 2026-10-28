import { createSourcingHandler } from './sourcing/sourcing.js';
import { createExchangeRates } from './sourcing/exchange-rates.js';
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { config as loadEnvironment } from 'dotenv';
import { parseRuntimeConfig } from './config/runtime-config.js';
import { createApp } from './http/create-app.js';
import { createRuntime } from './runtime/create-runtime.js';
import type { Diagnostic } from './runtime/create-runtime.js';
import { createRecognitionHandler } from './recognition/recognize.js';
import { createRoomedyFakeProvider } from './providers/fake.js';
import { createAssistantHandler } from './assistant/assistant.js';
import { createResponsesProvider } from './providers/responses.js';
import { createTurnstileChallenge } from './security/turnstile.js';

// This executable is the only backend module allowed to load environment or listen.
loadEnvironment({
  path: fileURLToPath(new URL('../.env.local', import.meta.url)),
  override: false,
  quiet: true,
});
const log = (event: Diagnostic) => {
  console.info(JSON.stringify(event));
};
try {
  const config = parseRuntimeConfig(process.env);
  // Private transient images: no process-wide native operation cache; finite per-image threads.
  sharp.cache(false);
  sharp.concurrency(1);
  const runtime = createRuntime(config, {
    now: Date.now,
    nextId: randomUUID,
    log,
    handlers: {
      'recognize-room': createRecognitionHandler(log, randomUUID),
      assistant: createAssistantHandler(log, randomUUID),
      sourcing: createSourcingHandler(
        config.mode === 'fake',
        Date.now,
        randomUUID,
        config.mode === 'live' ? createExchangeRates() : undefined,
        (sourcingIssues) =>
          log({
            code: 'sourcing-decision',
            reference: randomUUID(),
            outcome: sourcingIssues.some(
              (issue) => issue.code === 'usd-rate-unavailable',
            )
              ? 'unavailable'
              : 'malformed',
            stage: sourcingIssues.some((issue) => issue.code.startsWith('usd-'))
              ? 'provider'
              : 'decode',
            sourcingIssues,
          }),
      ),
    },
    ...(config.mode === 'fake'
      ? { provider: createRoomedyFakeProvider() }
      : {}),
    ...(config.mode === 'live' &&
    config.paidEnabled &&
    config.providerConfigured &&
    config.turnstileSiteKey &&
    process.env.TURNSTILE_SECRET_KEY?.trim()
      ? {
          provider: createResponsesProvider(
            process.env.OPENAI_API_KEY!.trim(),
            undefined,
            undefined,
            (providerShape) =>
              log({
                code: 'provider-rejected',
                reference: randomUUID(),
                stage: 'provider',
                outcome: 'malformed',
                providerShape,
              }),
          ),
          challenge: createTurnstileChallenge(
            process.env.TURNSTILE_SECRET_KEY.trim(),
            config.frontendOrigin,
          ),
        }
      : {}),
  });
  const server = createApp(runtime).listen(config.port, config.host, () => {
    log({ code: 'server-started', reference: randomUUID() });
  });
  server.on('error', () => {
    log({ code: 'startup-failed', reference: randomUUID() });
    process.exitCode = 1;
  });
  let stopping = false;
  for (const signal of ['SIGINT', 'SIGTERM'] as const)
    process.once(signal, () => {
      if (stopping) return;
      stopping = true;
      runtime.operations.close();
      const force = setTimeout(() => {
        log({ code: 'shutdown-forced', reference: randomUUID() });
        server.closeAllConnections();
        process.exit(0);
      }, 8000);
      force.unref();
      server.close(() => clearTimeout(force));
      server.closeIdleConnections();
    });
} catch {
  log({ code: 'startup-failed', reference: randomUUID() });
  process.exitCode = 1;
}
