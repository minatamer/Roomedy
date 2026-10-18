import { readFile } from 'node:fs/promises';
import type sharpType from '../../apps/backend/node_modules/sharp/lib/index.js';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { decodeInput } from '@roomedy/contracts/intake';
import { VERSIONS } from '@roomedy/contracts/policy';
import type { OperationInput } from '@roomedy/contracts/operations';

export type Counts = Record<string, number>;
export interface CorpusImage {
  id: string;
  file: string;
  scene: string;
  orientation: 1 | 6;
  sha256: string;
  visible: Counts;
}
export interface CorpusCase {
  id: string;
  group: string;
  split: 'development' | 'held-out';
  condition: 'empty' | 'partial' | 'furnished';
  images: string[];
  physical: Counts;
  shape: 'rectangle' | 'unsupported';
  perturbation: string;
}
export interface Corpus {
  version: 1;
  images: CorpusImage[];
  cases: CorpusCase[];
}
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
const id = (v: unknown): v is string =>
  typeof v === 'string' && /^[a-z0-9-]{1,60}$/.test(v);
const counts = (v: unknown): v is Counts =>
  record(v) &&
  Object.entries(v).every(
    ([k, n]) =>
      [
        'procedural-desk',
        'procedural-chair',
        'procedural-bed',
        'wardrobe-hinged',
        'procedural-storage',
        'door',
        'window',
        'obstacle',
      ].includes(k) &&
      Number.isSafeInteger(n) &&
      Number(n) >= 0 &&
      Number(n) <= 40,
  );
export function parseCorpus(raw: unknown): Corpus {
  if (
    !record(raw) ||
    raw.version !== 1 ||
    !Array.isArray(raw.images) ||
    !Array.isArray(raw.cases) ||
    raw.images.length > 24 ||
    raw.cases.length < 1 ||
    raw.cases.length > 24
  )
    throw new Error('evaluation-corpus');
  const images: CorpusImage[] = raw.images.map((v: unknown) => {
    if (
      !record(v) ||
      !id(v.id) ||
      typeof v.file !== 'string' ||
      v.file !== `${v.id}.jpg` ||
      !id(v.scene) ||
      ![1, 6].includes(Number(v.orientation)) ||
      typeof v.sha256 !== 'string' ||
      !/^[a-f0-9]{64}$/.test(v.sha256) ||
      !counts(v.visible)
    )
      throw new Error('evaluation-corpus');
    return {
      id: v.id,
      file: v.file,
      scene: v.scene,
      orientation: v.orientation as 1 | 6,
      sha256: v.sha256,
      visible: v.visible,
    };
  });
  const cases: CorpusCase[] = raw.cases.map((v: unknown) => {
    if (
      !record(v) ||
      !id(v.id) ||
      !id(v.group) ||
      !['development', 'held-out'].includes(String(v.split)) ||
      !['empty', 'partial', 'furnished'].includes(String(v.condition)) ||
      !Array.isArray(v.images) ||
      v.images.length < 1 ||
      v.images.length > 6 ||
      !v.images.every(
        (x: unknown) => id(x) && images.some((i) => i.id === x),
      ) ||
      new Set(v.images).size !== v.images.length ||
      !counts(v.physical) ||
      !['rectangle', 'unsupported'].includes(String(v.shape)) ||
      !id(v.perturbation)
    )
      throw new Error('evaluation-corpus');
    return {
      id: v.id,
      group: v.group,
      split: v.split as CorpusCase['split'],
      condition: v.condition as CorpusCase['condition'],
      images: v.images as string[],
      physical: v.physical,
      shape: v.shape as CorpusCase['shape'],
      perturbation: v.perturbation,
    };
  });
  if (
    new Set(images.map((x) => x.id)).size !== images.length ||
    new Set(cases.map((x) => x.id)).size !== cases.length
  )
    throw new Error('evaluation-corpus');
  const partitions = new Map<string, string>();
  for (const c of cases) {
    if (partitions.has(c.group) && partitions.get(c.group) !== c.split)
      throw new Error('evaluation-leakage');
    partitions.set(c.group, c.split);
  }
  for (const image of images) {
    const splits = new Set(
      cases.filter((c) => c.images.includes(image.id)).map((c) => c.split),
    );
    if (splits.size > 1) throw new Error('evaluation-leakage');
  }
  return { version: 1, images, cases };
}
const root = new URL('../../docs/evaluation/', import.meta.url);
export async function loadCorpus() {
  const bytes = await readFile(new URL('corpus.json', root));
  if (bytes.length > 64 * 1024) throw new Error('evaluation-corpus');
  return {
    corpus: parseCorpus(JSON.parse(bytes.toString('utf8')) as unknown),
    hash: hash(bytes),
  };
}
export const hash = (bytes: Uint8Array | string) =>
  createHash('sha256').update(bytes).digest('hex');
export async function caseInput(
  corpus: Corpus,
  c: CorpusCase,
): Promise<Extract<OperationInput, { kind: 'recognize-room' }>> {
  // Resolve the existing pinned decoder; do not add a second codec dependency.
  const sharp = createRequire(
    new URL('../../apps/backend/package.json', import.meta.url),
  )('sharp') as typeof sharpType;
  const manifest: Extract<
      OperationInput,
      { kind: 'recognize-room' }
    >['manifest'] = [],
    images: Extract<OperationInput, { kind: 'recognize-room' }>['images'] = [];
  for (const ref of c.images) {
    const image = corpus.images.find((i) => i.id === ref)!;
    const bytes = await readFile(new URL(`images/${image.file}`, root));
    if (bytes.length > 2 * 1024 * 1024 || hash(bytes) !== image.sha256)
      throw new Error('evaluation-image-hash');
    decodeInput(bytes);
    const normalized = await sharp(bytes, { limitInputPixels: 16_000_000 })
      .rotate()
      .jpeg({ quality: 82 })
      .toBuffer();
    const decoded = decodeInput(normalized);
    manifest.push({
      id: ref,
      purpose: 'room',
      type: 'image/jpeg',
      width: decoded.header.width,
      height: decoded.header.height,
      bytes: normalized.length,
    });
    images.push({ id: ref, data: normalized.toString('base64') });
  }
  return {
    schemaVersion: VERSIONS.schema,
    catalogueVersion: VERSIONS.catalogue,
    rulesVersion: VERSIONS.rules,
    kind: 'recognize-room',
    condition: c.condition,
    identity: {
      workspaceId: 'evaluation',
      generation: 0,
      operationId: c.id,
      roomId: 'evaluation-room',
      inputRevision: 0,
    },
    manifest,
    images,
  };
}
