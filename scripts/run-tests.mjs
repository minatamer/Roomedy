import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Child environment is fixed before Vitest or any application import. Never load .env.local.
const env = {
  ...process.env,
  APP_ENV: 'test',
  FAKE_MODE: 'true',
  PAID_DEMO_ENABLED: 'false',
  ROOMEDY_RELEASE_ID: '',
  NEXT_PUBLIC_ROOMEDY_RELEASE_ID: '',
  OPENAI_API_KEY: '',
  OPENAI_MODEL: '',
  ROOMEDY_BRIDGE_SECRET: '',
  LIVE_POLICY_REVIEWED: 'false',
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
