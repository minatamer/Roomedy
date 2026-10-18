import { readFile, writeFile, unlink, mkdtemp, rmdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
const config = JSON.parse(
  await readFile(new URL('./identities.json', import.meta.url), 'utf8'),
);
if (process.platform !== 'linux') throw new Error('release-installer-platform');
if (process.versions.node !== config.node)
  throw new Error('release-node-version');
const response = await fetch(
  `https://registry.npmjs.org/pnpm/-/pnpm-${config.pnpm}.tgz`,
  { redirect: 'error', signal: AbortSignal.timeout(30_000) },
);
if (!response.ok || !response.body) throw new Error('release-installer');
const reader = response.body.getReader(),
  parts = [];
let n = 0,
  count = 0;
try {
  while (true) {
    const p = await reader.read();
    if (p.done) break;
    if ((n += p.value.length) > 8 * 1024 * 1024 || ++count > 8192)
      throw new Error('release-installer-bound');
    parts.push(p.value);
  }
} finally {
  await reader.cancel();
  reader.releaseLock();
}
const bytes = Buffer.concat(parts);
if (
  'sha512-' + createHash('sha512').update(bytes).digest('base64') !==
  config.pnpmIntegrity
)
  throw new Error('release-installer-integrity');
const temporary = await mkdtemp(path.join(tmpdir(), 'roomedy-pnpm-'));
const archive = path.join(temporary, 'pnpm.tgz');
try {
  await writeFile(archive, bytes, { flag: 'wx' });
  const result = spawnSync(
    'npm',
    ['install', '--global', '--ignore-scripts', archive],
    { stdio: 'inherit' },
  );
  if (result.status !== 0) throw new Error('release-installer');
} finally {
  await unlink(archive).catch(() => undefined);
  await rmdir(temporary).catch(() => undefined);
}
