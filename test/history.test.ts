import { describe, expect, it } from 'vitest';
import { POLICY } from '@roomedy/contracts/policy';
import { emptyHistory, popHistory, pushHistory } from '@roomedy/spatial';
import { commandRoom, piece } from './fixtures/command-room.js';

describe('bounded whole-instruction semantic history', () => {
  it('prunes oldest entries at the count boundary without mutating earlier snapshots', () => {
    const room = commandRoom([piece('a')]);
    let history = emptyHistory();
    for (let n = 0; n <= POLICY.undoEntries; n++) {
      room.roomRevision = n;
      history = pushHistory(history, room, `command_${n}`).history;
    }
    expect(history.entries).toHaveLength(POLICY.undoEntries);
    expect(history.entries[0]!.commandId).toBe('command_1');
    expect(history.entries.at(-1)!.previous.roomRevision).toBe(
      POLICY.undoEntries,
    );
    room.furniture[0]!.label = 'changed after recording';
    expect(history.entries[0]!.previous.furniture[0]!.label).toBe('a');
    expect(
      Object.isFrozen(history.entries[0]!.previous.furniture[0]!.pose),
    ).toBe(true);
    const popped = popHistory(history)!;
    expect(popped.entry.commandId).toBe(`command_${POLICY.undoEntries}`);
    expect(popped.history.entries).toHaveLength(POLICY.undoEntries - 1);
    expect(history.entries).toHaveLength(POLICY.undoEntries);
  });

  it('accounts for actual UTF-8 bytes and deterministically prunes at the byte boundary', () => {
    const room = commandRoom([piece('a')]);
    room.furniture[0]!.label = 'غرفة 🪑';
    const snapshotBytes = Buffer.byteLength(
      JSON.stringify({ commandId: 'one', previous: room }),
      'utf8',
    );
    const one = pushHistory(emptyHistory(), room, 'one', {
      entries: 20,
      bytes: snapshotBytes,
    });
    expect(one.recorded).toBe(true);
    expect(one.history.bytes).toBe(snapshotBytes);
    const two = pushHistory(one.history, room, 'two', {
      entries: 20,
      bytes: snapshotBytes,
    });
    expect(two.history.entries.map((entry) => entry.commandId)).toEqual([
      'two',
    ]);
    expect(two.history.bytes).toBe(snapshotBytes);
    const tooSmall = pushHistory(two.history, room, 'big', {
      entries: 20,
      bytes: snapshotBytes - 1,
    });
    expect(tooSmall.recorded).toBe(false);
    expect(tooSmall.history).toEqual({ entries: [], bytes: 0 });
  });

  it('supports no-history policies and rejects invalid policy values', () => {
    const room = commandRoom();
    expect(
      pushHistory(emptyHistory(), room, 'off', { entries: 0, bytes: 0 }),
    ).toEqual({ history: { entries: [], bytes: 0 }, recorded: false });
    expect(popHistory(emptyHistory())).toBeUndefined();
    for (const limits of [
      { entries: -1, bytes: 100 },
      { entries: 1.5, bytes: 100 },
      { entries: POLICY.undoEntries + 1, bytes: 100 },
      { entries: 1, bytes: POLICY.undoBytes + 1 },
      { entries: 1, bytes: NaN },
    ])
      expect(() =>
        pushHistory(emptyHistory(), room, 'invalid', limits),
      ).toThrow('invalid-history-policy');
  });
});
