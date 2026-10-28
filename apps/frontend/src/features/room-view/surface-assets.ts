import { decodeInput } from '@roomedy/contracts/intake';

export const SURFACE_ASSETS = [
  { kind: 'floor', edge: 512 },
  { kind: 'wood', edge: 512 },
  { kind: 'fabric', edge: 256 },
  { kind: 'plaster', edge: 256 },
] as const;
export type DetailedSurface = (typeof SURFACE_ASSETS)[number]['kind'];
export interface SurfacePixels {
  edge: number;
  color: Uint8Array<ArrayBuffer>;
  normal: Uint8Array<ArrayBuffer>;
  roughness: Uint8Array<ArrayBuffer>;
}
export interface SurfaceIO {
  /** Landing-only opt-in: four bounded local material jobs; other scenes stay serial. */
  concurrency?: 1 | 4;
  /** A landing awaiting local photos can generate its procedural fallback only on failure. */
  deferFallback?: boolean;
  /** Only fixed versioned public images may prefer the browser's persistent HTTP cache. */
  cache?: 'force-cache';
  /** Optional scene-owned development counters; totals may overlap across parallel jobs. */
  timing?: {
    readMs: number;
    validationMs: number;
    decodeMs: number;
    unpackMs: number;
  };
  fetch?: typeof globalThis.fetch;
  decode?: (
    bytes: Uint8Array<ArrayBuffer>,
    edge: number,
    signal: AbortSignal,
  ) => Promise<Uint8Array<ArrayBuffer>>;
}

const active = (signal: AbortSignal) => {
  if (signal.aborted) throw new Error('surface-retired');
};
/** Packed channels are data: bypass browser colour conversion and alpha premultiplication. */
async function decodePixels(
  bytes: Uint8Array<ArrayBuffer>,
  edge: number,
  signal: AbortSignal,
) {
  active(signal);
  const bitmap = await createImageBitmap(
    new Blob([bytes], { type: 'image/png' }),
    {
      imageOrientation: 'none',
      colorSpaceConversion: 'none',
      premultiplyAlpha: 'none',
    },
  );
  let canvas: OffscreenCanvas | undefined;
  try {
    active(signal);
    if (bitmap.width !== edge || bitmap.height !== edge)
      throw new Error('surface-size');
    canvas = new OffscreenCanvas(edge, edge);
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('surface-decode');
    context.drawImage(bitmap, 0, 0);
    return new Uint8Array(context.getImageData(0, 0, edge, edge).data);
  } finally {
    bitmap.close();
    if (canvas) canvas.width = canvas.height = 1;
  }
}

async function image(
  url: string,
  edge: number,
  signal: AbortSignal,
  io: SurfaceIO,
) {
  active(signal);
  const readStarted = io.timing ? performance.now() : 0;
  const response = await (io.fetch ?? globalThis.fetch)(url, {
    signal,
    credentials: 'same-origin',
    redirect: 'error',
    ...(io.cache ? { cache: io.cache } : {}),
  });
  if (!response.ok || !response.body) throw new Error('surface-unavailable');
  const reader = response.body.getReader(),
    chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 256 * 1024 || chunks.length >= 512 || signal.aborted)
        throw new Error('surface-bound');
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
  active(signal);
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  if (io.timing) io.timing.readMs += performance.now() - readStarted;
  const validationStarted = io.timing ? performance.now() : 0;
  const clean = decodeInput(bytes);
  if (
    clean.header.type !== 'image/png' ||
    clean.header.width !== edge ||
    clean.header.height !== edge ||
    clean.orientation !== 1
  )
    throw new Error('surface-size');
  if (io.timing)
    io.timing.validationMs += performance.now() - validationStarted;
  const decodeStarted = io.timing ? performance.now() : 0;
  const pixels = await (io.decode ?? decodePixels)(clean.bytes, edge, signal);
  if (io.timing) io.timing.decodeMs += performance.now() - decodeStarted;
  active(signal);
  if (pixels.byteLength !== edge * edge * 4) throw new Error('surface-pixels');
  return pixels;
}

/** Bounded allow-listed local jobs per scene. No retry, global cache or late publication. */
export class SurfaceAssets {
  private abort = new AbortController();
  private pending: Promise<{ loaded: number; failed: number }> | undefined;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private live = true;
  constructor(
    private apply: (kind: DetailedSurface, pixels: SurfacePixels) => void,
    private io: SurfaceIO = {},
  ) {}
  load(signal?: AbortSignal) {
    if (this.pending) return this.pending;
    if (!this.live) return Promise.resolve({ loaded: 0, failed: 0 });
    const cancel = () => {
      this.abort.abort();
      clearTimeout(this.timer);
    };
    signal?.addEventListener('abort', cancel, { once: true });
    if (signal?.aborted) cancel();
    if (!this.abort.signal.aborted) this.timer = setTimeout(cancel, 10_000);
    this.pending = (async () => {
      let loaded = 0,
        failed = 0,
        next = 0;
      try {
        const worker = async () => {
          while (next < SURFACE_ASSETS.length) {
            if (!this.live || this.abort.signal.aborted) break;
            const { kind, edge } = SURFACE_ASSETS[next++]!;
            try {
              const read = (role: 'detail' | 'normal') =>
                image(
                  `/surfaces/${kind}-${role}-v1.png`,
                  edge,
                  this.abort.signal,
                  this.io,
                );
              // A material's pair stays serial, bounding active image jobs to four.
              const packed = await read('detail'),
                normal = await read('normal');
              active(this.abort.signal);
              const unpackStarted = this.io.timing ? performance.now() : 0;
              const color = new Uint8Array(packed.length),
                roughness = new Uint8Array(packed.length);
              for (let at = 0; at < packed.length; at += 4) {
                color[at] = color[at + 1] = color[at + 2] = packed[at]!;
                roughness[at] =
                  roughness[at + 1] =
                  roughness[at + 2] =
                    packed[at + 1]!;
                color[at + 3] = roughness[at + 3] = 255;
              }
              if (this.io.timing)
                this.io.timing.unpackMs += performance.now() - unpackStarted;
              if (this.live)
                this.apply(kind, { edge, color, normal, roughness });
              loaded++;
            } catch {
              failed++;
            }
          }
        };
        await Promise.all(
          Array.from({ length: this.io.concurrency === 4 ? 4 : 1 }, worker),
        );
      } finally {
        clearTimeout(this.timer);
        signal?.removeEventListener('abort', cancel);
      }
      return { loaded, failed };
    })();
    return this.pending;
  }
  dispose() {
    this.live = false;
    this.abort.abort();
    clearTimeout(this.timer);
  }
}
