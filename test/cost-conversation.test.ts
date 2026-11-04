import { afterEach, describe, expect, it } from 'vitest';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import { createManualRoom } from '../apps/frontend/src/features/session/entry/manual-room.js';
import { costConversation } from '../apps/frontend/src/features/cost/conversation.js';
import { marketTargets } from '../apps/frontend/src/features/cost/market-research.js';
import {
  projectOf,
  recoveryOf,
} from '../apps/frontend/src/features/session/project.js';
const sessions: SessionController[] = [];
function session() {
  const c = new SessionController(createManualRoom('partial'));
  sessions.push(c);
  c.setDestination('cost', 'en-US');
  return c;
}
afterEach(() => sessions.splice(0).forEach((c) => c.dispose()));
describe('separate session-owned Estimate conversation UI', () => {
  it('restores delegated presentation as UI data without replaying selection or research', () => {
    const c = session(),
      store = costConversation(c);
    store.set('guide', {
      stage: 'choosing',
      key: 'surface:floor',
      mode: 'automatic',
      passId: 1,
    });
    const saved = recoveryOf(c.getSnapshot())!;
    expect(saved.conversations!.estimate!.ui!.guide.mode).toBe('automatic');
    const restored = new SessionController();
    sessions.push(restored);
    expect(restored.restore(saved)).toBe(true);
    restored.setDestination('cost', 'en-US');
    expect(costConversation(restored).getSnapshot().guide.mode).toBe(
      'automatic',
    );
    expect(restored.getSnapshot().pending).toBeNull();
    expect(restored.getSnapshot().cost!.productChoices).toEqual(
      c.getSnapshot().cost!.productChoices,
    );
  });
  it('retains result placement, product entries, draft and view across Design return/remount', () => {
    const c = session(),
      store = costConversation(c),
      s = c.getSnapshot(),
      target = marketTargets(s.workspace!.current)[0]!;
    c.costMessage('visitor', 'Find all my options');
    store.set('researchAfter', s.cost!.messages.at(-1)?.id ?? 1);
    store.set('input', 'Keep this Estimate draft');
    store.set('section', 'furniture');
    store.set('guide', {
      stage: 'choosing',
      key: target.key,
      reviewedKeys: [target.key],
      passId: 7,
      mode: 'automatic',
    });
    store.set('entries', [
      {
        target,
        update: { kind: 'finding' },
        roomRevision: s.workspace!.current.roomRevision,
        costRevision: s.cost!.revision,
        generation: s.generation,
        workspaceId: s.workspace!.workspaceId,
      },
    ]);
    store.set('remaining', [target]);
    const before = store.getSnapshot(),
      messages = c.getSnapshot().cost!.messages;
    c.setDestination('design');
    expect(c.costMessage('assistant', 'Inactive late response')).toBe(false);
    c.setDestination('cost', 'en-US');
    const remounted = costConversation(c);
    expect(remounted).toBe(store);
    expect(remounted.getSnapshot()).toBe(before);
    expect(remounted.getSnapshot().guide).toEqual({
      stage: 'choosing',
      key: target.key,
      reviewedKeys: [target.key],
      passId: 7,
      mode: 'automatic',
    });
    expect(c.getSnapshot().cost!.messages).toBe(messages);
  });
  it('bounds cached results and drafts, recovering display state without pending work or project data', () => {
    const c = session(),
      store = costConversation(c),
      s = c.getSnapshot(),
      target = marketTargets(s.workspace!.current)[0]!;
    store.set('input', 'x'.repeat(8000));
    expect(store.getSnapshot().input).toHaveLength(4000);
    store.set('message', 'RETAINED_ONLY_ESTIMATE');
    store.set('guide', { stage: 'choosing', key: 'GUIDE_ONLY_KEY' });
    store.set('guide', {
      ...store.getSnapshot().guide,
      reviewedKeys: Array.from({ length: 80 }, (_, i) => `key_${i}`),
    });
    expect(store.getSnapshot().guide.reviewedKeys).toHaveLength(64);
    store.set(
      'entries',
      Array.from({ length: 60 }, (_, i) => ({
        target: { ...target, key: `target-${i}` },
        update: { kind: 'finding' as const },
        roomRevision: 0,
        costRevision: 0,
        generation: s.generation,
        workspaceId: s.workspace!.workspaceId,
      })),
    );
    expect(store.getSnapshot().entries).toHaveLength(45);
    expect(JSON.stringify(projectOf(c.getSnapshot()))).not.toContain(
      'RETAINED_ONLY_ESTIMATE',
    );
    expect(JSON.stringify(recoveryOf(c.getSnapshot()))).not.toContain(
      'RETAINED_ONLY_ESTIMATE',
    );
    expect(JSON.stringify(projectOf(c.getSnapshot()))).not.toContain(
      'GUIDE_ONLY_KEY',
    );
    const saved = recoveryOf(c.getSnapshot())!.conversations!.estimate!.ui!;
    expect(saved.guide.key).toBe('GUIDE_ONLY_KEY');
    expect(saved.guide.reviewedKeys).toHaveLength(64);
    expect(saved.input).toHaveLength(4000);
    expect(saved.entries).toEqual([]);
    expect(saved.message).toBe(
      'Search paused. Your found options and choices are saved.',
    );
  });
  it('clears on New Room/import/disposal and prevents retired UI callbacks restoring old data', () => {
    const c = session(),
      old = costConversation(c);
    old.set('input', 'Old room draft');
    const project = projectOf(c.getSnapshot())!;
    expect(c.reset(createManualRoom('partial'))).toBe(true);
    old.set('input', 'Late stale callback');
    expect(old.getSnapshot().input).toBe('');
    c.setDestination('cost', 'en-US');
    const next = costConversation(c);
    expect(next).not.toBe(old);
    expect(next.getSnapshot().guide).toEqual({ stage: 'ready', key: null });
    next.set('input', 'New draft');
    expect(c.importProject(project)).toBe(true);
    expect(next.getSnapshot().input).toBe('');
    const imported = costConversation(c);
    expect(imported.getSnapshot().input).toBe('');
    imported.set('message', 'Private result');
    c.dispose();
    expect(imported.getSnapshot().message).toBe('');
  });
  it('clears on expiry while preserving normal phase-only cancellation', () => {
    let now = 0;
    const c = new SessionController(createManualRoom('partial'), {
      now: () => now,
    });
    sessions.push(c);
    c.setDestination('cost', 'en-US');
    const store = costConversation(c);
    store.set('input', 'Draft');
    const token = c.beginOperation()!;
    c.setDestination('design');
    expect(c.isCurrent(token)).toBe(false);
    expect(store.getSnapshot().input).toBe('Draft');
    now = 10_000_000;
    c.checkExpiry();
    expect(store.getSnapshot().input).toBe('');
  });
});
