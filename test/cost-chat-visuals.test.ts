import { describe, expect, it } from 'vitest';
import { calculateRoomEstimate } from '@roomedy/spatial';
import { createRoomFixture } from '../apps/frontend/src/features/session/fixtures/rooms.js';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import {
  createCostDraft,
  explanationLines,
  targetKey,
} from '../apps/frontend/src/features/cost/state.js';

describe('interactive cost explanation scope', () => {
  it('preserves bounded app-owned card references across phases without adding visitor references or changing prices', () => {
    const controller = new SessionController(createRoomFixture('sample'));
    try {
      controller.setDestination('cost');
      const before = controller.getSnapshot().cost!;
      controller.costMessage('assistant', 'Cost details', [
        'a',
        'a',
        'b',
        'c',
        'd',
        'e',
      ]);
      controller.costMessage('visitor', 'Thanks', ['ignored']);
      controller.setDestination('design');
      controller.setDestination('cost');
      const after = controller.getSnapshot().cost!;
      expect(after.messages[0]!.lineIds).toEqual(['a', 'b', 'c', 'd']);
      expect(after.messages[1]!.lineIds).toBeUndefined();
      expect(after.messages[0]).toMatchObject({
        roomRevision: before.roomRevision,
        costRevision: before.revision,
      });
      expect(after.offers).toBe(before.offers);
      expect(after.settings).toBe(before.settings);
      expect(after.revision).toBe(before.revision);
      controller.costMessage('assistant', 'Choose a cost line to explore.', []);
      expect(
        controller.getSnapshot().cost!.messages.at(-1)!.lineIds,
      ).toBeUndefined();
      controller.costMessage('assistant', 'Choose a cost line.', [
        'x'.repeat(81),
        'not an id',
      ]);
      expect(
        controller.getSnapshot().cost!.messages.at(-1)!.lineIds,
      ).toBeUndefined();
    } finally {
      controller.dispose();
    }
  });
  it('keeps every floor line, including unresolved work, rather than only priced cards', () => {
    const room = createRoomFixture('sample');
    const draft = createCostDraft(room);
    const result = calculateRoomEstimate(room, draft.settings, draft.offers);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const lines = explanationLines(
      result.estimate,
      'Explain floor quantities',
      room.furniture[0]!.id,
    );
    expect(lines).toEqual(
      result.estimate.lines.filter((line) => line.category === 'floor'),
    );
    expect(lines.some((line) => line.amountMinor === null)).toBe(true);
  });
  it('links a selected piece only to its actual cost targets without changing financial facts', () => {
    const room = createRoomFixture('sample');
    const draft = createCostDraft(room);
    const result = calculateRoomEstimate(room, draft.settings, draft.offers);
    if (!result.ok) throw new Error(result.code);
    const before = JSON.stringify(result.estimate);
    const id = room.furniture[0]!.id;
    const lines = explanationLines(result.estimate, 'What does this cost?', id);
    expect(lines.length).toBeGreaterThan(0);
    expect(
      lines.every((line) =>
        line.targets.some((target) => targetKey(target) === id),
      ),
    ).toBe(true);
    expect(
      explanationLines(result.estimate, 'Explain this', 'missing-id'),
    ).toEqual([]);
    expect(JSON.stringify(result.estimate)).toBe(before);
  });
});
