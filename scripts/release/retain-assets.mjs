import { readdir, readFile, mkdir, writeFile, lstat } from 'node:fs/promises';
import path from 'node:path';
import { digest } from './inventory.mjs';
/** Public files only. Conflicting old paths fail; version/rename assets before rolling forward. */
export async function retainAssets(current, previous, target) {
  const rows = new Map();
  let total = 0;
  const visit = async (root, relative = '') => {
    for (const name of (await readdir(path.join(root, relative))).sort()) {
      if (name === 'retained-manifest.json') continue;
      const rel = relative ? relative + '/' + name : name;
      if (
        !/^(static|public)(\/|$)/.test(rel) ||
        /(^|\/)(\.env[^/]*|node_modules|src|test|docs|\.git)(\/|$)|\.(pem|key)$|PRIVATE_CANARY/.test(
          rel,
        )
      )
        throw new Error('release-retained-private');
      const stat = await lstat(path.join(root, rel));
      if (stat.isSymbolicLink()) throw new Error('release-retained-symlink');
      if (stat.isDirectory()) {
        await visit(root, rel);
        continue;
      }
      if (
        !stat.isFile() ||
        stat.size > 16 * 1024 * 1024 ||
        rows.size >= 2000 ||
        (total += stat.size) > 128 * 1024 * 1024
      )
        throw new Error('release-retained-bound');
      const bytes = await readFile(path.join(root, rel)),
        sha256 = digest(bytes),
        old = rows.get(rel);
      if (old && old.sha256 !== sha256)
        throw new Error('release-retained-conflict');
      rows.set(rel, { path: rel, bytes: bytes.length, sha256 });
      await mkdir(path.dirname(path.join(target, rel)), { recursive: true });
      await writeFile(path.join(target, rel), bytes);
    }
  };
  await mkdir(path.join(target, 'static'), { recursive: true });
  await mkdir(path.join(target, 'public'), { recursive: true });
  if (previous) {
    const raw = await readFile(path.join(previous, 'retained-manifest.json'));
    if (raw.length > 1024 * 1024) throw new Error('release-retained-bound');
    const manifest = JSON.parse(raw.toString('utf8'));
    if (!Array.isArray(manifest.files) || manifest.files.length > 2000)
      throw new Error('release-retained-bound');
    if (
      manifest.version !== 1 ||
      !Number.isSafeInteger(manifest.createdAt) ||
      Date.now() - manifest.createdAt > 7_800_000 ||
      manifest.createdAt > Date.now() + 60_000
    )
      throw new Error('release-retained-age');
    await visit(previous);
    const expected = new Map(manifest.files.map((r) => [r.path, r.sha256]));
    if (
      expected.size !== rows.size ||
      [...rows.values()].some((r) => expected.get(r.path) !== r.sha256)
    )
      throw new Error('release-retained-hash');
  }
  if (current) await visit(current);
  const files = [...rows.values()].sort((a, b) =>
    a.path < b.path ? -1 : a.path > b.path ? 1 : 0,
  );
  const result = { version: 1, createdAt: Date.now(), files };
  await writeFile(
    path.join(target, 'retained-manifest.json'),
    JSON.stringify(result, null, 2) + '\n',
  );
  return result;
}
