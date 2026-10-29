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

describe('guided Medy room design shared by fake and live mode', () => {
  it('does not advance the journey when a requested addition fails or is unavailable', async () => {
    const room = commandRoom([piece('desk')]);
    const session = new SessionController(room);
    const transport = vi.fn<typeof fetch>(async () =>
      Response.json({
        mode: 'fake',
        capabilities: {
          manual: true,
          recognition: false,
          assistant: false,
          simulation: true,
        },
        limits: PUBLIC_LIMITS,
      }),
    );
    const assistant = new AssistantController(session, { transport });
    try {
      await vi.waitFor(() =>
        expect(assistant.getSnapshot().mode).toBe('unavailable'),
      );
      assistant.chooseGuidance(0, 'services');
      assistant.chooseGuidance(
        assistant.getSnapshot().messages.at(-1)!.id,
        'start-furniture',
      );
      assistant.chooseGuidance(
        assistant.getSnapshot().messages.at(-1)!.id,
        'add-0',
      );
      await Promise.resolve();
      expect(
        assistant
          .getSnapshot()
          .messages.some((message) => message.guidance?.step === 'openings'),
      ).toBe(false);
      expect(session.getSnapshot().workspace!.current).toEqual(room);
      expect(session.getSnapshot().candidate).toBeNull();
      expect(transport).toHaveBeenCalledTimes(1);
    } finally {
      session.dispose();
    }
  });
  it('Show me around invokes the real tour control without an assistant operation', async () => {
    const session = new SessionController(commandRoom([piece('desk')]));
    const control = vi.fn(async () => ({ ok: true, summary: 'Tour opened.' }));
    const transport = vi.fn<typeof fetch>(async () =>
      Response.json({
        mode: 'fake',
        capabilities: {
          manual: true,
          recognition: true,
          assistant: true,
          simulation: true,
        },
        limits: PUBLIC_LIMITS,
      }),
    );
    const assistant = new AssistantController(session, { control, transport });
    try {
      await vi.waitFor(() => expect(assistant.getSnapshot().mode).toBe('fake'));
      assistant.chooseGuidance(0, 'tour');
      await vi.waitFor(() =>
        expect(control).toHaveBeenCalledExactlyOnceWith({ type: 'tour' }),
      );
      expect(transport).toHaveBeenCalledTimes(1);
      expect(session.getSnapshot().candidate).toBeNull();
    } finally {
      session.dispose();
    }
  });
  it.each(['fake', 'live'] as const)(
    'offers useful app-owned branches in %s without a provider call or room mutation',
    async (mode) => {
      const s = await setup(mode),
        before = s.session.getSnapshot().workspace;
      try {
        s.assistant.draft('Keep my unfinished thought');
        s.assistant.chooseGuidance(0, 'get-started');
        const themes = s.assistant.getSnapshot().messages.at(-1)!;
        expect(themes.guidance?.step).toBe('themes');
        s.assistant.chooseGuidance(0, 'services');
        s.assistant.chooseGuidance(themes.id, 'unknown');
        expect(s.assistant.getSnapshot().messages.at(-1)).toBe(themes);
        s.assistant.chooseGuidance(themes.id, 'more-themes');
        expect(s.assistant.getSnapshot().messages.at(-1)?.guidance?.step).toBe(
          'themes-2',
        );
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
  it('offers distinct welcome roles and a complete optional path with at most three choices', async () => {
    const s = await setup(),
      room = s.session.getSnapshot().workspace!.current;
    try {
      const welcome = guidanceChoices('welcome', room, false);
      expect(welcome.map((choice) => choice.id)).toEqual([
        'tour',
        'get-started',
        'services',
      ]);
      expect(new Set(welcome.map((choice) => choice.icon)).size).toBe(3);
      s.assistant.chooseGuidance(0, 'get-started');
      for (const id of [
        'more-themes',
        'more-themes',
        'keep-plain',
        'keep-furniture',
        'continue-layout',
        'keep-layout',
      ]) {
        const last = s.assistant.getSnapshot().messages.at(-1)!;
        s.assistant.chooseGuidance(last.id, id);
      }
      expect(s.assistant.getSnapshot().messages.at(-1)?.guidance?.step).toBe(
        'done',
      );
      for (const step of [
        'welcome',
        'themes',
        'themes-2',
        'themes-3',
        'services',
        'furniture',
        'openings',
        'layout',
        'done',
      ] as const)
        expect(guidanceChoices(step, room, false).length).toBeLessThanOrEqual(
          3,
        );
      expect(s.transport).toHaveBeenCalledTimes(1);
      expect(s.session.getSnapshot().workspace!.current).toBe(room);
    } finally {
      s.close();
    }
  });
  it('previews a theme, advances only after Apply, and restores the guide and room with Undo', async () => {
    const s = await setup(),
      before = s.session.getSnapshot().workspace!.current;
    try {
      s.assistant.chooseGuidance(0, 'get-started');
      s.assistant.chooseGuidance(
        s.assistant.getSnapshot().messages.at(-1)!.id,
        'theme-japandi',
      );
      await Promise.resolve();
      expect(s.session.getSnapshot().candidate).not.toBeNull();
      expect(s.session.getSnapshot().workspace!.current).toBe(before);
      expect(s.assistant.getSnapshot().messages.at(-1)?.guidance).toBeNull();
      expect(s.assistant.apply().ok).toBe(true);
      expect(s.assistant.getSnapshot().messages.at(-1)?.guidance?.step).toBe(
        'furniture',
      );
      expect(s.assistant.getSnapshot().themeId).toBe('japandi');
      expect(s.assistant.undo().ok).toBe(true);
      expect(s.assistant.getSnapshot().messages.at(-1)?.guidance?.step).toBe(
        'themes',
      );
      expect(s.assistant.getSnapshot().themeId).toBeNull();
      expect(s.session.getSnapshot().workspace!.current.furniture).toEqual(
        before.furniture,
      );
      const last = s.assistant.getSnapshot().messages.at(-1)!;
      s.assistant.chooseGuidance(last.id, 'theme-modern');
      await Promise.resolve();
      expect(s.assistant.cancel()).toBe(true);
      expect(s.assistant.getSnapshot().messages.at(-1)?.guidance?.step).toBe(
        'themes',
      );
      expect(s.session.getSnapshot().workspace!.current.furniture).toEqual(
        before.furniture,
      );
      expect(s.transport).toHaveBeenCalledTimes(1);
    } finally {
      s.close();
    }
  });
  it('introduces capabilities from typed chat and suppresses a completed tour once', async () => {
    const s = await setup();
    try {
      await s.assistant.submit('What can you do for me?');
      expect(s.assistant.getSnapshot().messages.at(-1)?.guidance?.step).toBe(
        'services',
      );
      await s.assistant.submit('Let’s get started');
      expect(s.assistant.getSnapshot().messages.at(-1)?.guidance?.step).toBe(
        'themes',
      );
      s.assistant.completeTour();
      const last = s.assistant.getSnapshot().messages.at(-1)!;
      expect(
        guidanceChoices(
          'welcome',
          s.session.getSnapshot().workspace!.current,
          true,
        ),
      ).toHaveLength(2);
      s.assistant.completeTour();
      expect(s.assistant.getSnapshot().messages.at(-1)).toBe(last);
      expect(s.transport).toHaveBeenCalledTimes(1);
    } finally {
      s.close();
    }
  });
  it('rejects stale revision, Before and retired guidance choices', async () => {
    const s = await setup();
    s.assistant.chooseGuidance(0, 'get-started');
    const message = s.assistant.getSnapshot().messages.at(-1)!;
    s.session.setComparison('before');
    s.assistant.chooseGuidance(message.id, 'theme-japandi');
    expect(s.assistant.getSnapshot().messages.at(-1)).toBe(message);
    s.session.setComparison('current');
    expect(
      s.session.prepareVisitorPreview(
        [{ type: 'room-finish', floorFinish: 'walnut', wallFinish: 'ivory' }],
        'Manual palette',
      ).ok,
    ).toBe(true);
    expect(s.session.applyVisitorPreview().ok).toBe(true);
    s.assistant.chooseGuidance(message.id, 'theme-japandi');
    expect(s.assistant.getSnapshot().messages.at(-1)).toBe(message);
    const current = s.session.getSnapshot().workspace!.current;
    s.assistant.chooseGuidance(message.id, 'resume-guidance');
    expect(s.assistant.getSnapshot().messages.at(-1)?.guidance).toEqual({
      step: 'themes',
      roomRevision: current.roomRevision,
    });
    expect(s.session.getSnapshot().workspace!.current).toBe(current);
    expect(s.session.getSnapshot().candidate).toBeNull();
    s.close();
    s.assistant.chooseGuidance(0, 'get-started');
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
