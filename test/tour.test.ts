import { describe, expect, it } from 'vitest';
import { createRoomFixture } from '../apps/frontend/src/features/session/fixtures/rooms.js';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import {
  projectOf,
  recoveryOf,
} from '../apps/frontend/src/features/session/project.js';
import {
  automaticallyOfferTour,
  watchTourTarget,
} from '../apps/frontend/src/features/assistant/tour-runtime.js';
import type {
  TourReading,
  TourLayout,
} from '../apps/frontend/src/features/assistant/tour-runtime.js';
import {
  sameTourBox,
  tourPanels,
  tourPlacement,
  tourSpotlight,
  tourTargetVisible,
} from '../apps/frontend/src/features/assistant/tour-layout.js';

describe('fresh editor orientation without persistent tour authority', () => {
  it.each(['empty', 'partial', 'sample'] as const)(
    'offers a new %s room while preserving canonical state',
    (condition) => {
      const c = new SessionController(createRoomFixture(condition));
      try {
        const before = c.getSnapshot();
        expect(automaticallyOfferTour(before)).toBe(true);
        c.setPanel('assistant');
        c.setRoomView('cutaway');
        expect(automaticallyOfferTour(c.getSnapshot())).toBe(true);
        expect(c.getSnapshot().workspace).toBe(before.workspace);
        expect(c.getSnapshot().undoLabel).toBeNull();
      } finally {
        c.dispose();
      }
    },
  );
  it('qualifies only after photo/sketch acceptance and retires after expiry/disposal', () => {
    let now = 1000;
    const c = new SessionController(undefined, { now: () => now });
    try {
      expect(automaticallyOfferTour(c.getSnapshot())).toBe(false);
      c.beginIntake();
      expect(automaticallyOfferTour(c.getSnapshot())).toBe(false);
      expect(c.acceptRoom(createRoomFixture('partial'))).toBe(true);
      expect(automaticallyOfferTour(c.getSnapshot())).toBe(true);
      now = c.getSnapshot().expiresAt;
      c.checkExpiry();
      expect(automaticallyOfferTour(c.getSnapshot())).toBe(false);
    } finally {
      c.dispose();
    }
    expect(automaticallyOfferTour(c.getSnapshot())).toBe(false);
  });
  it('keeps restored/imported work uninterrupted and rearms with an explicit new-room identity', () => {
    const c = new SessionController(createRoomFixture('sample'));
    try {
      const record = recoveryOf(c.getSnapshot())!,
        project = projectOf(c.getSnapshot())!;
      expect(c.restore(record)).toBe(true);
      expect(automaticallyOfferTour(c.getSnapshot())).toBe(false);
      expect(recoveryOf(c.getSnapshot())).toEqual(record);
      expect(c.importProject(project)).toBe(true);
      expect(automaticallyOfferTour(c.getSnapshot())).toBe(false);
      const prior = c.getSnapshot().workspace!.workspaceId;
      c.reset(createRoomFixture('empty'));
      expect(c.getSnapshot().workspace!.workspaceId).not.toBe(prior);
      expect(automaticallyOfferTour(c.getSnapshot())).toBe(true);
    } finally {
      c.dispose();
    }
  });
  it('does not automatically interrupt a client-load failure', () => {
    const c = new SessionController(createRoomFixture('sample'));
    try {
      expect(
        automaticallyOfferTour({ ...c.getSnapshot(), clientLoadFailure: true }),
      ).toBe(false);
    } finally {
      c.dispose();
    }
  });
});

describe('measured tour geometry', () => {
  it.each([
    [320, 568],
    [390, 844],
    [430, 932],
    [768, 1024],
    [1024, 768],
    [1280, 720],
    [1366, 768],
    [1440, 900],
    [1920, 1080],
    [1366, 430],
    [390, 240],
  ] as const)(
    'contains actual long cards at %sx%s including keyboard offsets',
    (width, height) => {
      const view = { width, height, left: 12, top: 80 };
      for (const target of [
        null,
        { left: 25, top: 100, right: 200, bottom: 144 },
        { left: 100, top: 500, right: 300, bottom: 900 },
      ]) {
        const card = tourPlacement(target, view, 680);
        expect(card.left).toBeGreaterThanOrEqual(view.left);
        expect(card.top).toBeGreaterThanOrEqual(view.top);
        expect(card.left + card.width).toBeLessThanOrEqual(view.left + width);
        expect(card.top + card.height).toBeLessThanOrEqual(view.top + height);
        expect(card.height).toBeGreaterThan(0);
      }
    },
  );
  it('uses free side space before covering a tall target', () => {
    const target = { left: 20, top: 20, right: 700, bottom: 680 },
      view = { left: 0, top: 0, width: 1280, height: 720 },
      card = tourPlacement(target, view, 280);
    expect(card.left).toBeGreaterThan(target.right);
    expect(card.top).toBeGreaterThanOrEqual(16);
  });
  it('keeps exact outside coverage and finite clipping, including targets beyond the viewport', () => {
    const view = { left: 0, top: 80, width: 390, height: 500 };
    for (const target of [
      { left: 20, top: 100, right: 370, bottom: 200 },
      { left: -20, top: -100, right: 500, bottom: 900 },
      { left: 600, top: 900, right: 700, bottom: 1000 },
    ]) {
      const hole = tourSpotlight(target, view),
        panels = tourPanels(hole, view);
      for (const box of [...panels, hole]) {
        expect(box.width).toBeGreaterThanOrEqual(0);
        expect(box.height).toBeGreaterThanOrEqual(0);
      }
      expect(
        panels.reduce((sum, box) => sum + box.width * box.height, 0) +
          hole.width * hole.height,
      ).toBe(view.width * view.height);
    }
    expect(tourPanels(null, view)).toEqual([view]);
  });
  it('requires full arrival for small targets and visible coverage for oversized sections', () => {
    const view = { left: 0, top: 100, width: 390, height: 500 };
    expect(
      tourTargetVisible({ left: 20, right: 370, top: 500, bottom: 640 }, view),
    ).toBe(false);
    expect(
      tourTargetVisible({ left: 20, right: 370, top: 450, bottom: 590 }, view),
    ).toBe(true);
    expect(
      tourTargetVisible({ left: 20, right: 370, top: -50, bottom: 800 }, view),
    ).toBe(true);
    expect(
      tourTargetVisible({ left: 380, right: 450, top: 100, bottom: 150 }, view),
    ).toBe(false);
  });
  it('accepts fully visible fixed editor regions touching viewport edges without impossible scrolling', () => {
    const view = { left: 0, top: 0, width: 1280, height: 720 };
    expect(
      tourTargetVisible({ left: 0, top: 126, right: 935, bottom: 716 }, view),
    ).toBe(true);
    expect(
      tourTargetVisible(
        { left: 935, top: 126, right: 1280, bottom: 716 },
        view,
      ),
    ).toBe(true);
    expect(
      tourTargetVisible(
        { left: 935, top: 126, right: 1282, bottom: 716 },
        view,
      ),
    ).toBe(false);
  });
  it('recognizes only unchanged measured card/target geometry as seamless', () => {
    const a = { left: 20, top: 100, width: 300, height: 200 };
    expect(sameTourBox(a, { ...a })).toBe(true);
    expect(sameTourBox(a, { ...a, top: 101 })).toBe(false);
    expect(sameTourBox(a, { ...a, height: 230 })).toBe(false);
  });
});
function clock() {
  let time = 0,
    sequence = 0;
  const frames = new Map<number, () => void>();
  const shown: TourLayout[] = [];
  let hidden = 0;
  const reading: TourReading = {
    target: { left: 20, top: 100, right: 220, bottom: 200 },
    view: { left: 0, top: 0, width: 390, height: 844 },
    cardHeight: 260,
    moving: false,
  };
  const watcher = watchTourTarget({
    now: () => time,
    request: (fn) => {
      frames.set(++sequence, fn);
      return sequence;
    },
    cancel: (id) => {
      frames.delete(id);
    },
    read: () => structuredClone(reading),
    hide: () => hidden++,
    show: (layout) => shown.push(layout),
  });
  return {
    watcher,
    reading,
    shown,
    frames,
    hidden: () => hidden,
    tick: (ms = 20) => {
      time += ms;
      const next = [...frames.values()];
      frames.clear();
      next.forEach((fn) => fn());
    },
  };
}
describe('bounded actual target readiness', () => {
  it('waits for movement/scroll to settle, reveals one coherent layout and sleeps', () => {
    const env = clock();
    env.reading.moving = true;
    for (let n = 0; n < 20; n++) env.tick();
    expect(env.shown).toHaveLength(0);
    env.reading.moving = false;
    for (let n = 0; n < 10; n++) env.tick();
    expect(env.shown).toHaveLength(1);
    expect(env.shown[0]!.hole).not.toBeNull();
    expect(env.shown[0]!.unavailable).toBe(false);
    expect(env.frames.size).toBe(0);
    env.watcher.dispose();
  });
  it('restarts real readiness after a resize with current card and viewport bounds', () => {
    const env = clock();
    for (let n = 0; n < 12; n++) env.tick();
    env.reading.view = { left: 0, top: 80, width: 320, height: 250 };
    env.reading.cardHeight = 900;
    env.watcher.refresh();
    expect(env.hidden()).toBe(2);
    for (let n = 0; n < 12; n++) env.tick();
    const layout = env.shown.at(-1)!;
    expect(layout.card.top + layout.card.height).toBeLessThanOrEqual(330);
    expect(layout.card.left + layout.card.width).toBeLessThanOrEqual(320);
    expect(env.frames.size).toBe(0);
    env.watcher.dispose();
  });
  it('releases a stalled/missing target to a bounded unavailable card without an invented highlight', () => {
    const env = clock();
    env.reading.target = null;
    for (let n = 0; n < 201; n++) env.tick();
    expect(env.shown).toHaveLength(1);
    expect(env.shown[0]!.hole).toBeNull();
    expect(env.shown[0]!.unavailable).toBe(true);
    expect(env.frames.size).toBe(0);
    env.watcher.dispose();
  });
  it('fences an old queued callback when a newer target measurement replaces it', () => {
    const env = clock(),
      late = [...env.frames.values()][0]!;
    env.watcher.refresh();
    const currentFrame = [...env.frames.keys()][0]!;
    late();
    env.watcher.dispose();
    expect(env.frames.has(currentFrame)).toBe(false);
    expect(env.frames.size).toBe(0);
    expect(env.shown).toHaveLength(0);
  });
  it('fences a cancelled or retired callback and cannot be refreshed after disposal', () => {
    const env = clock(),
      late = [...env.frames.values()][0]!;
    env.watcher.dispose();
    late();
    env.watcher.refresh();
    expect(env.frames.size).toBe(0);
    expect(env.shown).toHaveLength(0);
  });
});
