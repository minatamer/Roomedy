import { describe, expect, it, vi } from 'vitest';
import { CATALOGUE, resolveMedyRequest } from '@roomedy/spatial';
import { createAssistantHandler } from '../apps/backend/src/assistant/assistant.js';
import { createRoomFixture } from '../apps/frontend/src/features/session/fixtures/rooms.js';
import { assistantInput } from './fixtures/assistant.js';
import type { ProviderRequest } from '../apps/backend/src/providers/provider.js';

describe('current editor capabilities reach Medy', () => {
  it.each([
    ['Would a mirror help this room?', 'advice'],
    ['The furniture needs a quieter visual rhythm', 'interpretation'],
    ['Show me available furniture', 'tools'],
  ])('supplies every catalogue entry for %s', async (text, route) => {
    const room = createRoomFixture('empty'),
      before = structuredClone(room);
    const requests: ProviderRequest[] = [];
    const result = await createAssistantHandler(
      vi.fn(),
      () => 'capability-check',
    )(assistantInput(room, text), {
      signal: new AbortController().signal,
      call: async (request) => {
        requests.push(request);
        if (route === 'tools' && requests.length === 1)
          return {
            kind: 'completed',
            data: null,
            calls: [
              {
                name: 'find_furniture',
                callId: 'catalogue-check',
                arguments: { category: null, maxWidth: null, maxDepth: null },
              },
            ],
          };
        return {
          kind: 'completed',
          calls: [],
          data:
            route === 'interpretation'
              ? {
                  goal: 'manual-control',
                  targetIds: [],
                  categories: [],
                  finish: null,
                  palette: null,
                  manualRequest: 'Show night mode',
                }
              : {
                  kind: 'done',
                  message:
                    'A wall-hung mirror can reflect the room from a useful angle.',
                  quickReplies: [
                    {
                      label: 'Add a wall mirror',
                      request: 'Add a wall-hung mirror',
                    },
                    {
                      label: 'Try a ceiling light',
                      request: 'Add a ceiling pendant light',
                    },
                  ],
                },
        };
      },
    });
    expect(requests).toHaveLength(route === 'tools' ? 2 : 1);
    const message = (
      requests[0]!.input as { content: { text: string }[] }[]
    )[0]!;
    const context = JSON.parse(message.content[0]!.text);
    const supplied = context.furnitureOptions ?? context.catalogue;
    expect(supplied.map((entry: { id: string }) => entry.id)).toEqual(
      CATALOGUE.map((entry) => entry.id),
    );
    for (const entry of CATALOGUE) {
      expect(
        supplied.find((e: { id: string }) => e.id === entry.id),
      ).toMatchObject({
        label: entry.label,
        placement: entry.placement ?? 'floor',
        defaultElevationMm: entry.defaultElevationMm ?? 0,
      });
    }
    expect(context.mirrors.reflection).toContain('One visible front-facing');
    expect(context.lighting.examples).toContain('Add a ceiling pendant light');
    expect(requests[0]!.instructions).not.toContain(
      'electrical or lighting simulation controls',
    );
    expect(result.kind).toBe('completed');
    if (route === 'tools')
      expect(result.assistant?.catalogueIds).toEqual(
        CATALOGUE.slice(0, 8).map((entry) => entry.id),
      );
    if (route === 'tools') {
      const toolOutput = requests[1]!.input as {
        type?: string;
        output?: string;
      }[];
      const output = JSON.parse(
        toolOutput.find((item) => item.type === 'function_call_output')!
          .output!,
      );
      expect(output.items.map((entry: { id: string }) => entry.id)).toEqual(
        CATALOGUE.map((entry) => entry.id),
      );
    }
    if (route === 'advice') {
      expect(
        result.assistant?.suggestions?.some(
          (r) => r.request === 'Add a wall-hung mirror',
        ),
      ).toBe(true);
    }
    if (route === 'interpretation') {
      expect(result.assistant?.suggestions).toMatchObject([
        { request: 'Show night mode' },
      ]);
    }
    expect(room).toEqual(before);
    // Suggested messages still pass through the application's current parser rather than granting provider authority.
    expect(
      resolveMedyRequest(room, 'Add a wall-hung mirror', null)?.kind,
    ).not.toBe('unsupported');
  });
});
