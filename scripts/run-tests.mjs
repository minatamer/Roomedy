import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Child environment is fixed before Vitest or any application import. Never load .env.local.
const env = {
  ...process.env,
  APP_ENV: 'test',
  FAKE_MODE: 'true',
  PAID_DEMO_ENABLED: 'false',
  OPENAI_API_KEY: '',
  OPENAI_MODEL: '',
  NEXT_TELEMETRY_DISABLED: '1',
};
const result = spawnSync(
  process.execPath,
  [
    fileURLToPath(
      new URL('../node_modules/vitest/vitest.mjs', import.meta.url),
    ),
    'run',
    ...process.argv.slice(2),
  ],
  { env, stdio: 'inherit' },
);
process.exitCode = result.status ?? 1;
