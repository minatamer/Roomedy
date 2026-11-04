import { afterEach, describe, expect, it, vi } from 'vitest';
import { POLICY, PUBLIC_LIMITS, VERSIONS } from '@roomedy/contracts/policy';
import type { Recovery } from '@roomedy/contracts/project';
import { sampleEstimateOffers } from '@roomedy/spatial';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import {
  SessionPersistence,
  RECOVERY_KEY,
} from '../apps/frontend/src/features/session/persistence.js';
import {
  exportProject,
  projectOf,
  readRecovery,
  recoveryOf,
} from '../apps/frontend/src/features/session/project.js';
import { createRoomFixture } from '../apps/frontend/src/features/session/fixtures/rooms.js';
import { AssistantController } from '../apps/frontend/src/features/assistant/controller.js';
import { revealWords } from '../apps/frontend/src/features/assistant/message-reveal.js';
import { costConversation } from '../apps/frontend/src/features/cost/conversation.js';
import type { MarketEntry } from '../apps/frontend/src/features/cost/conversation.js';
import { marketTargets } from '../apps/frontend/src/features/cost/market-research.js';
import { buildSourcingBrief } from '../apps/frontend/src/features/cost/brief.js';
import {
  chooseGuidedProduct,
  entryIsCurrent,
} from '../apps/frontend/src/features/cost/selection-guide.js';

class Storage {
  value: string | null = null;
  writes = 0;
  afterWrite: (() => void) | null = null;
  getItem(key: string) {
    return key === RECOVERY_KEY ? this.value : null;
  }
  setItem(_key: string, value: string) {
    this.value = value;
    this.writes++;
    this.afterWrite?.();
  }
  removeItem() {
    this.value = null;
  }
}
const close: Array<() => void> = [];
afterEach(() => {
  close.splice(0).forEach((dispose) => dispose());
  vi.useRealTimers();
});
function setup(storage = new Storage(), now = () => 0) {
  const session = new SessionController(createRoomFixture('sample'), { now });
  const persistence = new SessionPersistence(session, storage, now);
  close.push(() => {
    persistence.dispose();
    session.dispose();
  });
  return { session, persistence, storage };
}
async function assistantFor(session: SessionController) {
  const transport = vi.fn<typeof fetch>(async (url) => {
    if (!String(url).endsWith('/config')) throw Error('Unexpected paid replay');
    return Response.json({
      mode: 'fake',
      capabilities: {
        manual: true,
        assistant: true,
        recognition: true,
        sourcing: true,
        simulation: true,
      },
      limits: PUBLIC_LIMITS,
    });
  });
  const assistant = new AssistantController(session, { transport });
  await vi.waitFor(() => expect(assistant.getSnapshot().mode).toBe('fake'));
  return { assistant, transport };
}
function pricePaint(session: SessionController) {
  session.setDestination('cost', 'en-US');
  const state = session.getSnapshot();
  const paint = sampleEstimateOffers().find((offer) => offer.kind === 'paint')!;
  paint.market = { ...state.cost!.settings.locality };
  if (paint.kind === 'paint')
    paint.colour = buildSourcingBrief(
      state.workspace!.current,
      'surface:north',
    )!.colour!;
  paint.source = {
    ...paint.source,
    kind: 'manual',
    url: null,
    observedAt: null,
  };
  const settings = structuredClone(state.cost!.settings);
  settings.walls.forEach((wall) => {
    wall.paintOfferId = paint.id;
  });
  expect(session.updateCost(settings, [paint])).toBe(true);
}
function entriesFor(session: SessionController): MarketEntry[] {
  const state = session.getSnapshot();
  return marketTargets(state.workspace!.current).map((target, index) => ({
    target,
    roomRevision: state.workspace!.current.roomRevision,
    costRevision: state.cost!.revision,
    workspaceId: state.workspace!.workspaceId,
    generation: state.generation,
    update: {
      kind: 'answer',
      answer: {
        ok: true,
        simulation: true,
        input: {
          kind: 'sourcing',
          schemaVersion: VERSIONS.schema,
          catalogueVersion: VERSIONS.catalogue,
          rulesVersion: VERSIONS.rules,
          identity: {
            workspaceId: state.workspace!.workspaceId,
            generation: state.generation,
            operationId: 'old-private-operation',
            roomId: state.workspace!.current.roomId,
            inputRevision: state.workspace!.current.roomRevision,
          },
          costRevision: state.cost!.revision,
          locality: state.cost!.settings.locality,
          brief: target.brief,
        },
        reply: {
          notes: [],
          candidates: [
            {
              label: `Saved product ${index}`,
              url: `https://merchant.example/products/${index}`,
              imageUrl: null,
              evidence: 'Offline recovery fixture',
              match: 'similar',
              conditions: 'standard',
              differences: [],
              offer: null,
              listing: {
                priceMinor: 10000,
                currency: 'USD',
                country: 'US',
                unit:
                  target.brief.kind === 'floor'
                    ? 'pack'
                    : target.brief.kind === 'paint'
                      ? 'can'
                      : 'item',
                volumeMl: null,
                observedAt: 123,
              },
            },
          ],
        },
      },
    },
  }));
}
function saveRecord(session: SessionController): Recovery {
  const record = recoveryOf(session.getSnapshot());
  expect(record).not.toBeNull();
  return record!;
}

describe('same-tab conversation recovery', () => {
  it('retains a natural finish follow-up but never restores an unapplied proposal', async () => {
    const first = setup();
    const original = first.session.getSnapshot().workspace!.current;
    const desk = original.furniture.find((item) => /desk/i.test(item.label))!;
    const initial = await assistantFor(first.session);
    await initial.assistant.submit('Make the desk ivory');
    expect(first.session.getSnapshot().candidate).not.toBeNull();
    expect(first.session.getSnapshot().workspace!.current).toEqual(original);
    expect(first.persistence.flush()).toBe(true);
    const second = setup(first.storage);
    const restored = await assistantFor(second.session);
    expect(second.session.getSnapshot().candidate).toBeNull();
    expect(second.session.getSnapshot().pending).toBeNull();
    expect(second.session.getSnapshot().workspace!.current).toEqual(original);
    await restored.assistant.submit('Actually, make it walnut instead');
    expect(
      second.session
        .getSnapshot()
        .candidate?.room.furniture.find((item) => item.id === desk.id)?.finish,
    ).toBe('walnut');
    expect(second.session.getSnapshot().workspace!.current).toEqual(original);
    expect(
      restored.transport.mock.calls.every(([url]) =>
        String(url).endsWith('/config'),
      ),
    ).toBe(true);
  });

  it('saves chat-only Medy/Estimate edits, restores both and appends new uniquely revealed messages without replay', async () => {
    const first = setup();
    const { assistant } = await assistantFor(first.session);
    assistant.chooseGuidance(0, 'services');
    assistant.draft('Keep this unsent design question');
    const before = assistant.getSnapshot();
    expect(before.messages.length).toBeGreaterThan(0);
    first.session.setDestination('cost', 'en-US');
    first.session.costMessage('visitor', 'Keep this estimate discussion');
    expect(first.persistence.flush()).toBe(true);
    const text = first.storage.value!;
    expect(text).toContain('Keep this estimate discussion');
    expect(text).toContain('Keep this unsent design question');
    expect(JSON.stringify(JSON.parse(text).conversations)).not.toMatch(
      /"(?:operationId|workspaceId|pending|grant|candidate|mode)":/,
    );
    const second = setup(first.storage, () => 1000);
    expect(second.session.getSnapshot().recovered).toBe(true);
    expect(second.session.getSnapshot().expiresAt).toBe(POLICY.guestLifetimeMs);
    const restored = await assistantFor(second.session);
    expect(
      restored.assistant.getSnapshot().messages.map((message) => message.text),
    ).toEqual(before.messages.map((message) => message.text));
    expect(restored.assistant.getSnapshot().draft).toBe(before.draft);
    expect(restored.assistant.getSnapshot()).toMatchObject({
      busy: false,
      stage: 'idle',
      mode: 'fake',
    });
    expect(
      restored.assistant
        .getSnapshot()
        .messages.every((message) => message.operationId === null),
    ).toBe(true);
    expect(second.session.getSnapshot().cost!.messages.at(-1)?.text).toBe(
      'Keep this estimate discussion',
    );
    const old = restored.assistant.getSnapshot().messages.at(-1)!;
    expect(restored.assistant.reveal.begin(old.id, 0)).toBeGreaterThan(
      revealWords(old.text).duration,
    );
    second.session.setDestination('design');
    restored.assistant.undo();
    const newest = restored.assistant.getSnapshot().messages.at(-1)!;
    expect(newest.id).toBeGreaterThan(old.id);
    expect(restored.assistant.reveal.begin(newest.id, 0)).toBe(0);
    expect(
      restored.transport.mock.calls.every(([url]) =>
        String(url).endsWith('/config'),
      ),
    ).toBe(true);
    expect(second.session.getSnapshot().pending).toBeNull();
    expect(second.session.getSnapshot().candidate).toBeNull();
    expect(exportProject(second.session.getSnapshot())).not.toContain(
      'Keep this estimate discussion',
    );
    expect(exportProject(second.session.getSnapshot())).not.toContain(
      'Keep this unsent design question',
    );
  });

  it('keeps older breakdowns historical when fresh recovery counters collide with their old revision pair', () => {
    const first = setup();
    pricePaint(first.session);
    expect(
      first.session.importProject(projectOf(first.session.getSnapshot())!),
    ).toBe(true);
    expect(first.session.costBreakdown()).toBe(true);
    const old = first.session.getSnapshot().cost!.messages.at(-1)!;
    expect(old).toMatchObject({
      kind: 'breakdown',
      roomRevision: 0,
      costRevision: 0,
    });
    first.session.costMessage(
      'assistant',
      'Earlier detailed cost explanation',
      ['line_north'],
    );
    const explanation = first.session.getSnapshot().cost!.messages.at(-1)!;
    const pricing = first.session.getSnapshot().cost!;
    expect(
      first.session.updateCost({
        ...pricing.settings,
        floor: { ...pricing.settings.floor, wasteBps: 2500 },
      }),
    ).toBe(true);
    expect(first.session.costBreakdown()).toBe(true);
    const latest = first.session.getSnapshot().cost!.messages.at(-1)!;
    expect(first.persistence.flush()).toBe(true);
    const second = setup(first.storage);
    const messages = second.session.getSnapshot().cost!.messages;
    expect(messages.find((message) => message.id === old.id)).toMatchObject({
      text: old.text,
      historical: true,
      roomRevision: 0,
      costRevision: 0,
    });
    expect(
      messages.find((message) => message.id === explanation.id),
    ).toMatchObject({
      text: explanation.text,
      historical: true,
      lineIds: ['line_north'],
    });
    expect(messages.at(-1)).toMatchObject({
      id: latest.id,
      text: latest.text,
      roomRevision: 0,
      costRevision: 0,
    });
    expect(messages.at(-1)?.historical).toBeUndefined();
    expect(second.session.costReveal.begin(latest.id!, 0)).toBeGreaterThan(
      revealWords(latest.text).duration,
    );
    second.session.costMessage('visitor', 'A new question');
    expect(
      second.session.getSnapshot().cost!.messages.at(-1)!.id,
    ).toBeGreaterThan(latest.id!);
  });

  it('restores finished option cards and explicit remaining work across two reloads with fresh ownership', () => {
    const first = setup();
    first.session.setDestination('cost', 'en-US');
    first.session.costMessage('visitor', 'Find options for my room.');
    const entries = entriesFor(first.session);
    const ui = costConversation(first.session);
    ui.set('entries', entries.slice(0, 2));
    ui.set(
      'remaining',
      entries.slice(2).map((entry) => entry.target),
    );
    ui.set(
      'researchAfter',
      first.session.getSnapshot().cost!.messages.at(-1)!.id!,
    );
    ui.set('input', 'Unsent estimate question');
    expect(first.persistence.flush()).toBe(true);
    expect(first.storage.value).not.toContain('old-private-operation');
    const second = setup(first.storage);
    const restored = costConversation(second.session).getSnapshot();
    expect(restored.input).toBe('Unsent estimate question');
    expect(restored.entries).toHaveLength(2);
    expect(restored.remaining).toHaveLength(entries.length - 2);
    expect(
      restored.entries.every((entry) =>
        entryIsCurrent(entry, second.session.getSnapshot()),
      ),
    ).toBe(true);
    expect(second.session.getSnapshot().pending).toBeNull();
    expect(second.persistence.flush()).toBe(true);
    const third = setup(second.storage);
    const repeated = costConversation(third.session).getSnapshot();
    expect(
      repeated.entries.every((entry) =>
        entryIsCurrent(entry, third.session.getSnapshot()),
      ),
    ).toBe(true);
    const entry = repeated.entries[0]!;
    if (entry.update.kind !== 'answer' || !entry.update.answer.ok)
      throw Error('Fixture');
    expect(
      chooseGuidedProduct(
        third.session,
        repeated.entries,
        entry,
        entry.update.answer.reply.candidates[0]!,
        repeated.guide,
      ).ok,
    ).toBe(true);
    expect(third.session.getSnapshot().cost!.productChoices).toHaveLength(1);
  });

  it('does not make a previously stale card actionable after a pricing change and Continue', () => {
    const first = setup();
    first.session.setDestination('cost', 'en-US');
    costConversation(first.session).set('entries', entriesFor(first.session));
    const cost = first.session.getSnapshot().cost!;
    expect(
      first.session.updateCost({
        ...cost.settings,
        floor: { ...cost.settings.floor, wasteBps: 2500 },
      }),
    ).toBe(true);
    expect(first.persistence.flush()).toBe(true);
    const second = setup(first.storage);
    const entries = costConversation(second.session).getSnapshot().entries;
    expect(entries.length).toBeGreaterThan(0);
    expect(
      entries.every(
        (entry) => !entryIsCurrent(entry, second.session.getSnapshot()),
      ),
    ).toBe(true);
    const entry = entries[0]!;
    if (entry.update.kind !== 'answer' || !entry.update.answer.ok)
      throw Error('Fixture');
    expect(
      chooseGuidedProduct(
        second.session,
        entries,
        entry,
        entry.update.answer.reply.candidates[0]!,
        { stage: 'ready', key: null },
      ).ok,
    ).toBe(false);
    expect(second.session.getSnapshot().cost!.settings.floor.wasteBps).toBe(
      2500,
    );
  });

  it('fences a reentrant chat-only write and never marks the older transcript saved', () => {
    const first = setup();
    first.session.setDestination('cost', 'en-US');
    first.session.costMessage('visitor', 'Earlier question');
    first.storage.afterWrite = () => {
      first.storage.afterWrite = null;
      first.session.costMessage('visitor', 'Question during save');
    };
    expect(first.persistence.flush()).toBe(false);
    expect(first.storage.value).toBeNull();
    expect(first.persistence.flush()).toBe(true);
    expect(first.storage.value).toContain('Question during save');
  });

  it.each(['reset', 'expiry', 'dispose'] as const)(
    'clears both channels and rejects an old conversation publisher after %s',
    async (event) => {
      let now = 0;
      const first = setup(undefined, () => now);
      const { assistant } = await assistantFor(first.session);
      assistant.draft('Old design draft');
      const identity = {
        workspaceId: first.session.getSnapshot().workspace!.workspaceId,
        generation: first.session.getSnapshot().generation,
      };
      const value = first.session.getSnapshot().conversations!;
      first.session.setDestination('cost', 'en-US');
      first.session.costMessage('visitor', 'Old estimate discussion');
      first.persistence.flush();
      if (event === 'reset') first.session.reset();
      else if (event === 'dispose') first.session.dispose();
      else {
        now = POLICY.guestLifetimeMs;
        first.session.checkExpiry();
      }
      expect(first.session.rememberConversations(value, identity)).toBe(false);
      expect(first.session.getSnapshot().conversations).toBeUndefined();
      expect(first.storage.value).toBeNull();
      assistant.draft('Late text');
      expect(first.storage.value).toBeNull();
    },
  );

  it('keeps legacy chat-free recovery valid and enforces strict chat count/UTF-8/authority bounds', () => {
    const first = setup();
    const legacy = saveRecord(first.session);
    expect(legacy.conversations).toBeUndefined();
    expect(readRecovery(JSON.stringify(legacy), 0).ok).toBe(true);
    first.session.setDestination('cost', 'en-US');
    first.session.costMessage('visitor', 'Saved estimate discussion');
    const record = saveRecord(first.session);
    const poisoned = structuredClone(record) as unknown as {
      conversations: { estimate: Record<string, unknown> };
    };
    poisoned.conversations.estimate['mode'] = 'live';
    expect(readRecovery(JSON.stringify(poisoned), 0).ok).toBe(false);
    const many = structuredClone(record);
    many.conversations!.estimate!.messages = Array.from(
      { length: 41 },
      (_, index) => ({
        id: index + 1,
        role: 'visitor',
        text: 'bounded',
        roomRevision: 0,
        costRevision: 0,
      }),
    );
    expect(readRecovery(JSON.stringify(many), 0).ok).toBe(false);
    many.conversations!.estimate!.messages = Array.from(
      { length: 40 },
      (_, index) => ({
        id: index + 1,
        role: 'visitor',
        text: '😀'.repeat(2000),
        roomRevision: 0,
        costRevision: 0,
      }),
    );
    expect(readRecovery(JSON.stringify(many), 0).ok).toBe(false);
    many.conversations!.estimate!.messages = Array.from(
      { length: 32 },
      (_, index) => ({
        id: index + 1,
        role: 'visitor',
        text: '"'.repeat(4000),
        roomRevision: 0,
        costRevision: 0,
      }),
    );
    expect(readRecovery(JSON.stringify(many), 0).ok).toBe(true);
    expect(
      readRecovery(' '.repeat(POLICY.projectBytes) + JSON.stringify(record), 0)
        .ok,
    ).toBe(false);
  });
});
