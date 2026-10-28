/** Finite landing-only preparation. A retired canvas never publishes readiness/failure. */
export async function prepareLandingScene(port: {
  current: () => boolean;
  load: () => Promise<unknown>;
  initialize: () => void;
  upload: () => void;
  compile: () => Promise<unknown>;
  warm: () => void;
  ready: () => void;
  failed: () => void;
}) {
  try {
    if (!port.current()) return;
    const jobs = await Promise.allSettled([
      Promise.resolve().then(() => {
        if (port.current()) return port.load();
      }),
      Promise.resolve().then(() => {
        if (!port.current()) return;
        port.initialize();
        if (!port.current()) return;
        return port.compile();
      }),
    ]);
    if (!port.current()) return;
    if (jobs.some((job) => job.status === 'rejected')) {
      port.failed();
      return;
    }
    port.upload();
    port.warm();
    if (port.current()) port.ready();
  } catch {
    if (port.current()) port.failed();
  }
}
