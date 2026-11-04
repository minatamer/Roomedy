import { afterEach, describe, expect, it, vi } from 'vitest';
import { createResearchScope } from '../apps/frontend/src/features/cost/research-scope.js';
import { verificationSnapshot } from '../apps/frontend/src/features/verification/state.js';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import { createRoomFixture } from '../apps/frontend/src/features/session/fixtures/rooms.js';

const sessions: SessionController[] = [];
const challenge = (key: string) => ({
  siteKey: 'synthetic-site',
  action: 'roomedy-ai' as const,
  inputHash: key.repeat(64),
});
function scope(verify?: Parameters<typeof createResearchScope>[1]) {
  const controller = new SessionController(createRoomFixture('sample'));
  sessions.push(controller);
  return createResearchScope(controller.beginOperation()!, verify);
}
afterEach(() => {
  verificationSnapshot()?.finish();
  sessions.splice(0).forEach((controller) => controller.dispose());
});
describe('batch verification lane', () => {
  it('shows one exact challenge at a time and keeps each proof with its caller', async () => {
    const lane = scope(),
      a = new AbortController(),
      b = new AbortController();
    const first = lane.verify(challenge('a'), a.signal);
    const second = lane.verify(challenge('b'), b.signal);
    await vi.waitFor(() =>
      expect(verificationSnapshot()?.challenge).toEqual(challenge('a')),
    );
    verificationSnapshot()!.finish('proof-a');
    expect(await first).toBe('proof-a');
    await vi.waitFor(() =>
      expect(verificationSnapshot()?.challenge).toEqual(challenge('b')),
    );
    verificationSnapshot()!.finish('proof-b');
    expect(await second).toBe('proof-b');
    expect(verificationSnapshot()).toBeNull();
  });
  it('settles a cancelled queued caller without letting another prompt overtake its predecessor', async () => {
    const lane = scope(),
      a = new AbortController(),
      b = new AbortController(),
      c = new AbortController();
    const first = lane.verify(challenge('a'), a.signal);
    const second = lane.verify(challenge('b'), b.signal);
    const third = lane.verify(challenge('c'), c.signal);
    await vi.waitFor(() =>
      expect(verificationSnapshot()?.challenge).toEqual(challenge('a')),
    );
    const old = verificationSnapshot()!;
    b.abort();
    expect(await second).toBeNull();
    expect(verificationSnapshot()).toBe(old);
    old.finish('proof-a');
    expect(await first).toBe('proof-a');
    await vi.waitFor(() =>
      expect(verificationSnapshot()?.challenge).toEqual(challenge('c')),
    );
    old.finish('late-proof');
    expect(verificationSnapshot()?.challenge).toEqual(challenge('c'));
    verificationSnapshot()!.finish('proof-c');
    expect(await third).toBe('proof-c');
  });
  it('aborts both active and queued proofs without activating stale prompts', async () => {
    const lane = scope(),
      a = new AbortController(),
      b = new AbortController();
    const first = lane.verify(challenge('a'), a.signal);
    const second = lane.verify(challenge('b'), b.signal);
    await vi.waitFor(() => expect(verificationSnapshot()).not.toBeNull());
    b.abort();
    a.abort();
    expect(await Promise.all([first, second])).toEqual([null, null]);
    await Promise.resolve();
    expect(verificationSnapshot()).toBeNull();
  });
  it('does not poison the queue when a proof fails', async () => {
    const verify = vi
      .fn()
      .mockRejectedValueOnce(new Error('synthetic'))
      .mockResolvedValueOnce('next-proof');
    const lane = scope(verify),
      signal = new AbortController().signal;
    const first = lane.verify(challenge('a'), signal);
    const second = lane.verify(challenge('b'), signal);
    await expect(first).rejects.toThrow('synthetic');
    expect(await second).toBe('next-proof');
    expect(verify.mock.calls.map(([value]) => value.inputHash)).toEqual([
      'a'.repeat(64),
      'b'.repeat(64),
    ]);
  });
  it('never activates an already-cancelled proof', async () => {
    const verify = vi.fn(),
      lane = scope(verify),
      abort = new AbortController();
    abort.abort();
    expect(await lane.verify(challenge('a'), abort.signal)).toBeNull();
    expect(verify).not.toHaveBeenCalled();
  });
});
