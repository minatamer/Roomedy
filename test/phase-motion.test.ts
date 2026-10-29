import { expect, it, vi } from 'vitest';
import {
  animatePhase,
  boundedPanel,
  panelTransform,
} from '../apps/frontend/src/features/room-editor/phase-motion.js';
const full = { left: 0, top: 70, width: 1280, height: 650 },
  side = { left: 935, top: 70, width: 345, height: 650 };
function fixture() {
  const jobs: {
    frames: Keyframe[];
    options: KeyframeAnimationOptions;
    resolve: () => void;
    cancel: ReturnType<typeof vi.fn>;
  }[] = [];
  const animate = (
    frames: Keyframe[] | PropertyIndexedKeyframes | null,
    options?: number | KeyframeAnimationOptions,
  ) => {
    let resolve!: () => void;
    const finished = new Promise<void>((done) => {
      resolve = done;
    });
    const cancel = vi.fn();
    jobs.push({
      frames: frames as Keyframe[],
      options: options as KeyframeAnimationOptions,
      resolve,
      cancel,
    });
    return { finished, cancel } as unknown as Animation;
  };
  return {
    panel: {
      getBoundingClientRect: () => full,
      animate,
      children: [{ animate }, { animate }],
    } as unknown as HTMLElement,
    jobs,
  };
}
it('maps the real side rectangle to the full conversation and bounds offscreen phone panels', () => {
  expect(panelTransform(side, full)).toBe(
    'translate(935px, 0px) scale(0.26953125, 1)',
  );
  expect(
    boundedPanel(
      { left: 0, top: 1100, width: 390, height: 600 },
      { left: 0, top: 130, width: 390, height: 710 },
    ),
  ).toEqual({ left: 0, top: 520.5, width: 390, height: 319.5 });
  expect(
    boundedPanel({ left: 900, top: 60, width: 500, height: 900 }, full),
  ).toEqual({ left: 900, top: 70, width: 380, height: 650 });
});
it('expands first then fades content and retains the final pose until its committed handoff releases it', async () => {
  const { panel, jobs } = fixture(),
    done = vi.fn();
  const release = animatePhase(panel, side, full, true, done);
  expect(jobs[0]!.options.duration).toBe(650);
  expect(jobs[1]!.frames[1]).toMatchObject({ opacity: 0, offset: 650 / 850 });
  expect(jobs[1]!.options.duration).toBe(850);
  jobs[0]!.resolve();
  await Promise.resolve();
  expect(done).not.toHaveBeenCalled();
  jobs.slice(1).forEach((job) => job.resolve());
  await Promise.resolve();
  await Promise.resolve();
  expect(done).toHaveBeenCalledTimes(1);
  expect(jobs.every((job) => job.cancel.mock.calls.length === 0)).toBe(true);
  release();
  release();
  expect(jobs.every((job) => job.cancel.mock.calls.length === 1)).toBe(true);
});
it('keeps the shrinking panel in its final pose while React is still scheduling the hidden destination', async () => {
  const { panel, jobs } = fixture();
  let commit!: () => void;
  const done = vi.fn(() => {
    expect(jobs.every((job) => job.cancel.mock.calls.length === 0)).toBe(true);
    commit = () => release();
  });
  const release = animatePhase(panel, full, side, false, done, ['1', '1']);
  jobs.forEach((job) => job.resolve());
  await Promise.resolve();
  await Promise.resolve();
  expect(done).toHaveBeenCalledOnce();
  expect(jobs.every((job) => job.cancel.mock.calls.length === 0)).toBe(true);
  commit();
  expect(jobs.every((job) => job.cancel.mock.calls.length === 1)).toBe(true);
});
it('ignores a cancelled destination and keeps a reverse interruption at its actual content opacity', async () => {
  const first = fixture(),
    done = vi.fn(),
    cancel = animatePhase(first.panel, side, full, true, done);
  cancel();
  first.jobs.forEach((job) => job.resolve());
  await Promise.resolve();
  await Promise.resolve();
  expect(done).not.toHaveBeenCalled();
  const reverse = fixture();
  animatePhase(reverse.panel, full, side, false, done, ['0.25', '0']);
  expect(reverse.jobs[1]!.frames[0]).toEqual({ opacity: '0.25' });
  expect(reverse.jobs[2]!.frames[0]).toEqual({ opacity: '0' });
  reverse.jobs.forEach((job) => job.resolve());
  await Promise.resolve();
  await Promise.resolve();
  expect(done).toHaveBeenCalledTimes(1);
});
it('settles safely if the animation API is unavailable', () => {
  const done = vi.fn();
  animatePhase(
    {
      getBoundingClientRect: () => full,
      children: [],
    } as unknown as HTMLElement,
    side,
    full,
    true,
    done,
  );
  expect(done).toHaveBeenCalledTimes(1);
});
