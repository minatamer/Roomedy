import { expect, it } from 'vitest';
import {
  roomDesignOpportunities,
  completeQuickReplies,
  resolveAssistantTask,
  resolveMedyRequest,
} from '@roomedy/spatial';
import { createRoomFixture } from '../apps/frontend/src/features/session/fixtures/rooms.js';

it.each(['empty', 'partial', 'sample'] as const)(
  'offers supported useful additions for the actual %s inventory without changing it',
  (kind) => {
    const room = createRoomFixture(kind),
      before = structuredClone(room),
      opportunities = roomDesignOpportunities(room);
    expect(opportunities.length).toBeGreaterThan(0);
    expect(opportunities.length).toBeLessThanOrEqual(5);
    for (const option of opportunities) {
      const task = resolveAssistantTask(
        room,
        option.request,
        null,
        'opportunity',
      );
      expect(task.kind).toBe('search');
      expect(task.goal?.additions.map((choice) => choice.catalogueId)).toEqual(
        option.catalogueIds,
      );
      expect(task.scope.targetIds).toEqual([]);
      expect(task.scope.removals).toEqual([]);
    }
    expect(room).toEqual(before);
  },
);

it('notices a missing work area beside retained furniture without asking for another bed or wardrobe', () => {
  const room = createRoomFixture('partial'),
    options = roomDesignOpportunities(room);
  expect(options[0]?.catalogueIds).toEqual([
    'procedural-desk',
    'procedural-chair',
  ]);
  expect(
    options.some((option) => option.catalogueIds.includes('procedural-bed')),
  ).toBe(false);
  expect(
    options.some((option) => option.catalogueIds.includes('wardrobe-hinged')),
  ).toBe(false);
  const replies = completeQuickReplies(room, {
    message: 'Keep the north window as the work-zone anchor.',
    selectedId: null,
    choices: [
      {
        label: 'Keep the work zone open',
        request: 'How can I keep the work zone open?',
      },
    ],
  });
  expect(replies).toHaveLength(3);
  expect(replies[0]!.label).toBe('Keep the work zone open');
  expect(replies.some((reply) => reply.request === options[0]!.request)).toBe(
    true,
  );
  expect(
    replies.some((reply) =>
      /palette|finishes|design/i.test(`${reply.label} ${reply.request}`),
    ),
  ).toBe(true);
});

it('fills rejected and repeated choices with distinct valid requests instead of leaving a single button', () => {
  const room = createRoomFixture('sample');
  const replies = completeQuickReplies(room, {
    message: 'Try a lighter palette.',
    selectedId: null,
    previousRequest: 'Preview Light & airy room palette',
    choices: [
      { label: 'Repeat', request: 'Preview Light & airy room palette' },
      { label: 'Measure first', request: 'What measurements are missing?' },
      { label: 'Apply it', request: 'apply' },
    ],
  });
  expect(replies).toHaveLength(3);
  expect(new Set(replies.map((reply) => reply.request)).size).toBe(3);
  expect(
    replies.some(
      (reply) => reply.request === 'Preview Light & airy room palette',
    ),
  ).toBe(false);
  expect(
    replies.some((reply) => /measure|apply|buy|price/i.test(reply.request)),
  ).toBe(false);
  expect(
    replies.every((reply) => reply.roomRevision === room.roomRevision),
  ).toBe(true);
});

it('keeps active-preview reply choices conversational even when the model offers another addition', () => {
  const room = createRoomFixture('partial'),
    replies = completeQuickReplies(room, {
      message: 'Here is a preview.',
      selectedId: null,
      kind: 'proposal',
      choices: [{ label: 'Add a desk', request: 'I need a desk' }],
    });
  expect(replies).toHaveLength(3);
  for (const reply of replies) {
    expect(resolveMedyRequest(room, reply.request, null)).toBeNull();
    expect(resolveAssistantTask(room, reply.request, null, 'reply').kind).toBe(
      'conversation',
    );
  }
});

it('retains the main model idea and makes room for a useful addition even with three other valid replies', () => {
  const replies = completeQuickReplies(createRoomFixture('partial'), {
    message: 'Use the window as the work-zone anchor.',
    selectedId: null,
    choices: [
      {
        label: 'Keep the work zone open',
        request: 'How can I keep the work zone open?',
      },
      {
        label: 'Try warm finishes',
        request: 'Preview Warm & simple room palette',
      },
      {
        label: 'Other ideas',
        request: 'What else could make the room more useful?',
      },
    ],
  });
  expect(replies).toHaveLength(3);
  expect(replies[0]!.label).toBe('Keep the work zone open');
  expect(
    replies.some(
      (reply) => reply.request === 'I need a desk and chair near the window',
    ),
  ).toBe(true);
  expect(
    replies.some(
      (reply) => reply.request === 'Preview Warm & simple room palette',
    ),
  ).toBe(true);
});

it('uses concrete furnishing, palette and layout options when a real-style reply supplies no usable choices', () => {
  const replies = completeQuickReplies(createRoomFixture('partial'), {
    message:
      'Place a desk and chair by the north window while keeping the bed and wardrobe. A bedside cabinet could hold everyday items.',
    selectedId: null,
    choices: [],
  });
  expect(replies.map((reply) => reply.request)).toEqual([
    'I need a desk and chair near the window',
    'Preview Calm & focused room palette',
    'Suggest another layout while keeping my current furniture.',
  ]);
});

it('carries the work-area daylight idea into its preview without inventing a window choice', () => {
  const room = createRoomFixture('partial'),
    option = roomDesignOpportunities(room)[0]!,
    task = resolveAssistantTask(room, option.request, null, 'daylight');
  expect(task.kind).toBe('search');
  expect(task.goal?.windowId).toBe(
    room.room.features.find((feature) => feature.kind === 'window')!.id,
  );
  expect(task.scope.targetIds).toEqual([]);
  expect(task.scope.removals).toEqual([]);
  for (const count of [0, 2]) {
    const other = structuredClone(room),
      window = other.room.features.find(
        (feature) => feature.kind === 'window',
      )!;
    other.room.features = other.room.features.filter(
      (feature) => feature.kind !== 'window',
    );
    for (let index = 0; index < count; index++)
      other.room.features.push({ ...window, id: `window_${index}` });
    const alternative = resolveAssistantTask(
      other,
      roomDesignOpportunities(other)[0]!.request,
      null,
      'no-window-guess',
    );
    expect(alternative.kind).toBe('search');
    expect(alternative.goal?.windowId).toBeNull();
  }
});
