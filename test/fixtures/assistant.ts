import type { RoomDocument } from '@roomedy/contracts/room';
import type { OperationInput } from '@roomedy/contracts/operations';
import { LayoutSearch, resolveAssistantTask } from '@roomedy/spatial';
import { operationInput } from './operation.js';
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
      maxNodes: 2000,
    },
    task.scope,
  );
  while (!search.step()) {}
  return search.finish().candidate;
}
