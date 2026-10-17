import { expect, it, vi } from 'vitest';
import net from 'node:net';

it('factory imports under hostile flags have no listener/provider/env-loader side effects', async () => {
  const listen = vi
    .spyOn(net.Server.prototype, 'listen')
    .mockImplementation(() => {
      throw new Error('import-listened');
    });
  const env = { ...process.env };
  process.env.FAKE_MODE = 'false';
  process.env.PAID_DEMO_ENABLED = 'true';
  process.env.OPENAI_API_KEY = 'synthetic-hostile-key';
  try {
    vi.resetModules();
    await import('../apps/backend/src/http/create-app.js');
    await import('../apps/backend/src/runtime/create-runtime.js');
    await import('@roomedy/contracts/room');
    await import('@roomedy/spatial');
    expect(listen).not.toHaveBeenCalled();
    expect(process.env.FAKE_MODE).toBe('false');
    expect(process.env.OPENAI_API_KEY).toBe('synthetic-hostile-key');
  } finally {
    process.env = env;
  }
});
