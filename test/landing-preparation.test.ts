import { describe, expect, it } from 'vitest';
import { prepareLandingScene } from '../apps/frontend/src/features/landing/prepare-scene.js';

const deferred = () => {
  let resolve!: () => void, reject!: (reason: Error) => void;
  const promise = new Promise<void>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
};
const tick = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('landing GPU preparation ownership', () => {
  it('retires both scheduled jobs before they start if cleanup wins the next microtask', async () => {
    const events: string[] = [];
    let current = true;
    const task = prepareLandingScene({
      current: () => current,
      load: async () => {
        events.push('load');
      },
      initialize: () => {
        events.push('environment');
      },
      compile: async () => {
        events.push('compile');
      },
      upload: () => {
        events.push('upload');
      },
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
    await task;
    expect(events).toEqual([]);
  });

  it('overlaps images with environment/compilation, then uploads final pixels and warms before readiness', async () => {
    const events: string[] = [],
      loaded = deferred(),
      compiled = deferred();
    const task = prepareLandingScene({
      current: () => true,
      load: () => {
        events.push('load');
        return loaded.promise;
      },
      initialize: () => {
        events.push('environment');
      },
      compile: () => {
        events.push('compile');
        return compiled.promise;
      },
      upload: () => {
        events.push('upload');
      },
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
    await tick();
    expect(events).toEqual(['load', 'environment', 'compile']);
    compiled.resolve();
    await tick();
    expect(events).toEqual(['load', 'environment', 'compile']);
    loaded.resolve();
    await task;
    expect(events).toEqual([
      'load',
      'environment',
      'compile',
      'upload',
      'warm',
      'ready',
    ]);
  });

  it('fences a retired canvas while either independent job is unfinished', async () => {
    const events: string[] = [],
      compiled = deferred();
    let current = true;
    const task = prepareLandingScene({
      current: () => current,
      load: async () => {},
      initialize: () => {
        events.push('environment');
      },
      compile: () => compiled.promise,
      upload: () => {
        events.push('upload');
      },
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
    await tick();
    current = false;
    compiled.resolve();
    await task;
    expect(events).toEqual(['environment']);
  });

  it.each(['load', 'initialize', 'compile', 'upload', 'warm'])(
    'keeps a failed %s stage from publishing readiness',
    async (stage) => {
      const events: string[] = [];
      const fail = (name: string) => {
        if (stage === name) throw new Error('fixture-failure');
      };
      await prepareLandingScene({
        current: () => true,
        load: async () => {
          fail('load');
        },
        initialize: () => fail('initialize'),
        compile: async () => {
          fail('compile');
        },
        upload: () => fail('upload'),
        warm: () => fail('warm'),
        ready: () => {
          events.push('ready');
        },
        failed: () => {
          events.push('failed');
        },
      });
      expect(events).toEqual(['failed']);
    },
  );

  it('retains an unresolved image job even if compilation fails, without late upload', async () => {
    const loaded = deferred(),
      events: string[] = [];
    const task = prepareLandingScene({
      current: () => true,
      load: () => loaded.promise,
      initialize: () => {},
      compile: async () => {
        throw new Error('fixture-compile');
      },
      upload: () => {
        events.push('upload');
      },
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
    let settled = false;
    void task.then(() => {
      settled = true;
    });
    await tick();
    expect(settled).toBe(false);
    expect(events).toEqual([]);
    loaded.resolve();
    await task;
    expect(events).toEqual(['failed']);
  });

  it('never reports an asynchronous failure after retirement', async () => {
    const compiled = deferred(),
      events: string[] = [];
    let current = true;
    const task = prepareLandingScene({
      current: () => current,
      load: async () => {},
      initialize: () => {},
      compile: () => compiled.promise,
      upload: () => {
        events.push('upload');
      },
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
    await tick();
    current = false;
    compiled.reject(new Error('fixture-compile'));
    await task;
    expect(events).toEqual([]);
  });

  it('does not start either job on an already retired canvas', async () => {
    const events: string[] = [];
    await prepareLandingScene({
      current: () => false,
      load: async () => {
        events.push('load');
      },
      initialize: () => {
        events.push('environment');
      },
      compile: async () => {
        events.push('compile');
      },
      upload: () => {
        events.push('upload');
      },
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
    expect(events).toEqual([]);
  });
});
