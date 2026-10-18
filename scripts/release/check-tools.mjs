import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
export async function toolsReady(linux = false) {
  const ids = JSON.parse(
    await readFile(new URL('./identities.json', import.meta.url), 'utf8'),
  );
  const manifest = JSON.parse(
    await readFile(new URL('../../package.json', import.meta.url), 'utf8'),
  );
  if (
    process.versions.node !== ids.node ||
    manifest.packageManager !== 'pnpm@' + ids.pnpm
  )
    throw new Error('release-tool-version');
  if (linux) {
    const docker = spawnSync('docker', ['info', '--format', '{{.OSType}}'], {
      encoding: 'utf8',
      timeout: 10_000,
    });
    if (docker.status !== 0 || docker.stdout.trim() !== 'linux')
      throw new Error('release-linux-daemon-unavailable');
  }
  return ids;
}
