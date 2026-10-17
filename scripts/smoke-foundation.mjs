import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const root = fileURLToPath(new URL('../', import.meta.url));
const logs = mkdtempSync(path.join(tmpdir(), 'roomedy-foundation-'));
const children = [];
const env = {
  ...process.env,
  FAKE_MODE: 'true',
  PAID_DEMO_ENABLED: 'false',
  OPENAI_API_KEY: '',
  OPENAI_MODEL: '',
  PORT: '4321',
  HOST: '127.0.0.1',
  FRONTEND_ORIGIN: 'http://127.0.0.1:4320',
  ROOMEDY_BACKEND_ORIGIN: 'http://127.0.0.1:4321',
  NEXT_TELEMETRY_DISABLED: '1',
};

async function freePort(port) {
  const probe = createServer();
  await new Promise((resolve, reject) => {
    probe.once('error', reject);
    probe.listen(port, '127.0.0.1', resolve);
  });
  await new Promise((resolve, reject) =>
    probe.close((e) => (e ? reject(e) : resolve())),
  );
}
function start(name, args, cwd) {
  const child = spawn(process.execPath, args, {
    cwd,
    env,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  for (const stream of [child.stdout, child.stderr])
    stream.on('data', (chunk) => {
      output = (output + chunk.toString()).slice(-16384);
    });
  child.once('error', () => {
    output += '\nlaunch-failed';
  });
  children.push({
    child,
    name,
    flush: () => writeFileSync(path.join(logs, `${name}.log`), output),
  });
  writeFileSync(
    path.join(logs, 'ownership.json'),
    JSON.stringify({
      root,
      supervisor: process.pid,
      children: children.map(({ child, name }) => ({ name, pid: child.pid })),
    }),
  );
  return child;
}
async function ready(url, child) {
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error('service-exited');
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(1000) });
      if (r.ok) return r;
    } catch {
      /* bounded readiness wait */
    }
    await delay(150);
  }
  throw new Error('readiness-deadline');
}
try {
  // Occupied ports fail closed. No pre-existing service is reused or stopped by a test.
  await freePort(4320);
  await freePort(4321);
  const backend = start(
    'backend',
    ['dist/server.js'],
    path.join(root, 'apps/backend'),
  );
  await ready('http://127.0.0.1:4321/v1/health', backend);
  const frontend = start(
    'frontend',
    [
      'node_modules/next/dist/bin/next',
      'start',
      '--hostname',
      '127.0.0.1',
      '--port',
      '4320',
    ],
    path.join(root, 'apps/frontend'),
  );
  const page = await ready('http://127.0.0.1:4320', frontend);
  assert.match(await page.text(), /Simulated preview/);
  for (const operation of ['health', 'ready', 'config']) {
    const response = await fetch(
      `http://127.0.0.1:4320/api/roomedy/v1/${operation}`,
    );
    assert.equal(response.status, 200);
    const text = await response.text();
    assert.doesNotMatch(text, /OPENAI|4321|providerConfigured|frontendOrigin/);
    if (operation === 'config')
      assert.deepEqual(JSON.parse(text).capabilities, {
        manual: true,
        recognition: false,
        assistant: false,
        simulation: true,
      });
  }
  console.info('Local page and fixed API bridge passed in fake/paid-off mode.');
} finally {
  for (const { child, flush } of children.toReversed()) {
    if (child.exitCode === null && child.signalCode === null) {
      const exited = once(child, 'exit');
      child.kill();
      await Promise.race([
        exited,
        delay(3000).then(() => {
          if (child.exitCode === null && child.signalCode === null)
            child.kill('SIGKILL');
        }),
      ]);
      if (child.exitCode === null && child.signalCode === null)
        await once(child, 'exit');
    }
    flush();
  }
  await delay(300);
  await freePort(4320);
  await freePort(4321);
  console.info(
    `Owned test processes exited; ports released. Private logs: ${logs}`,
  );
}
