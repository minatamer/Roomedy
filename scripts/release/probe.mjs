import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import net from 'node:net';
import path from 'node:path';
import { collectInputs, digest } from './inventory.mjs';
import { verifyProof, requiredProbes, readProbeBody } from './proof.mjs';
const root = fileURLToPath(new URL('../../', import.meta.url));
const deadline = Date.now() + 180_000;
const run = (args) => {
  if (Date.now() >= deadline) throw new Error('release-probe-deadline');
  const r = spawnSync('docker', args, {
    encoding: 'utf8',
    timeout: Math.max(1, Math.min(45_000, deadline - Date.now())),
    maxBuffer: 2 * 1024 * 1024,
  });
  if (r.status !== 0) throw new Error('release-docker-probe');
  return r.stdout.trim();
};
const values = new Map();
const owned = [];
let network;
try {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i += 2) {
    if (
      !['--frontend', '--backend', '--out', '--retained'].includes(args[i]) ||
      values.has(args[i]) ||
      !args[i + 1]
    )
      throw new Error('release-options');
    values.set(args[i], args[i + 1]);
  }
  if (
    !values.has('--frontend') ||
    !values.has('--backend') ||
    !values.has('--out')
  )
    throw new Error('release-options');
  const inventory = await collectInputs(root, values.get('--retained')),
    id = inventory.inputDigest;
  const inspect = () => {
    const images = {};
    for (const service of ['frontend', 'backend']) {
      const r = JSON.parse(
        run(['image', 'inspect', values.get('--' + service)]),
      )[0];
      if (r.Os !== 'linux' || r.Architecture !== 'amd64')
        throw new Error('release-linux-observation-required');
      images[service] = {
        id: r.Id,
        user: r.Config.User,
        inputDigest: r.Config.Labels?.['org.roomedy.input-digest'],
      };
    }
    return { platform: 'linux/amd64', images };
  };
  const observed = inspect();
  for (const v of Object.values(observed.images))
    if (v.inputDigest !== id || v.user !== 'node')
      throw new Error('release-image-mismatch');
  const port = await new Promise((resolve, reject) => {
    const s = net.createServer();
    s.once('error', reject);
    s.listen(0, '127.0.0.1', () => {
      const port = s.address().port;
      s.close(() => resolve(port));
    });
  });
  const origin = `http://127.0.0.1:${port}`,
    nonce = randomBytes(6).toString('hex'),
    secret = randomBytes(32).toString('hex');
  network = `roomedy-release-${nonce}`;
  run(['network', 'create', '--internal', network]);
  const launch = (service, extra) => {
    const name = `roomedy-${service}-${nonce}`;
    const flags = [
      'run',
      '--detach',
      '--name',
      name,
      '--network',
      network,
      '--cap-drop',
      'ALL',
      '--security-opt',
      'no-new-privileges',
      '--memory',
      '512m',
      '--cpus',
      '1',
      '--pids-limit',
      '128',
      '--read-only',
      '--tmpfs',
      '/tmp:rw,nosuid,size=67108864',
      '--env',
      `ROOMEDY_BRIDGE_SECRET=${secret}`,
      '--env',
      `ROOMEDY_RELEASE_ID=${id}`,
      ...extra,
      values.get('--' + service),
    ];
    run(flags);
    owned.push(name);
    return name;
  };
  const backend = launch('backend', [
    '--network-alias',
    'backend',
    '--env',
    'FAKE_MODE=true',
    '--env',
    'PAID_DEMO_ENABLED=false',
    '--env',
    `FRONTEND_ORIGIN=${origin}`,
  ]);
  const frontend = launch('frontend', [
    '--publish',
    `127.0.0.1:${port}:8080`,
    '--env',
    'ROOMEDY_BACKEND_ORIGIN=http://backend:8080',
    '--env',
    `ROOMEDY_PUBLIC_ORIGIN=${origin}`,
    '--env',
    'ROOMEDY_SERVICE_IDENTITY=none',
    '--tmpfs',
    '/app/apps/frontend/.next/cache:rw,nosuid,size=33554432',
  ]);
  const get = async (url) => {
    if (Date.now() >= deadline) throw new Error('release-probe-deadline');
    const r = await fetch(origin + url, {
      redirect: 'error',
      signal: AbortSignal.timeout(
        Math.max(1, Math.min(3000, deadline - Date.now())),
      ),
    });
    if (!r.ok) throw new Error('release-http-probe');
    return r;
  };
  let ready = false;
  for (let i = 0; i < 30; i++) {
    try {
      await get('/api/roomedy/v1/health');
      ready = true;
      break;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  if (!ready) throw new Error('release-readiness');
  const packages = {};
  for (const [service, name] of [
    ['frontend', frontend],
    ['backend', backend],
  ]) {
    const r = JSON.parse(
      run(['exec', name, 'node', 'check-runtime.mjs', service]),
    );
    if (
      r.node !== inventory.identities.node ||
      r.arch !== 'x64' ||
      !r.nonRoot ||
      r.privateFiles !== 0
    )
      throw new Error('release-package-probe');
    packages[service] = r;
  }
  const health = await get('/api/roomedy/v1/health');
  if (
    JSON.parse((await readProbeBody(health, 16_384)).toString('utf8'))
      .status !== 'ok' ||
    health.headers.get('cache-control') !== 'no-store'
  )
    throw new Error('release-health');
  const readiness = JSON.parse(
      (
        await readProbeBody(await get('/api/roomedy/v1/ready'), 16_384)
      ).toString('utf8'),
    ),
    config = JSON.parse(
      (
        await readProbeBody(await get('/api/roomedy/v1/config'), 16_384)
      ).toString('utf8'),
    );
  if (
    readiness.ai !== 'fake-ready' ||
    config.mode !== 'fake' ||
    !config.capabilities.simulation
  )
    throw new Error('release-mode');
  const html = (await readProbeBody(await get('/'), 1024 * 1024)).toString(
    'utf8',
  );
  if (!html.includes('Roomedy') || html.length > 1024 * 1024)
    throw new Error('release-landing');
  const anonymous = run([
    'exec',
    frontend,
    'node',
    '--input-type=module',
    '-e',
    `const r=await fetch('http://backend:8080/v1/admission',{method:'POST',headers:{'Content-Type':'application/json','Origin':${JSON.stringify(origin)},'X-Roomedy-Release':${JSON.stringify(id)}},body:'{}'});console.log(r.status)`,
  ]);
  if (anonymous !== '403') throw new Error('release-private-denial');
  // Read/hash every emitted public chunk/worker/asset from the actual image and HTTP service.
  const publicRows = JSON.parse(
    run([
      'exec',
      frontend,
      'node',
      '--input-type=module',
      '-e',
      `import fs from 'node:fs';import crypto from 'node:crypto';const rows=[];function walk(p,u){for(const d of fs.readdirSync(p,{withFileTypes:true})){const f=p+'/'+d.name,v=u+'/'+d.name;if(d.isDirectory())walk(f,v);else if(d.isFile())rows.push({url:v,bytes:fs.statSync(f).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')});if(rows.length>2000)throw Error('bound')}}walk('/app/apps/frontend/.next/static','/_next/static');walk('/app/apps/frontend/public','');console.log(JSON.stringify(rows));`,
    ]),
  );
  for (const row of publicRows) {
    if (row.bytes > 16 * 1024 * 1024) throw new Error('release-asset-bound');
    const r = await get(row.url);
    const body = await readProbeBody(r, row.bytes);
    if (body.length !== row.bytes || digest(body) !== row.sha256)
      throw new Error('release-asset-probe');
  }
  for (const name of owned) {
    run(['stop', '--time', '12', name]);
    const exit = Number(
      run(['inspect', '--format', '{{.State.ExitCode}}', name]),
    );
    if (exit !== 0) throw new Error('release-shutdown');
  }
  const proof = {
    version: 1,
    kind: 'linux-runtime',
    platform: 'linux/amd64',
    date: new Date().toISOString(),
    inputDigest: id,
    identities: inventory.identities,
    images: observed.images,
    probes: requiredProbes.map((name) => ({ name, passed: true })),
    packages,
    publicAssets: publicRows.length,
    hosted: false,
    live: false,
  };
  verifyProof(inventory, proof, inspect());
  await mkdir(path.dirname(path.resolve(values.get('--out'))), {
    recursive: true,
  });
  await writeFile(values.get('--out'), JSON.stringify(proof, null, 2) + '\n');
  console.log(
    JSON.stringify({
      kind: 'linux-runtime-proof',
      inputDigest: id,
      probes: proof.probes.length,
      assets: publicRows.length,
      paidDispatches: 0,
      hosted: false,
    }),
  );
} catch (error) {
  console.error(
    JSON.stringify({
      error:
        error instanceof Error && /^release-[a-z-]+$/.test(error.message)
          ? error.message
          : 'release-probe-failed',
      linuxRuntimeVerified: false,
    }),
  );
  process.exitCode = 1;
} finally {
  for (const name of owned) {
    spawnSync('docker', ['rm', '--force', name], {
      stdio: 'ignore',
      timeout: 15_000,
    });
  }
  if (network)
    spawnSync('docker', ['network', 'rm', network], {
      stdio: 'ignore',
      timeout: 10_000,
    });
}
