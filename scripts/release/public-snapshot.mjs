import { mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

/** Extract only public assets, with one verified container owner and bounded Docker calls. */
export async function snapshotPublicAssets(image, target, io = {}) {
  if (!/^roomedy-frontend:[a-f0-9]{64}$/.test(image))
    throw new Error('release-asset-snapshot');
  const run = io.run ?? spawnSync,
    makeDirectory = io.mkdir ?? mkdir,
    now = io.now ?? Date.now,
    deadline = now() + 120_000;
  const command = (args) => {
    const remaining = deadline - now();
    if (remaining <= 0) throw new Error('release-asset-snapshot-deadline');
    const result = run('docker', args, {
      encoding: 'utf8',
      timeout: Math.min(45_000, remaining),
      killSignal: 'SIGKILL',
      maxBuffer: 64 * 1024,
    });
    if (result.status !== 0) throw new Error('release-asset-snapshot');
    return result.stdout.trim();
  };
  const cid = command(['create', image]);
  if (!/^[a-f0-9]{64}$/.test(cid)) throw new Error('release-asset-snapshot');
  try {
    await makeDirectory(target, { recursive: true });
    for (const [source, name] of [
      ['/app/apps/frontend/.next/static', 'static'],
      ['/app/apps/frontend/public', 'public'],
    ])
      command(['cp', `${cid}:${source}`, path.join(target, name)]);
  } finally {
    // Cleanup has its own reserve even when extraction consumed its deadline.
    const removed = run('docker', ['rm', '--force', cid], {
      encoding: 'utf8',
      timeout: 15_000,
      killSignal: 'SIGKILL',
      maxBuffer: 64 * 1024,
    });
    if (removed.status !== 0) throw new Error('release-asset-cleanup');
  }
}
