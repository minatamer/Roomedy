import type {
  OperationInput,
  OperationResult,
} from '@roomedy/contracts/operations';
import { roomFixture } from './room.js';
import { VERSIONS } from '@roomedy/contracts/policy';
import { readFile } from 'node:fs/promises';
import { decodeInput } from '@roomedy/contracts/intake';
export const operationVersions = {
  schemaVersion: VERSIONS.schema,
  catalogueVersion: VERSIONS.catalogue,
  rulesVersion: VERSIONS.rules,
};
export const operationInput = (): Extract<
  OperationInput,
  { kind: 'assistant' }
> => {
  const document = roomFixture();
  return {
    ...operationVersions,
    kind: 'assistant',
    identity: {
      workspaceId: 'workspace',
      generation: 0,
      operationId: 'operation',
      roomId: document.roomId,
      inputRevision: document.roomRevision,
    },
    room: document,
    selectedId: null,
    localCandidate: null,
    text: 'Make room for work.',
    context: [],
  };
};
export async function recognitionInput(): Promise<
  Extract<OperationInput, { kind: 'recognize-room' }>
> {
  const bytes = decodeInput(
    await readFile(new URL('./intake/orientation.jpg', import.meta.url)),
  ).bytes;
  return {
    ...operationVersions,
    kind: 'recognize-room',
    condition: 'partial',
    identity: operationInput().identity,
    manifest: [
      {
        id: 'photo',
        purpose: 'room',
        type: 'image/jpeg',
        width: 640,
        height: 480,
        bytes: bytes.length,
      },
    ],
    images: [{ id: 'photo', data: Buffer.from(bytes).toString('base64') }],
  };
}
export const operationResult = (
  input: OperationInput,
  kind: OperationResult['kind'] = 'completed',
): OperationResult => ({
  identity: input.identity,
  kind,
  simulation: true,
  message: 'Controlled fixture result.',
  draft: null,
});
export const identityIds = (prefix = 'opaque') => {
  let id = 0;
  return () => `${prefix}_${++id}`;
};
