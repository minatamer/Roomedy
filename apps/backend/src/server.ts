import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { config as loadEnvironment } from 'dotenv';
import { parseRuntimeConfig } from './config/runtime-config.js';
import { createApp } from './http/create-app.js';
import { createRuntime } from './runtime/create-runtime.js';
import { createResponsesProvider } from './providers/responses.js';

// This executable is the only backend module allowed to load environment or listen.
loadEnvironment({
  path: fileURLToPath(new URL('../.env.local', import.meta.url)),
  override: false,
  quiet: true,
});
const log = (event: { code: string; reference: string }) => {
  console.info(JSON.stringify(event));
};
try {
  const config = parseRuntimeConfig(process.env);
  const runtime = createRuntime(config, {
    now: Date.now,
    nextId: randomUUID,
    log,
    ...(config.mode === 'live' &&
    config.paidEnabled &&
    config.providerConfigured &&
    config.livePolicyReviewed
      ? {
          provider: createResponsesProvider(
            process.env.OPENAI_API_KEY!,
            process.env.OPENAI_MODEL!,
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
  for (const signal of ['SIGINT', 'SIGTERM'] as const)
    process.once(signal, () => {
      runtime.operations.close();
      server.close();
    });
} catch {
  log({ code: 'startup-failed', reference: randomUUID() });
  process.exitCode = 1;
}
