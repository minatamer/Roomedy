import { readdir, readFile, lstat, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
export async function inspectRuntime(root, service) {
  let files = 0,
    bytes = 0,
    privateFiles = 0,
    workers = 0,
    assets = 0;
  const visit = async (relative = '') => {
    for (const name of await readdir(path.join(root, relative))) {
      const rel = relative ? relative + '/' + name : name,
        absolute = path.join(root, rel),
        stat = await lstat(absolute);
      if (++files > 50_000) throw new Error('release-runtime-bound');
      if (stat.isSymbolicLink()) {
        const resolved = await realpath(absolute),
          base = path.resolve(root) + path.sep;
        if (!resolved.startsWith(base))
          throw new Error('release-runtime-external-link');
        continue;
      }
      if (stat.isDirectory()) {
        await visit(rel);
        continue;
      }
      bytes += stat.size;
      if (bytes > 1024 * 1024 * 1024) throw new Error('release-runtime-bound');
      if (
        /(^|\/)(\.env[^/]*|test|tests|docs|\.git)(\/|$)|PRIVATE_CANARY/.test(
          rel,
        ) &&
        !rel.includes('node_modules/')
      )
        privateFiles++;
      if (!rel.includes('node_modules/') && /(^|\/)src\//.test(rel))
        privateFiles++;
      if (/\.glb$|\.woff2$|catalogue\/thumbnails\/.*\.svg$/.test(rel)) assets++;
      if (rel.includes('/static/') && rel.endsWith('.js')) {
        const body = await readFile(absolute, 'utf8');
        if (
          body.includes('searchMessageBytes') &&
          body.includes('input-limit') &&
          body.includes('onmessage')
        )
          workers++;
      }
    }
  };
  await visit();
  if (privateFiles || (service === 'frontend' && (!workers || assets < 10)))
    throw new Error('release-runtime-missing-or-private');
  const executable = path.join(
    root,
    service === 'backend' ? 'dist/server.js' : 'apps/frontend/server.js',
  );
  await lstat(executable);
  return { service, files, bytes, privateFiles, workers, assets };
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const service = process.argv[2];
    if (
      !['frontend', 'backend'].includes(service) ||
      process.platform !== 'linux' ||
      process.getuid() === 0
    )
      throw new Error('release-runtime-platform');
    const result = await inspectRuntime(process.cwd(), service);
    if (service === 'backend') {
      await import('@roomedy/contracts/policy');
      await import('@roomedy/spatial');
      await import('sharp');
    }
    console.log(
      JSON.stringify({
        kind: 'linux-package-probe',
        platform: 'linux/amd64',
        nonRoot: true,
        node: process.versions.node,
        arch: process.arch,
        ...result,
      }),
    );
  } catch {
    console.error(JSON.stringify({ error: 'release-runtime-failed' }));
    process.exitCode = 1;
  }
}
