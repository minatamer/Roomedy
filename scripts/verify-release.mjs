import { readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { collectInputs } from './release/inventory.mjs';
import { verifyProof } from './release/proof.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
try {
  const [mode, ...args] = process.argv.slice(2);
  if (!['inventory', 'verify'].includes(mode))
    throw new Error('release-options');
  const values = new Map();
  for (let i = 0; i < args.length; i += 2) {
    if (
      !['--out', '--proof', '--frontend', '--backend', '--retained'].includes(
        args[i],
      ) ||
      values.has(args[i]) ||
      !args[i + 1]
    )
      throw new Error('release-options');
    values.set(args[i], args[i + 1]);
  }
  const inventory = await collectInputs(root, values.get('--retained'));
  if (mode === 'inventory') {
    if (values.has('--out'))
      await writeFile(
        values.get('--out'),
        JSON.stringify(inventory, null, 2) + '\n',
      );
    console.log(
      JSON.stringify({
        kind: inventory.kind,
        inputDigest: inventory.inputDigest,
        files: inventory.files.length,
        bytes: inventory.bytes,
        linuxRuntimeVerified: false,
      }),
    );
  } else {
    if (
      !values.has('--proof') ||
      !values.has('--frontend') ||
      !values.has('--backend')
    )
      throw new Error('release-proof-required');
    const raw = await readFile(values.get('--proof'));
    if (raw.length > 1024 * 1024) throw new Error('release-proof-bound');
    const observed = { platform: 'linux/amd64', images: {} };
    for (const name of ['frontend', 'backend']) {
      const result = spawnSync(
        'docker',
        ['image', 'inspect', values.get('--' + name)],
        { encoding: 'utf8', timeout: 10_000, maxBuffer: 1024 * 1024 },
      );
      if (result.status !== 0)
        throw new Error('release-linux-observation-required');
      const rows = JSON.parse(result.stdout);
      if (
        rows.length !== 1 ||
        rows[0].Os !== 'linux' ||
        rows[0].Architecture !== 'amd64'
      )
        throw new Error('release-linux-observation-required');
      const r = rows[0];
      observed.images[name] = {
        id: r.Id,
        inputDigest: r.Config.Labels?.['org.roomedy.input-digest'],
        user: r.Config.User,
      };
    }
    console.log(
      JSON.stringify(
        verifyProof(inventory, JSON.parse(raw.toString('utf8')), observed),
      ),
    );
  }
} catch (error) {
  console.error(
    JSON.stringify({
      error:
        error instanceof Error && /^release-[a-z-]+$/.test(error.message)
          ? error.message
          : 'release-verification-failed',
      linuxRuntimeVerified: false,
    }),
  );
  process.exitCode = 1;
}
