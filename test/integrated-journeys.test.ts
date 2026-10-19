import { it, expect, vi } from 'vitest';
import { operationInputSchema } from '@roomedy/contracts/operations';
import { POLICY } from '@roomedy/contracts/policy';
import { LayoutSearch } from '@roomedy/spatial';
import { loadCorpus, caseInput } from '../scripts/evaluation/corpus.js';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import { ReviewController } from '../apps/frontend/src/features/room-intake/review-controller.js';
import { draftFromPhotos } from '../apps/frontend/src/features/room-intake/recognition-client.js';
import { AssistantController } from '../apps/frontend/src/features/assistant/controller.js';
import {
  exportProject,
  readProject,
  recoveryOf,
  readRecovery,
} from '../apps/frontend/src/features/session/project.js';
import { createRuntime } from '../apps/backend/src/runtime/create-runtime.js';
import { parseRuntimeConfig } from '../apps/backend/src/config/runtime-config.js';
import { createRoomedyFakeProvider } from '../apps/backend/src/providers/fake.js';
import { createRecognitionHandler } from '../apps/backend/src/recognition/recognize.js';
import { createAssistantHandler } from '../apps/backend/src/assistant/assistant.js';
import { identityIds } from './fixtures/operation.js';

it.each(['empty', 'partial', 'furnished'] as const)(
  'integrates %s actual image bytes → corrected 2D review → editor, proposal and lifecycle without replay',
  async (condition) => {
    const { corpus } = await loadCorpus(),
      c = corpus.cases.find((c) => c.condition === condition)!,
      prepared = await caseInput(corpus, c);
    let now = 1000,
      photo = 0;
    const ids = identityIds(condition),
      revoked = vi.fn(),
      log = vi.fn();
    const session = new SessionController(undefined, {
      now: () => now,
      id: ids,
    });
    const runtime = createRuntime(
      parseRuntimeConfig({ ROOMEDY_BRIDGE_SECRET: 'synthetic-integrated' }),
      {
        now: Date.now,
        nextId: ids,
        log,
        provider: createRoomedyFakeProvider(),
        handlers: {
          'recognize-room': createRecognitionHandler(log, ids),
          assistant: createAssistantHandler(log, ids),
        },
      },
    );
    const transport: typeof fetch = async (url, init) => {
      if (String(url).endsWith('/config'))
        return Response.json(runtime.publicConfig);
      const body = JSON.parse(init!.body as string) as {
        input: unknown;
        grant?: string;
      };
      const input = operationInputSchema.parse(body.input);
      return Response.json(
        String(url).endsWith('/admission')
          ? await runtime.operations.grant(
              input,
              null,
              new AbortController().signal,
            )
          : await runtime.operations.run(
              input,
              body.grant!,
              new AbortController().signal,
            ),
      );
    };
    const review = new ReviewController(session, condition, ids, {
      id: () => `photo_${++photo}`,
      createUrl: () => `blob:synthetic-${photo}`,
      revokeUrl: revoked,
      // Node has no native browser decoder. This seam returns the actual corpus JPEG
      // already normalized above; native file selection/decoding is checked separately.
      prepare: async (file) => {
        const bytes = new Uint8Array(await file.arrayBuffer()),
          meta = prepared.manifest[0]!;
        return {
          normalized: new Blob([bytes], { type: 'image/jpeg' }),
          preview: new Blob([bytes], { type: 'image/jpeg' }),
          type: 'image/jpeg',
          inputWidth: meta.width,
          inputHeight: meta.height,
          width: meta.width,
          height: meta.height,
          decodeMs: 0,
          prepareMs: 0,
        };
      },
    });
    let assistant: AssistantController | undefined;
    const other: SessionController[] = [];
    try {
      review.addPhotos(
        prepared.images.map(
          (i) =>
            new File([Buffer.from(i.data, 'base64')], 'authored.jpg', {
              type: 'image/jpeg',
            }),
        ),
        'room',
      );
      await vi.waitFor(() =>
        expect(
          review.photos.getSnapshot().every((p) => p.status === 'ready'),
        ).toBe(true),
      );
      expect(runtime.operations.calls()).toBe(0);
      await draftFromPhotos(review, transport);
      expect(runtime.operations.calls()).toBe(1);
      expect(review.getSnapshot().stage).toBe('review');
      expect(session.getSnapshot().workspace).toBeNull();
      expect(review.getSnapshot().draft.room.furniture).toHaveLength(
        condition === 'empty' ? 0 : condition === 'furnished' ? 2 : 1,
      );
      let repairActions = 0;
      review.shape('rectangle');
      repairActions++;
      const roomId = review.getSnapshot().draft.room.roomId;
      expect(
        review.command([
          {
            type: 'correct-dimensions',
            id: roomId,
            width: 4200,
            depth: 4800,
            height: 2600,
          },
        ]),
      ).toBeNull();
      repairActions++;
      for (const feature of ['door', 'window'] as const) {
        review.addFeature(feature);
        repairActions++;
      }
      if (condition === 'furnished')
        for (const category of [
          'procedural-desk',
          'procedural-chair',
          'wardrobe-hinged',
        ]) {
          review.addPiece(category);
          repairActions++;
        }
      expect(repairActions).toBe(condition === 'furnished' ? 7 : 4);
      expect(review.accept()).toBe(true);
      expect(session.getSnapshot().phase).toBe('editor');
      expect(session.getSnapshot().workspace!.current.furniture).toHaveLength(
        condition === 'empty' ? 0 : condition === 'partial' ? 1 : 5,
      );
      expect(revoked).toHaveBeenCalled();
      session.setRoomView('cutaway');
      expect(session.getSnapshot().presentation.roomView).toBe('cutaway');
      assistant = new AssistantController(session, {
        transport,
        search: async (token, goal, scope) => {
          const search = new LayoutSearch(
            {
              identity: token,
              room: session.getSnapshot().workspace!.current,
              goal,
              seed: 42,
              maxNodes: 2000,
            },
            scope,
          );
          while (!search.step()) {}
          return search.finish();
        },
      });
      await vi.waitFor(() =>
        expect(assistant!.getSnapshot().mode).toBe('fake'),
      );
      const original = structuredClone(
        session.getSnapshot().workspace!.current,
      );
      await assistant.submit('Preview Calm & focused room palette');
      expect(session.getSnapshot().candidate).not.toBeNull();
      assistant.cancel();
      expect(session.getSnapshot().workspace!.current).toEqual(original);
      await assistant.submit('Preview Calm & focused room palette');
      expect(assistant.apply().ok).toBe(true);
      expect(assistant.apply()).toMatchObject({
        ok: true,
        status: 'already-applied',
      });
      const calls = runtime.operations.calls();
      expect(calls).toBe(5);
      expect(session.setComparison('before')).toBe(true);
      expect(session.canEdit()).toBe(false);
      expect(session.setComparison('current')).toBe(true);
      expect(assistant.undo().ok).toBe(true);
      expect({
        ...session.getSnapshot().workspace!.current,
        roomRevision: 0,
      }).toEqual({ ...original, roomRevision: 0 });
      const encoded = exportProject(session.getSnapshot())!,
        parsed = readProject(encoded);
      expect(parsed.ok).toBe(true);
      if (!parsed.ok) throw new Error('invalid-test-project');
      expect(encoded).not.toMatch(
        /blob:|data:image|manifest|filename|candidate|messages|grants|history|receipts/,
      );
      for (const image of prepared.images)
        expect(encoded).not.toContain(image.data);
      const inspectSources = (value: unknown, key = '') => {
        if (typeof value === 'string' && value.startsWith('photo_')) {
          expect(key).toBe('sourceId');
          expect([
            'photo_1',
            'photo_2',
            'photo_3',
            'photo_4',
            'photo_5',
            'photo_6',
          ]).toContain(value);
        } else if (Array.isArray(value))
          value.forEach((item) => inspectSources(item));
        else if (value && typeof value === 'object')
          Object.entries(value).forEach(([name, field]) =>
            inspectSources(field, name),
          );
      };
      inspectSources(parsed.value);
      const recovered = new SessionController(undefined, {
        now: () => now,
        id: identityIds('refresh'),
      });
      other.push(recovered);
      const recovery = readRecovery(
        JSON.stringify(recoveryOf(session.getSnapshot())),
        now,
      );
      expect(recovery.ok).toBe(true);
      if (!recovery.ok) throw new Error('invalid-test-recovery');
      expect(recovered.restore(recovery.value)).toBe(true);
      expect(recovered.getSnapshot().workspace!.history.entries).toHaveLength(
        0,
      );
      expect(recovered.getSnapshot().expiresAt).toBe(
        session.getSnapshot().expiresAt,
      );
      const late = session.beginOperation()!;
      expect(session.reset()).toBe(true);
      expect(session.isCurrent(late)).toBe(false);
      expect(session.importProject(parsed.value)).toBe(true);
      now += POLICY.guestLifetimeMs;
      expect(session.checkExpiry()).toBe(false);
      expect(session.getSnapshot().phase).toBe('expired');
      expect(session.getSnapshot().workspace).toBeNull();
      expect(runtime.operations.calls()).toBe(calls);
      expect(runtime.meteredDispatches()).toBe(0);
    } finally {
      assistant?.dispose();
      session.dispose();
      other.forEach((s) => s.dispose());
      await new Promise<void>((resolve) => setImmediate(resolve));
      runtime.operations.close();
    }
  },
  15_000,
);
