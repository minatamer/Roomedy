import { it, expect, afterEach } from 'vitest';
import {
  mkdtemp,
  readFile,
  mkdir,
  writeFile,
  copyFile,
  rm,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
interface Inventory {
  version: number;
  kind: string;
  inputDigest: string;
  identities: Record<string, unknown>;
  files: { path: string; bytes: number; sha256: string }[];
  bytes: number;
}
const inventoryModule = new URL(
  '../scripts/release/inventory.mjs',
  import.meta.url,
).href;
const proofModule = new URL('../scripts/release/proof.mjs', import.meta.url)
  .href;
const retainModule = new URL(
  '../scripts/release/retain-assets.mjs',
  import.meta.url,
).href;
const runtimeModule = new URL(
  '../scripts/release/check-runtime.mjs',
  import.meta.url,
).href;
const snapshotModule = new URL(
  '../scripts/release/public-snapshot.mjs',
  import.meta.url,
).href;
const httpModule = new URL('../scripts/release/http-probe.mjs', import.meta.url)
  .href;
const { runHttpProbes } = (await import(httpModule)) as {
  runHttpProbes: (
    rows: { url: string; bytes: number; sha256: string }[],
    fetcher: typeof fetch,
    options: { pause: () => Promise<void> },
  ) => Promise<{ assets: number; http: boolean }>;
};
type SnapshotRunner = (
  command: string,
  args: string[],
  options: { timeout: number; maxBuffer: number; killSignal: string },
) => { status: number | null; stdout: string };
const { snapshotPublicAssets } = (await import(snapshotModule)) as {
  snapshotPublicAssets: (
    image: string,
    target: string,
    io: { run: SnapshotRunner; mkdir: () => Promise<void>; now?: () => number },
  ) => Promise<void>;
};
const { collectInputs } = (await import(inventoryModule)) as {
  collectInputs: (root: string, retained?: string) => Promise<Inventory>;
};
const { verifyProof, requiredProbes, readProbeBody } = (await import(
  proofModule
)) as {
  verifyProof: (
    inventory: Inventory,
    proof: unknown,
    inspected: unknown,
  ) => unknown;
  requiredProbes: string[];
  readProbeBody: (response: Response, maximum: number) => Promise<Uint8Array>;
};
const { retainAssets } = (await import(retainModule)) as {
  retainAssets: (
    current: string | null,
    previous: string | null,
    target: string,
  ) => Promise<unknown>;
};
const { inspectRuntime } = (await import(runtimeModule)) as {
  inspectRuntime: (
    root: string,
    service: string,
  ) => Promise<{ privateFiles: number }>;
};
const owned: string[] = [];

it.each([
  'valid',
  'altered-bytes',
  'oversize',
  'live-mode',
  'not-ready',
  'foreign-url',
] as const)(
  'requires actual bounded HTTP delivery for isolated Linux proof: %s',
  async (scenario) => {
    const bytes = Buffer.from('emitted-worker-bytes'),
      rows = [
        {
          url:
            scenario === 'foreign-url'
              ? 'https://untrusted.invalid/worker'
              : '/_next/static/worker.js',
          bytes: bytes.length,
          sha256: createHash('sha256').update(bytes).digest('hex'),
        },
      ];
    const requested: string[] = [];
    const fetcher: typeof fetch = async (input) => {
      const url = new URL(String(input));
      expect(url.origin).toBe('http://127.0.0.1:8080');
      requested.push(url.pathname);
      if (scenario === 'not-ready') throw new Error('unavailable');
      if (url.pathname.endsWith('/health'))
        return Response.json(
          { status: 'ok' },
          { headers: { 'Cache-Control': 'no-store' } },
        );
      if (url.pathname.endsWith('/ready'))
        return Response.json({ ai: 'fake-ready' });
      if (url.pathname.endsWith('/config'))
        return Response.json({
          mode: scenario === 'live-mode' ? 'live' : 'fake',
          capabilities: { simulation: true },
        });
      if (url.pathname === '/') return new Response('<h1>Roomedy</h1>');
      return new Response(
        scenario === 'altered-bytes'
          ? Buffer.alloc(bytes.length)
          : scenario === 'oversize'
            ? Buffer.alloc(bytes.length + 1)
            : bytes,
      );
    };
    const pending = runHttpProbes(rows, fetcher, {
      pause: async () => undefined,
    });
    if (scenario === 'valid') {
      await expect(pending).resolves.toEqual({ assets: 1, http: true });
      expect(requested).toContain('/_next/static/worker.js');
    } else await expect(pending).rejects.toThrow();
    if (scenario === 'not-ready') expect(requested).toHaveLength(30);
  },
);

it.each([
  'success',
  'copy-failure',
  'mkdir-failure',
  'deadline',
  'cleanup-failure',
  'invalid-id',
  'create-failure',
] as const)(
  'keeps public snapshot extraction bounded and owned through %s',
  async (scenario) => {
    const cid = 'c'.repeat(64),
      image = `roomedy-frontend:${'a'.repeat(64)}`,
      calls: string[][] = [];
    let now = 0;
    const run: SnapshotRunner = (command, args, options) => {
      expect(command).toBe('docker');
      expect(Number.isFinite(options.timeout) && options.timeout > 0).toBe(
        true,
      );
      expect(options.timeout).toBeLessThanOrEqual(45_000);
      expect(options.maxBuffer).toBeLessThanOrEqual(64 * 1024);
      expect(options.killSignal).toBe('SIGKILL');
      calls.push(args);
      if (args[0] === 'create') {
        if (scenario === 'create-failure') return { status: 1, stdout: '' };
        if (scenario === 'deadline') now = 120_001;
        return {
          status: 0,
          stdout: scenario === 'invalid-id' ? 'unrelated-target' : cid,
        };
      }
      if (args[0] === 'cp' && scenario === 'copy-failure')
        return { status: null, stdout: '' };
      if (args[0] === 'rm' && scenario === 'cleanup-failure')
        return { status: 1, stdout: '' };
      return { status: 0, stdout: '' };
    };
    const pending = snapshotPublicAssets(image, 'owned-public-snapshot', {
      run,
      now: () => now,
      mkdir: async () => {
        if (scenario === 'mkdir-failure') throw new Error('filesystem-denied');
      },
    });
    if (scenario === 'success') await expect(pending).resolves.toBeUndefined();
    else await expect(pending).rejects.toThrow();
    if (['invalid-id', 'create-failure'].includes(scenario)) {
      expect(calls).toEqual([['create', image]]);
    } else {
      expect(calls.at(-1)).toEqual(['rm', '--force', cid]);
      const copies = calls.filter((args) => args[0] === 'cp');
      expect(copies.length).toBe(
        scenario === 'mkdir-failure' || scenario === 'deadline'
          ? 0
          : scenario === 'copy-failure'
            ? 1
            : 2,
      );
      for (const copy of copies)
        expect([
          `${cid}:/app/apps/frontend/.next/static`,
          `${cid}:/app/apps/frontend/public`,
        ]).toContain(copy[1]);
    }
  },
);

async function temp() {
  const dir = await mkdtemp(path.join(tmpdir(), 'roomedy-release-test-'));
  owned.push(dir);
  return dir;
}
async function put(root: string, relative: string, text: string | Uint8Array) {
  await mkdir(path.dirname(path.join(root, relative)), { recursive: true });
  await writeFile(path.join(root, relative), text);
}
afterEach(async () => {
  for (const dir of owned.splice(0)) {
    const checked = path.resolve(dir);
    if (
      !checked.startsWith(
        path.resolve(tmpdir()) + path.sep + 'roomedy-release-test-',
      )
    )
      throw new Error('unsafe-test-cleanup');
    await rm(checked, { recursive: true, force: true });
  }
});
it('hashes actual tracked/untracked source and binary bytes; excludes secrets/builds and rejects non-LF release text', async () => {
  const repo = fileURLToPath(new URL('../', import.meta.url)),
    current = await collectInputs(repo),
    fixture = await temp();
  expect(
    current.files.some(
      (f) => f.path === 'apps/frontend/src/features/layout-search/worker.ts',
    ),
  ).toBe(true);
  expect(
    current.files.some((f) => f.path === '.github/workflows/local-release.yml'),
  ).toBe(true);
  for (const file of current.files) {
    const target = path.join(fixture, file.path);
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(path.join(repo, file.path), target);
  }
  const first = await collectInputs(fixture);
  expect(first.inputDigest).toBe(current.inputDigest);
  await put(fixture, 'apps/frontend/.env.local', 'PRIVATE_CANARY');
  await put(fixture, 'apps/frontend/.next/private', 'PRIVATE_CANARY');
  expect((await collectInputs(fixture)).inputDigest).toBe(first.inputDigest);
  const worker = 'apps/frontend/src/features/layout-search/worker.ts',
    old = await readFile(path.join(fixture, worker));
  await writeFile(
    path.join(fixture, worker),
    Buffer.concat([old, Buffer.from(' ')]),
  );
  expect((await collectInputs(fixture)).inputDigest).not.toBe(
    first.inputDigest,
  );
  await put(
    fixture,
    'apps/frontend/src/new-owned-source.ts',
    'export const added=1;\n',
  );
  const added = await collectInputs(fixture);
  expect(added.files.some((f) => f.path.endsWith('/new-owned-source.ts'))).toBe(
    true,
  );
  await put(
    fixture,
    'apps/frontend/public/synthetic.jpg',
    new Uint8Array([255, 216, 13, 10, 255, 217]),
  );
  expect((await collectInputs(fixture)).inputDigest).not.toBe(
    added.inputDigest,
  );
  await put(
    fixture,
    'apps/frontend/src/new-owned-source.ts',
    'export const added=1;\r\n',
  );
  await expect(collectInputs(fixture)).rejects.toThrow('release-input-not-lf');
});
it('accepts a controlled matching Linux record but rejects inventory, stale bytes/images/tools and missing independent observations', async () => {
  const inventory = await collectInputs(
      fileURLToPath(new URL('../', import.meta.url)),
    ),
    id = 'sha256:' + 'a'.repeat(64);
  const images = {
    frontend: { id, inputDigest: inventory.inputDigest, user: 'node' },
    backend: { id, inputDigest: inventory.inputDigest, user: 'node' },
  };
  const proof = {
    kind: 'linux-runtime',
    version: 1,
    platform: 'linux/amd64',
    inputDigest: inventory.inputDigest,
    identities: inventory.identities,
    images,
    probes: requiredProbes.map((name) => ({ name, passed: true })),
  };
  expect(
    verifyProof(inventory, proof, { platform: 'linux/amd64', images }),
  ).toMatchObject({
    kind: 'verified-linux-runtime',
    hosted: false,
    live: false,
  });
  for (const bad of [
    { ...proof, kind: 'input-inventory' },
    { ...proof, platform: 'win32' },
    { ...proof, inputDigest: 'b'.repeat(64) },
    { ...proof, identities: {} },
    { ...proof, probes: proof.probes.slice(1) },
    {
      ...proof,
      images: {
        ...images,
        frontend: { ...images.frontend, id: 'sha256:' + 'c'.repeat(64) },
      },
    },
  ])
    expect(() =>
      verifyProof(inventory, bad, { platform: 'linux/amd64', images }),
    ).toThrow();
  expect(() => verifyProof(inventory, proof, null)).toThrow(
    'release-linux-observation-required',
  );
});
it('retains immutable old chunks/workers and rejects a conflicting asset or private canary', async () => {
  const current = await temp(),
    snapshot = await temp(),
    next = await temp(),
    target = await temp();
  await put(current, 'static/chunks/old-worker.js', 'old worker');
  await put(current, 'public/catalogue/desk-v1.svg', 'old desk');
  await retainAssets(current, null, snapshot);
  await put(next, 'static/chunks/new-worker.js', 'new worker');
  await retainAssets(next, snapshot, target);
  expect(
    await readFile(path.join(target, 'static/chunks/old-worker.js'), 'utf8'),
  ).toBe('old worker');
  expect(
    await readFile(path.join(target, 'static/chunks/new-worker.js'), 'utf8'),
  ).toBe('new worker');
  await put(next, 'public/catalogue/desk-v1.svg', 'different desk');
  await expect(retainAssets(next, snapshot, await temp())).rejects.toThrow(
    'release-retained-conflict',
  );
  const privateDir = await temp();
  await put(privateDir, 'public/.env.local', 'PRIVATE_CANARY');
  await expect(retainAssets(privateDir, null, await temp())).rejects.toThrow(
    'release-retained-private',
  );
  const manifest = JSON.parse(
    await readFile(path.join(snapshot, 'retained-manifest.json'), 'utf8'),
  ) as { createdAt: number };
  manifest.createdAt = 0;
  await writeFile(
    path.join(snapshot, 'retained-manifest.json'),
    JSON.stringify(manifest),
  );
  await expect(retainAssets(null, snapshot, await temp())).rejects.toThrow(
    'release-retained-age',
  );
});
it('inspects an actual package tree and rejects private/source material rather than treating a file listing as Linux proof', async () => {
  const root = await temp();
  await put(root, 'dist/server.js', 'export {};');
  expect((await inspectRuntime(root, 'backend')).privateFiles).toBe(0);
  await put(root, '.env.local', 'PRIVATE_CANARY');
  await expect(inspectRuntime(root, 'backend')).rejects.toThrow(
    'release-runtime-missing-or-private',
  );
});

it('bounds probe bytes before materializing an oversized HTTP response', async () => {
  let pulls = 0;
  const response = new Response(
    new ReadableStream({
      pull(c) {
        if (pulls === 128) c.close();
        else {
          pulls++;
          c.enqueue(new Uint8Array(65_536));
        }
      },
    }),
  );
  await expect(readProbeBody(response, 16_384)).rejects.toThrow(
    'release-response-bound',
  );
  expect(pulls).toBeLessThan(128);
  expect(
    Buffer.from(await readProbeBody(new Response('safe'), 4)).toString(),
  ).toBe('safe');
});
it('bounds retained probe fragments even when a stream contributes zero bytes', async () => {
  let pulls = 0;
  const response = new Response(
    new ReadableStream({
      pull(c) {
        if (pulls === 10_000) c.close();
        else {
          pulls++;
          c.enqueue(new Uint8Array());
        }
      },
    }),
  );
  await expect(readProbeBody(response, 16_384)).rejects.toThrow(
    'release-response-bound',
  );
  expect(pulls).toBeLessThan(10_000);
});
