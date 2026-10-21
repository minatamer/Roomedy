import { mkdir, mkdtemp, writeFile, cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { collectInputs } from './inventory.mjs';
import { retainAssets } from './retain-assets.mjs';
import { toolsReady } from './check-tools.mjs';
import { snapshotPublicAssets } from './public-snapshot.mjs';
const root = fileURLToPath(new URL('../../', import.meta.url));
try {
  const args = process.argv.slice(2);
  let execute = false,
    previous;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--execute' && !execute) execute = true;
    else if (args[i] === '--previous' && !previous && args[i + 1])
      previous = path.resolve(args[++i]);
    else throw new Error('release-options');
  }
  const ids = await toolsReady(execute);
  if (!execute) {
    const inventory = await collectInputs(root, previous);
    console.log(
      JSON.stringify({
        dryRun: true,
        platform: ids.platform,
        inputDigest: inventory.inputDigest,
        services: ['frontend', 'backend'],
        push: false,
        deploy: false,
        live: false,
        previousAssets: !!previous,
      }),
    );
  } else {
    await mkdir(path.join(root, '.release'), { recursive: true });
    const run = await mkdtemp(path.join(root, '.release/run-'));
    const retained = path.join(run, 'retained');
    await retainAssets(null, previous, retained);
    const inventory = await collectInputs(root, retained),
      id = inventory.inputDigest;
    await writeFile(
      path.join(run, 'inputs.json'),
      JSON.stringify(inventory, null, 2) + '\n',
    );
    for (const service of ['backend', 'frontend']) {
      const args = [
        'buildx',
        'build',
        '--load',
        '--platform',
        ids.platform,
        '--build-arg',
        `ROOMEDY_RELEASE_ID=${id}`,
        '--tag',
        `roomedy-${service}:${id}`,
        '--file',
        `apps/${service}/Dockerfile`,
      ];
      if (service === 'frontend')
        args.push('--build-context', `previous-assets=${retained}`);
      args.push('.');
      const built = spawnSync('docker', args, {
        cwd: root,
        stdio: 'inherit',
        timeout: 20 * 60 * 1000,
      });
      if (built.status !== 0) throw new Error('release-image-build');
    }
    const proof = spawnSync(
      process.execPath,
      [
        fileURLToPath(new URL('./probe.mjs', import.meta.url)),
        '--frontend',
        `roomedy-frontend:${id}`,
        '--backend',
        `roomedy-backend:${id}`,
        '--retained',
        retained,
        '--out',
        path.join(run, 'proof.json'),
      ],
      { cwd: root, stdio: 'inherit', timeout: 20 * 60 * 1000 },
    );
    if (proof.status !== 0) throw new Error('release-probe-failed');
    // Export only the final image's public web assets for a later bounded compatible rollout.
    const current = path.join(run, 'current');
    await snapshotPublicAssets(`roomedy-frontend:${id}`, current);
    await retainAssets(current, null, path.join(run, 'snapshot'));
    // Preserve exact verified context next to the proof; no cleanup outside this owned run.
    await cp(retained, path.join(run, 'verified-retained'), {
      recursive: true,
      errorOnExist: true,
      force: false,
    });
    console.log(
      JSON.stringify({
        kind: 'local-linux-build',
        inputDigest: id,
        runDirectory: path.relative(root, run).replaceAll('\\', '/'),
        hosted: false,
        live: false,
      }),
    );
  }
} catch (error) {
  console.error(
    JSON.stringify({
      error:
        error instanceof Error && /^release-[a-z-]+$/.test(error.message)
          ? error.message
          : 'release-build-failed',
      push: false,
      deploy: false,
      live: false,
    }),
  );
  process.exitCode = 1;
}
