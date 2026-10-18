import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { Mesh } from 'three';
import type { BufferGeometry, Material } from 'three';

export const LOCAL_MODELS = [
  '/catalogue/chair-desk-v1.glb',
  '/catalogue/bedside-storage-v1.glb',
] as const;
export type AssetState =
  { kind: 'loading' | 'failed' } | { kind: 'ready'; asset: GLTF };
const MAX_BYTES = 256 * 1024,
  MAX_CHUNKS = 1024;
export function disposeAsset(asset: GLTF) {
  const geometries = new Set<BufferGeometry>(),
    materials = new Set<Material>();
  for (const scene of asset.scenes)
    scene.traverse((object) => {
      if (object instanceof Mesh) {
        geometries.add(object.geometry);
        for (const m of Array.isArray(object.material)
          ? object.material
          : [object.material])
          materials.add(m);
      }
    });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
}
/** One canvas owns one finite cache. Clones borrow its immutable geometry/materials. */
export class ViewAssets {
  private live = true;
  private states = new Map<string, AssetState>();
  private pending = new Map<
    string,
    { abort: AbortController; timer: ReturnType<typeof setTimeout> }
  >();
  constructor(
    private changed: (states: ReadonlyMap<string, AssetState>) => void,
    private io: {
      fetch?: typeof globalThis.fetch;
      parse?: (bytes: ArrayBuffer) => Promise<GLTF>;
    } = {},
  ) {}
  load(url: string) {
    if (
      !this.live ||
      this.states.has(url) ||
      !(LOCAL_MODELS as readonly string[]).includes(url)
    )
      return;
    const abort = new AbortController(),
      timer = setTimeout(() => {
        abort.abort();
        if (this.live) this.publish(url, { kind: 'failed' });
      }, 10_000);
    this.pending.set(url, { abort, timer });
    this.publish(url, { kind: 'loading' });
    void this.acquire(url, abort.signal)
      .then((asset) => {
        if (!this.live || abort.signal.aborted) {
          disposeAsset(asset);
          return;
        }
        this.publish(url, { kind: 'ready', asset });
      })
      .catch(() => {
        if (this.live) this.publish(url, { kind: 'failed' });
      })
      .finally(() => {
        clearTimeout(timer);
        this.pending.delete(url);
      });
  }
  private publish(url: string, state: AssetState) {
    this.states.set(url, state);
    this.changed(new Map(this.states));
  }
  private async acquire(url: string, signal: AbortSignal) {
    const response = await (this.io.fetch ?? globalThis.fetch)(url, {
      signal,
      credentials: 'same-origin',
      redirect: 'error',
    });
    if (!response.ok || !response.body)
      throw new Error('local-model-unavailable');
    const reader = response.body.getReader(),
      chunks: Uint8Array[] = [];
    let total = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > MAX_BYTES || chunks.length >= MAX_CHUNKS || signal.aborted)
          throw new Error('local-model-bound');
        chunks.push(value);
      }
    } finally {
      await reader.cancel().catch(() => undefined);
      reader.releaseLock();
    }
    if (signal.aborted) throw new Error('local-model-retired');
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return (
      this.io.parse ??
      ((data: ArrayBuffer) => new GLTFLoader().parseAsync(data, ''))
    )(bytes.buffer);
  }
  dispose() {
    if (!this.live) return;
    this.live = false;
    for (const { abort, timer } of this.pending.values()) {
      clearTimeout(timer);
      abort.abort();
    }
    this.pending.clear();
    for (const state of this.states.values())
      if (state.kind === 'ready') disposeAsset(state.asset);
    this.states.clear();
  }
}
