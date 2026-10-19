/** Finite landing-only preparation. A retired canvas never publishes readiness/failure. */
export async function prepareLandingScene(port: {
  current: () => boolean;
  upload: () => void;
  compile: () => Promise<unknown>;
  warm: () => void;
  ready: () => void;
  failed: () => void;
}) {
  try {
    if (!port.current()) return;
    port.upload();
    await port.compile();
    if (!port.current()) return;
    port.warm();
    if (port.current()) port.ready();
  } catch {
    if (port.current()) port.failed();
  }
}
