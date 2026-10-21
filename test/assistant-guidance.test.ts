import { describe, expect, it, vi } from 'vitest';
import { PUBLIC_LIMITS } from '@roomedy/contracts/policy';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import { AssistantController } from '../apps/frontend/src/features/assistant/controller.js';
import {
  guidanceChoices,
  guidanceText,
} from '../apps/frontend/src/features/assistant/guidance.js';
import {
  MessageReveal,
  revealWords,
} from '../apps/frontend/src/features/assistant/message-reveal.js';
import { commandRoom, piece } from './fixtures/command-room.js';

async function setup(mode: 'fake' | 'live' = 'fake') {
  const session = new SessionController(commandRoom([piece('desk')]));
  const transport = vi.fn<typeof fetch>(async (url) => {
    if (!String(url).endsWith('/config'))
      throw new Error('unexpected provider call');
    return Response.json({
      mode,
      capabilities: {
        manual: true,
        recognition: true,
        assistant: true,
        simulation: mode === 'fake',
      },
      limits: PUBLIC_LIMITS,
    });
  });
  const assistant = new AssistantController(session, { transport });
  await vi.waitFor(() => expect(assistant.getSnapshot().mode).toBe(mode));
  return { session, assistant, transport, close: () => session.dispose() };
}

describe('progressive Medy welcome shared by fake and live mode', () => {
  it.each(['fake', 'live'] as const)(
    'layers app-owned choices in %s without a request or room mutation',
    async (mode) => {
      const s = await setup(mode),
        before = s.session.getSnapshot().workspace;
      try {
        s.assistant.draft('Keep my unfinished thought');
        s.assistant.chooseGuidance(0, 'direction');
        const direction = s.assistant.getSnapshot().messages.at(-1)!;
        expect(direction.guidance?.step).toBe('direction');
        expect(direction.reply).toBeNull();
        s.assistant.chooseGuidance(0, 'talk');
        s.assistant.chooseGuidance(direction.id, 'not-an-action');
        expect(s.assistant.getSnapshot().messages.at(-1)).toBe(direction);
        s.assistant.chooseGuidance(direction.id, 'finishes');
        const finishes = s.assistant.getSnapshot().messages.at(-1)!;
        expect(finishes.guidance?.step).toBe('finishes');
        expect(
          guidanceChoices('finishes', before!.current, false),
        ).toHaveLength(3);
        s.assistant.chooseGuidance(direction.id, 'layout');
        expect(s.assistant.getSnapshot().messages.at(-1)).toBe(finishes);
        expect(s.assistant.getSnapshot().draft).toBe(
          'Keep my unfinished thought',
        );
        expect(s.session.getSnapshot().workspace).toBe(before);
        expect(s.transport).toHaveBeenCalledTimes(1);
      } finally {
        s.close();
      }
    },
  );
  it('opens a free-text conversation, suppresses a completed tour and keeps all branches bounded', async () => {
    const s = await setup(),
      room = s.session.getSnapshot().workspace!.current;
    try {
      expect(guidanceChoices('welcome', room, false)).toHaveLength(3);
      s.assistant.completeTour();
      expect(
        guidanceChoices(
          'welcome',
          room,
          s.assistant.getSnapshot().tourSeen,
        ).some((c) => c.id === 'tour'),
      ).toBe(false);
      s.assistant.chooseGuidance(0, 'tour');
      expect(s.assistant.getSnapshot().messages).toHaveLength(0);
      s.assistant.chooseGuidance(0, 'talk');
      expect(s.assistant.getSnapshot().messages.at(-1)?.text).toBe(
        guidanceText.talk,
      );
      for (const step of [
        'welcome',
        'direction',
        'layout',
        'finishes',
        'talk',
      ] as const)
        expect(guidanceChoices(step, room, false).length).toBeLessThanOrEqual(
          3,
        );
      expect(guidanceChoices('talk', room, false)).toEqual([]);
    } finally {
      s.close();
    }
  });
  it('uses the existing exact-edit preview and one Undo for a finish leaf', async () => {
    const s = await setup(),
      before = s.session.getSnapshot().workspace!.current;
    try {
      s.assistant.chooseGuidance(0, 'direction');
      s.assistant.chooseGuidance(
        s.assistant.getSnapshot().messages.at(-1)!.id,
        'finishes',
      );
      s.assistant.chooseGuidance(
        s.assistant.getSnapshot().messages.at(-1)!.id,
        'Calm & focused',
      );
      await vi.waitFor(() =>
        expect(s.session.getSnapshot().candidate).not.toBeNull(),
      );
      expect(s.session.getSnapshot().workspace!.current).toBe(before);
      expect(s.assistant.apply().ok).toBe(true);
      expect(s.assistant.undo().ok).toBe(true);
      expect(s.session.getSnapshot().workspace!.current.furniture).toEqual(
        before.furniture,
      );
    } finally {
      s.close();
    }
  });
  it('offers two useful next steps after completing a requested tour, once', async () => {
    const s = await setup();
    try {
      s.assistant.chooseGuidance(0, 'direction');
      s.assistant.completeTour();
      const reply = s.assistant.getSnapshot().messages.at(-1)!;
      expect(reply.guidance?.step).toBe('welcome');
      expect(
        guidanceChoices(
          reply.guidance!.step,
          s.session.getSnapshot().workspace!.current,
          true,
        ),
      ).toHaveLength(2);
      s.assistant.completeTour();
      expect(s.assistant.getSnapshot().messages.at(-1)).toBe(reply);
    } finally {
      s.close();
    }
  });
  it('rejects stale revision, Before and retired choices', async () => {
    const s = await setup();
    s.assistant.chooseGuidance(0, 'direction');
    const message = s.assistant.getSnapshot().messages.at(-1)!;
    s.session.setComparison('before');
    s.assistant.chooseGuidance(message.id, 'layout');
    expect(s.assistant.getSnapshot().messages.at(-1)).toBe(message);
    s.session.setComparison('current');
    expect(
      s.session.prepareVisitorPreview(
        [{ type: 'room-finish', floorFinish: 'walnut', wallFinish: 'ivory' }],
        'Manual palette',
      ).ok,
    ).toBe(true);
    expect(s.session.applyVisitorPreview().ok).toBe(true);
    s.assistant.chooseGuidance(message.id, 'finishes');
    expect(s.assistant.getSnapshot().messages.at(-1)).toBe(message);
    s.close();
    s.assistant.chooseGuidance(0, 'direction');
    expect(s.assistant.getSnapshot().messages).toHaveLength(0);
  });
});

describe('finite word reveal timelines', () => {
  it('preserves exact whitespace and bounds even the longest allowed reply', () => {
    for (const text of [
      guidanceText.welcome,
      'One\n\ntwo  three.',
      'a '.repeat(3000),
      '',
    ]) {
      const reveal = revealWords(text);
      expect(reveal.parts.map((part) => part.text).join('')).toBe(text);
      expect(reveal.duration).toBeLessThanOrEqual(1700.001);
      expect(reveal.parts.every((part) => Number.isFinite(part.delay))).toBe(
        true,
      );
    }
  });
  it('does not restart for Strict Mode, remounts or ordinary room updates, and retires discarded history', () => {
    const ledger = new MessageReveal();
    expect(ledger.begin(0, 10)).toBe(0);
    expect(ledger.begin(0, 10)).toBe(0);
    expect(ledger.begin(0, 1010)).toBe(1000);
    expect(ledger.begin(2, 1010)).toBe(0);
    ledger.retain([4]);
    expect(ledger.begin(0, 2010)).toBe(2000);
    expect(ledger.begin(2, 2010)).toBe(0);
    ledger.clear();
    expect(ledger.begin(0, 3010)).toBe(0);
  });
});
