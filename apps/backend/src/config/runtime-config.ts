export interface RuntimeConfig {
  releaseId: string;
  appEnv: 'development' | 'test' | 'production';
  mode: 'fake' | 'live';
  paidEnabled: boolean;
  port: number;
  host: string;
  frontendOrigin: string;
  providerConfigured: boolean;
  bridgeSecret: string;
  livePolicyReviewed: boolean;
}

/** Pure projection. Environment loading and access are confined to server.ts. */
export function parseRuntimeConfig(
  env: Readonly<Record<string, string | undefined>>,
): RuntimeConfig {
  const bool = (key: string, fallback: boolean) => {
    const value = env[key];
    if (value === undefined || value === '') return fallback;
    if (value === 'true') return true;
    if (value === 'false') return false;
    throw new Error('invalid-configuration');
  };
  const appEnv = env.APP_ENV ?? 'development';
  if (!['development', 'test', 'production'].includes(appEnv))
    throw new Error('invalid-configuration');
  const port =
    env.PORT === undefined || env.PORT === '' ? 4321 : Number(env.PORT);
  if (!Number.isInteger(port) || port < 1024 || port > 65535)
    throw new Error('invalid-configuration');
  const frontendOrigin = env.FRONTEND_ORIGIN || 'http://127.0.0.1:4320';
  const origin = new URL(frontendOrigin);
  if (
    !['http:', 'https:'].includes(origin.protocol) ||
    origin.origin !== frontendOrigin ||
    origin.username ||
    origin.password
  )
    throw new Error('invalid-configuration');
  const host = env.HOST || '127.0.0.1';
  if (host !== '127.0.0.1' && host !== '0.0.0.0')
    throw new Error('invalid-configuration');
  const bridgeSecret = env.ROOMEDY_BRIDGE_SECRET?.trim() || '';
  if (
    bridgeSecret &&
    (!/^[\x21-\x7e]{1,4096}$/.test(bridgeSecret) ||
      (appEnv === 'production' && bridgeSecret.length < 32))
  )
    throw new Error('invalid-configuration');
  const releaseId = env.ROOMEDY_RELEASE_ID ?? '';
  if (releaseId && !/^[a-f0-9]{64}$/.test(releaseId))
    throw new Error('invalid-configuration');
  return {
    releaseId,
    appEnv: appEnv as RuntimeConfig['appEnv'],
    mode: bool('FAKE_MODE', true) ? 'fake' : 'live',
    paidEnabled: bool('PAID_DEMO_ENABLED', false),
    port,
    host,
    frontendOrigin,
    providerConfigured: Boolean(
      env.OPENAI_API_KEY?.trim() && env.OPENAI_MODEL?.trim(),
    ),
    bridgeSecret,
    livePolicyReviewed: bool('LIVE_POLICY_REVIEWED', false),
  };
}
