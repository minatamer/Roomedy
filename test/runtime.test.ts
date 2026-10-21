import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { publicConfigSchema } from '@roomedy/contracts/api';
import { parseRuntimeConfig } from '../apps/backend/src/config/runtime-config.js';
import { createRuntime } from '../apps/backend/src/runtime/create-runtime.js';
import { createApp } from '../apps/backend/src/http/create-app.js';

const dependencies = () => ({
  now: () => 100,
  nextId: () => 'request-test',
  log: () => undefined,
});
describe('safe runtime composition', () => {
  it('defaults to fake/paid-off without importing configuration effects', () => {
    expect(parseRuntimeConfig({})).toMatchObject({
      mode: 'fake',
      paidEnabled: false,
      port: 4321,
    });
    expect(process.env.FAKE_MODE).toBe('true');
    expect(process.env.PAID_DEMO_ENABLED).toBe('false');
    expect(process.env.OPENAI_API_KEY).toBeUndefined();
  });
  it.each([
    { FAKE_MODE: 'false', PAID_DEMO_ENABLED: 'true' },
    {
      FAKE_MODE: 'false',
      PAID_DEMO_ENABLED: 'true',
      OPENAI_API_KEY: 'private-test-marker',
      OPENAI_MODEL: 'private-model',
    },
    { FAKE_MODE: 'true', PAID_DEMO_ENABLED: 'false' },
  ])(
    'health is independent of AI and no route dispatches under %j',
    async (env) => {
      let calls = 0;
      const provider = {
        kind: 'live' as const,
        get meteredDispatches() {
          return calls;
        },
        start() {
          calls++;
          throw new Error('must never dispatch');
        },
      };
      const runtime = createRuntime(parseRuntimeConfig(env), {
        ...dependencies(),
        provider,
      });
      const app = createApp(runtime);
      expect((await request(app).get('/v1/health')).body).toEqual({
        status: 'ok',
      });
      expect((await request(app).get('/v1/ready')).body.status).toBe('ok');
      const response = await request(app).get('/v1/config');
      expect(publicConfigSchema.safeParse(response.body).success).toBe(true);
      expect(response.text).not.toMatch(
        /private-test-marker|private-model|frontendOrigin|providerConfigured/,
      );
      expect(response.body.capabilities).toMatchObject({
        manual: true,
        recognition: false,
        assistant: false,
      });
      for (const route of ['admission', 'recognize-room', 'assistant'])
        expect(
          (
            await request(app)
              .post(`/v1/${route}`)
              .send({ origin: 'trusted', paid: true })
          ).status,
        ).toBe(503);
      expect(calls).toBe(0);
      expect(runtime.meteredDispatches()).toBe(0);
    },
  );
  it('reports missing live prerequisites without silently changing mode', () => {
    const runtime = createRuntime(
      parseRuntimeConfig({ FAKE_MODE: 'false', PAID_DEMO_ENABLED: 'true' }),
      dependencies(),
    );
    expect(runtime.publicConfig.mode).toBe('live');
    expect(runtime.readiness.ai).toBe('missing-configuration');
  });
  it('needs only a provider key because the model is pinned in code', () => {
    expect(
      parseRuntimeConfig({ OPENAI_API_KEY: 'synthetic-key' })
        .providerConfigured,
    ).toBe(true);
    expect(
      parseRuntimeConfig({ OPENAI_API_KEY: 'synthetic-key', OPENAI_MODEL: '' })
        .providerConfigured,
    ).toBe(true);
    expect(
      parseRuntimeConfig({ OPENAI_MODEL: 'untrusted-override' })
        .providerConfigured,
    ).toBe(false);
  });
  it('rejects malformed booleans, origin and ports with content-free errors', () => {
    for (const env of [
      { FAKE_MODE: 'yes' },
      { PORT: '1.5' },
      { FRONTEND_ORIGIN: 'https://secret@example.com' },
      { TURNSTILE_SITE_KEY: 'bad site key' },
      { TURNSTILE_SECRET_KEY: 'bad\nsecret' },
    ])
      expect(() => parseRuntimeConfig(env)).toThrow('invalid-configuration');
  });
  it('denies external transport before app imports can spend', async () => {
    await expect(fetch('https://api.openai.com/v1/responses')).rejects.toThrow(
      'test-network-denied',
    );
  });
});
