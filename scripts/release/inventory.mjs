import { readdir, readFile, lstat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
export const digest = (bytes) =>
  createHash('sha256').update(bytes).digest('hex');
const rootFiles = [
  '.gitattributes',
  '.dockerignore',
  '.gitignore',
  '.prettierignore',
  'eslint.config.mjs',
  'package.json',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  'tsconfig.base.json',
  'scripts/verify-release.mjs',
  'scripts/check-boundaries.mjs',
  'scripts/check-boundaries.test.mjs',
  'scripts/check-catalogue-assets.mjs',
  'scripts/run-tests.mjs',
  'scripts/isolated-mode.ts',
];
const skipped = (name) =>
  ['node_modules', 'dist', 'coverage', '.git', 'next-env.d.ts'].includes(
    name,
  ) ||
  name.startsWith('.next') ||
  name === '.release' ||
  name.endsWith('.log') ||
  name.endsWith('.tsbuildinfo') ||
  (name.startsWith('.env') && name !== '.env.example');
const binary = (p) =>
  /\.(png|jpg|jpeg|webp|glb|woff2|ico)$/.test(p) ||
  p.endsWith('/catalogue/LICENSE-Kenney.txt');
export async function collectInputs(root, retainedRoot) {
  const rows = [];
  let total = 0;
  const file = async (relative, absolute = path.join(root, relative)) => {
    const stat = await lstat(absolute);
    if (
      !stat.isFile() ||
      stat.isSymbolicLink() ||
      stat.size > 64 * 1024 * 1024 ||
      rows.length >= 5000 ||
      (total += stat.size) > 256 * 1024 * 1024
    )
      throw new Error('release-input-bound');
    const bytes = await readFile(absolute);
    if (!binary(relative) && bytes.includes(Buffer.from('\r\n')))
      throw new Error('release-input-not-lf');
    rows.push({ path: relative, bytes: bytes.length, sha256: digest(bytes) });
  };
  const walk = async (relative) => {
    for (const name of (await readdir(path.join(root, relative))).sort()) {
      if (skipped(name) || name === 'README.md') continue;
      const p = relative + '/' + name,
        stat = await lstat(path.join(root, p));
      if (stat.isSymbolicLink()) throw new Error('release-input-symlink');
      if (stat.isDirectory()) await walk(p);
      else await file(p);
    }
  };
  for (const p of rootFiles) await file(p);
  for (const p of ['apps', 'packages', 'scripts/release', '.github/workflows'])
    await walk(p);
  if (retainedRoot) {
    const retained = async (relative = '') => {
      for (const name of (
        await readdir(path.join(retainedRoot, relative))
      ).sort()) {
        if (name === 'retained-manifest.json') continue;
        const rel = relative ? relative + '/' + name : name,
          absolute = path.join(retainedRoot, rel),
          stat = await lstat(absolute);
        if (!/^(static|public)(\/|$)/.test(rel) || stat.isSymbolicLink())
          throw new Error('release-retained-input');
        if (stat.isDirectory()) await retained(rel);
        else await file('retained/' + rel, absolute);
      }
    };
    await retained();
  }
  rows.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  const identities = JSON.parse(
    await readFile(path.join(root, 'scripts/release/identities.json'), 'utf8'),
  );
  return {
    version: 1,
    kind: 'input-inventory',
    platform: 'source',
    identities,
    files: rows,
    bytes: total,
    inputDigest: digest(
      rows.map((r) => `${r.path}\0${r.bytes}\0${r.sha256}\n`).join(''),
    ),
  };
}
