import type { RoomDocument } from '@roomedy/contracts/room';
import type { OperationInput } from '@roomedy/contracts/operations';
import { LayoutSearch, resolveAssistantTask } from '@roomedy/spatial';
import { operationInput } from './operation.js';
import type { DesignIntent } from '@roomedy/contracts/assistant';
import { createRoomFixture } from '../../apps/frontend/src/features/session/fixtures/rooms.js';

export const sampleAssistantStories = [
  { kind: 'empty', text: 'I need a bed, desk, chair and wardrobe', count: 4 },
  {
    kind: 'partial',
    text: 'Keep my bed. Add a desk, chair and storage in a warm style',
    count: 5,
  },
  { kind: 'sample', text: 'Improve my workspace', count: 5 },
] as const;
export const sampleAssistantInput = (
  story: (typeof sampleAssistantStories)[number],
) => assistantInput(createRoomFixture(story.kind), story.text);
/** Independently authored Responses wire fixture; no fake-adapter output is used as its truth. */
export function assistantProtocolFixture(
  turn: 'find_arrangements' | 'done' | DesignIntent,
) {
  return {
    status: 'completed',
    output: [
      typeof turn === 'string' && turn === 'find_arrangements'
        ? {
            type: 'function_call',
            name: 'find_arrangements',
            call_id: 'fixture_protocol_1',
            arguments: '{}',
          }
        : {
            type: 'message',
            content: [
              {
                type: 'output_text',
                text: JSON.stringify(turn === 'done' ? { kind: 'done' } : turn),
              },
            ],
          },
    ],
  };
}
export function assistantInput(
  room: RoomDocument,
  text: string,
  selectedId: string | null = null,
): Extract<OperationInput, { kind: 'assistant' }> {
  const input = operationInput();
  return {
    ...input,
    room,
    text,
    selectedId,
    identity: {
      ...input.identity,
      roomId: room.roomId,
      inputRevision: room.roomRevision,
    },
  };
}
export function localAssistantCandidate(
  input: Extract<OperationInput, { kind: 'assistant' }>,
  maxNodes = 2000,
) {
  const task = resolveAssistantTask(
    input.room,
    input.text,
    input.selectedId,
    input.identity.operationId,
    input.context,
  );
  if (!task.goal) return null;
  const search = new LayoutSearch(
    {
      identity: input.identity,
      room: input.room,
      goal: task.goal,
      seed: 42,
      maxNodes,
    },
    task.scope,
  );
  while (!search.step()) {}
  return search.finish().candidate;
}
