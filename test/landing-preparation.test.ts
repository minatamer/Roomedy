import { describe, expect, it } from 'vitest';
import { prepareLandingScene } from '../apps/frontend/src/features/landing/prepare-scene.js';

describe('landing GPU preparation ownership', () => {
  it('uploads, waits for shader completion and warms the first render before visible readiness', async () => {
    const order: string[] = [];
    let resolve!: () => void;
    const compiled = new Promise<void>((r) => {
      resolve = r;
    });
    const task = prepareLandingScene({
      current: () => true,
      upload: () => {
        order.push('upload');
      },
      compile: () => {
        order.push('compile');
        return compiled;
      },
      warm: () => {
        order.push('warm');
      },
      ready: () => {
        order.push('ready');
      },
      failed: () => {
        order.push('failed');
      },
    });
    expect(order).toEqual(['upload', 'compile']);
    resolve();
    await task;
    expect(order).toEqual(['upload', 'compile', 'warm', 'ready']);
  });
  it('fences a retired canvas after asynchronous compilation', async () => {
    const order: string[] = [];
    let current = true,
      resolve!: () => void;
    const compiled = new Promise<void>((r) => {
      resolve = r;
    });
    const task = prepareLandingScene({
      current: () => current,
      upload: () => {
        order.push('upload');
      },
      compile: () => compiled,
      warm: () => {
        order.push('warm');
      },
      ready: () => {
        order.push('ready');
      },
      failed: () => {
        order.push('failed');
      },
    });
    current = false;
    resolve();
    await task;
    expect(order).toEqual(['upload']);
  });
  it('keeps a failed preparation on the fallback without reporting readiness', async () => {
    for (const stage of ['upload', 'compile', 'warm']) {
      const events: string[] = [];
      await prepareLandingScene({
        current: () => true,
        upload: () => {
          if (stage === 'upload') throw Error();
        },
        compile: async () => {
          if (stage === 'compile') throw Error();
        },
        warm: () => {
          if (stage === 'warm') throw Error();
        },
        ready: () => {
          events.push('ready');
        },
        failed: () => {
          events.push('failed');
        },
      });
      expect(events).toEqual(['failed']);
    }
  });
  it('never reports an asynchronous failure after retirement', async () => {
    let current = true,
      reject!: (e: Error) => void;
    const events: string[] = [];
    const compiled = new Promise<void>((_, r) => {
      reject = r;
    });
    const task = prepareLandingScene({
      current: () => current,
      upload: () => {},
      compile: () => compiled,
      warm: () => {
        events.push('warm');
      },
      ready: () => {
        events.push('ready');
      },
      failed: () => {
        events.push('failed');
      },
    });
    current = false;
    reject(Error());
    await task;
    expect(events).toEqual([]);
  });
});
