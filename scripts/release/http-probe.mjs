import { readProbeBody } from './proof.mjs';

/** Actual HTTP delivery inside the isolated frontend container; never a filesystem-only pass. */
export async function runHttpProbes(rows, fetcher = fetch, options = {}) {
  const now = options.now ?? Date.now,
    pause =
      options.pause ??
      ((ms) => new Promise((resolve) => setTimeout(resolve, ms))),
    deadline = now() + 120_000,
    origin = 'http://127.0.0.1:8080';
  const get = async (pathname) => {
    if (now() >= deadline) throw new Error('release-probe-deadline');
    const url = new URL(pathname, origin);
    if (
      url.origin !== origin ||
      !pathname.startsWith('/') ||
      pathname.startsWith('//')
    )
      throw new Error('release-asset-bound');
    const response = await fetcher(url, {
      redirect: 'error',
      signal: AbortSignal.timeout(
        Math.max(1, Math.min(3000, deadline - now())),
      ),
    });
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error('release-http-probe');
    }
    return response;
  };
  if (!Array.isArray(rows) || rows.length === 0 || rows.length > 2000)
    throw new Error('release-asset-bound');
  let ready = false;
  for (let i = 0; i < 30; i++) {
    try {
      const response = await get('/api/roomedy/v1/health');
      if (
        JSON.parse((await readProbeBody(response, 16_384)).toString('utf8'))
          .status !== 'ok' ||
        response.headers.get('cache-control') !== 'no-store'
      )
        throw new Error('release-health');
      ready = true;
      break;
    } catch {
      await pause(500);
    }
  }
  if (!ready) throw new Error('release-readiness');
  const json = async (pathname) =>
    JSON.parse(
      (await readProbeBody(await get(pathname), 16_384)).toString('utf8'),
    );
  const readiness = await json('/api/roomedy/v1/ready'),
    config = await json('/api/roomedy/v1/config');
  if (
    readiness.ai !== 'fake-ready' ||
    config.mode !== 'fake' ||
    !config.capabilities.simulation
  )
    throw new Error('release-mode');
  const html = (await readProbeBody(await get('/'), 1024 * 1024)).toString(
    'utf8',
  );
  if (!html.includes('Roomedy')) throw new Error('release-landing');
  const { createHash } = await import('node:crypto');
  for (const row of rows) {
    if (
      !row ||
      typeof row.url !== 'string' ||
      !Number.isSafeInteger(row.bytes) ||
      row.bytes < 0 ||
      row.bytes > 16 * 1024 * 1024 ||
      !/^[a-f0-9]{64}$/.test(row.sha256)
    )
      throw new Error('release-asset-bound');
    const body = await readProbeBody(await get(row.url), row.bytes);
    if (
      body.length !== row.bytes ||
      createHash('sha256').update(body).digest('hex') !== row.sha256
    )
      throw new Error('release-asset-probe');
  }
  return { assets: rows.length, http: true };
}

/** Fixed first-party code; metadata goes through stdin rather than a shell/command-line string. */
export function httpProbeSource() {
  return `const readProbeBody = (${readProbeBody.toString()});
const runHttpProbes = (${runHttpProbes.toString()});
const {readFileSync}=await import('node:fs');
const rows=JSON.parse(readFileSync(0,'utf8'));
console.log(JSON.stringify(await runHttpProbes(rows)));`;
}
