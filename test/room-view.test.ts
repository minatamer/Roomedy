import { readFile } from 'node:fs/promises';
import { describe, it, expect, vi } from 'vitest';
import { createRoomFixture } from '../apps/frontend/src/features/session/fixtures/rooms.js';
import {
  changedPieces,
  displayRoom,
  featureBox,
  piecePose,
  pieceRepresentation,
  wallBoxes,
} from '../apps/frontend/src/features/room-view/adapter.js';
import {
  ViewAssets,
  LOCAL_MODELS,
} from '../apps/frontend/src/features/room-view/assets.js';
import type { AssetState } from '../apps/frontend/src/features/room-view/assets.js';

describe('cutaway projection over semantic snapshots', () => {
  it('preserves odd dimensions, half-mm centres and the independent front at every turn', () => {
    const p = createRoomFixture('sample').furniture[1]!;
    p.pose.centerX = 750.5;
    p.pose.centerZ = 1000.5;
    for (const q of [0, 1, 2, 3] as const) {
      p.pose.quarterTurns = q;
      const pose = piecePose(p);
      expect(pose.position).toEqual([0.7505, 0, 1.0005]);
      expect(Math.sin(pose.rotationY)).toBeCloseTo([0, -1, 0, 1][q]!);
      expect(Math.cos(pose.rotationY)).toBeCloseTo([1, 0, -1, 0][q]!);
    }
  });
  it('builds exact opening gaps and retains union area when openings overlap', () => {
    const room = createRoomFixture('sample'),
      window = room.room.features[1]!;
    expect(featureBox(room, window)).toEqual({
      center: [3.1, 1.45, 0.03],
      size: [1.2, 1.1, 0.06],
    });
    const area = () =>
      wallBoxes(room, 'north').reduce(
        (sum, b) => sum + b.size[0] * b.size[1],
        0,
      );
    expect(area()).toBeCloseTo(4.2 * 2.6 - 1.2 * 1.1);
    room.room.features.push({
      ...structuredClone(window),
      id: 'duplicate-window',
    });
    expect(area()).toBeCloseTo(4.2 * 2.6 - 1.2 * 1.1);
    window.wall = 'unknown';
    expect(featureBox(room, window)).toBeNull();
    room.room.features.pop();
    expect(area()).toBeCloseTo(4.2 * 2.6);
  });
  it('projects east and south obstacles using the actual wall depth and sill', () => {
    const room = createRoomFixture('empty'),
      f = {
        ...room.room.features[1]!,
        kind: 'obstacle' as const,
        wall: 'east' as const,
        projection: {
          value: 350,
          status: 'confirmed' as const,
          sourceId: 'sample',
        },
      };
    expect(featureBox(room, f)).toEqual({
      center: [4.025, 1.45, 3.1],
      size: [0.35, 1.1, 1.2],
    });
    expect(featureBox(room, { ...f, wall: 'south' })).toEqual({
      center: [3.1, 1.45, 4.625],
      size: [1.2, 1.1, 0.35],
    });
  });
  it('keeps owned size truth and unknown dimensions distinct from representation availability', () => {
    const room = createRoomFixture('sample'),
      p = room.furniture[0]!;
    p.dimensions.width.value = 2501;
    const before = JSON.stringify(room),
      rep = pieceRepresentation(p);
    expect(rep.kind).toBe('procedural');
    if (rep.kind === 'procedural') {
      expect(rep.footprint.width).toBe(2501);
      expect(rep.parts[0]?.name).toBe('physical-bounds');
      expect(rep.notice).toBeTruthy();
    }
    expect(JSON.stringify(room)).toBe(before);
    p.dimensions.height.value = null;
    p.dimensions.height.status = 'unknown';
    expect(pieceRepresentation(p).kind).toBe('unavailable');
    expect(displayRoom(createRoomFixture('partial'))).toMatchObject({
      height: 2.6,
      approximate: true,
    });
  });
  it('accepts readonly baseline/current/candidate projections without mutation', () => {
    const baseline = createRoomFixture('sample'),
      candidate = structuredClone(baseline);
    candidate.furniture[1]!.pose.centerX = 3400.5;
    const before = JSON.stringify(baseline);
    expect(changedPieces(baseline, candidate).map((p) => p.id)).toEqual([
      'desk_1',
    ]);
    expect(changedPieces(baseline)).toEqual([]);
    expect(piecePose(baseline.furniture[1]!).position).toEqual([3.2, 0, 1]);
    expect(piecePose(candidate.furniture[1]!).position).toEqual([3.4005, 0, 1]);
    expect(JSON.stringify(baseline)).toBe(before);
  });
});

describe('finite per-canvas model ownership', () => {
  it('loads only the reviewed local GLBs once, disposes one view without retiring another', async () => {
    const bytes = await readFile(
      'apps/frontend/public/catalogue/chair-desk-v1.glb',
    );
    const fetch = vi.fn(async () => new Response(bytes));
    const a = new Map<string, AssetState>(),
      b = new Map<string, AssetState>();
    const owner = new ViewAssets(
      (s) => {
        a.clear();
        s.forEach((v, k) => a.set(k, v));
      },
      { fetch },
    );
    const other = new ViewAssets(
      (s) => {
        b.clear();
        s.forEach((v, k) => b.set(k, v));
      },
      { fetch },
    );
    owner.load('https://example.invalid/other.glb');
    owner.load(LOCAL_MODELS[0]);
    owner.load(LOCAL_MODELS[0]);
    other.load(LOCAL_MODELS[0]);
    await vi.waitFor(() => {
      expect(a.get(LOCAL_MODELS[0])?.kind).toBe('ready');
      expect(b.get(LOCAL_MODELS[0])?.kind).toBe('ready');
    });
    expect(fetch).toHaveBeenCalledTimes(2);
    const first = a.get(LOCAL_MODELS[0]),
      second = b.get(LOCAL_MODELS[0]);
    let disposed = 0,
      otherDisposed = 0;
    if (first?.kind === 'ready' && second?.kind === 'ready') {
      expect(first.asset.scene).not.toBe(second.asset.scene);
      for (const [asset, increment] of [
        [first.asset, () => disposed++],
        [second.asset, () => otherDisposed++],
      ] as const)
        asset.scene.traverse((o) => {
          const mesh = o as unknown as {
            geometry?: {
              addEventListener: (kind: string, callback: () => void) => void;
            };
          };
          mesh.geometry?.addEventListener('dispose', increment);
        });
    }
    owner.dispose();
    owner.dispose();
    expect(disposed).toBeGreaterThan(0);
    expect(otherDisposed).toBe(0);
    other.dispose();
    expect(otherDisposed).toBeGreaterThan(0);
  });
  it('rejects excessive local bytes/fragments and parser failure with a safe fallback', async () => {
    for (const response of [
      () => new Response(new Uint8Array(256 * 1024 + 1)),
      () =>
        new Response(
          new ReadableStream({
            start(c) {
              for (let i = 0; i < 1025; i++) c.enqueue(new Uint8Array([1]));
              c.close();
            },
          }),
        ),
      () => new Response(new Uint8Array([1])),
    ]) {
      let last: AssetState | undefined;
      const parse = vi.fn(async () => {
        throw new Error('private-parser-detail');
      });
      const owner = new ViewAssets(
        (s) => {
          last = s.get(LOCAL_MODELS[0]);
        },
        { fetch: async () => response(), parse },
      );
      owner.load(LOCAL_MODELS[0]);
      await vi.waitFor(() => expect(last).toEqual({ kind: 'failed' }));
      owner.dispose();
    }
  });
  it('retires a late decode after deadline or unmount before it can publish', async () => {
    vi.useFakeTimers();
    try {
      for (const retire of ['deadline', 'unmount']) {
        type LoadedAsset = Extract<AssetState, { kind: 'ready' }>['asset'];
        let release: ((asset: LoadedAsset) => void) | undefined;
        // A no-mesh asset is sufficient to verify publication fencing independently of GLTF parsing.
        const asset = { scenes: [], scene: {} } as unknown as LoadedAsset;
        const updates: AssetState[] = [];
        const owner = new ViewAssets(
          (s) => updates.push(s.get(LOCAL_MODELS[0])!),
          {
            fetch: async () => new Response(new Uint8Array([1])),
            parse: () =>
              new Promise((resolve) => {
                release = resolve;
              }),
          },
        );
        owner.load(LOCAL_MODELS[0]);
        await vi.waitFor(() => expect(release).toBeDefined());
        if (retire === 'deadline') await vi.advanceTimersByTimeAsync(10001);
        else owner.dispose();
        const count = updates.length;
        release!(asset);
        await vi.advanceTimersByTimeAsync(1);
        expect(updates).not.toContainEqual(
          expect.objectContaining({ kind: 'ready' }),
        );
        expect(updates).toHaveLength(count);
        owner.dispose();
      }
    } finally {
      vi.useRealTimers();
    }
  });
});
