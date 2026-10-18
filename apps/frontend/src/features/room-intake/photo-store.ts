import { POLICY } from '@roomedy/contracts/policy';
import { photoManifestSchema } from '@roomedy/contracts/intake';
import { imageErrorMessage, preparePhoto } from './images';
import type { PreparedPhoto } from './images';

export type PhotoPurpose = 'room' | 'furniture';
export interface PhotoItem {
  readonly id: string;
  readonly purpose: PhotoPurpose;
  readonly status: 'queued' | 'processing' | 'ready' | 'failed';
  readonly previewUrl: string | null;
  readonly message: string;
  readonly rawBytes: number;
  readonly type: string | null;
  readonly width: number | null;
  readonly height: number | null;
  readonly normalizedBytes: number;
  readonly decodeMs: number;
  readonly prepareMs: number;
}
type RecordPhoto = {
  item: PhotoItem;
  file: Blob | null;
  prepared: PreparedPhoto | null;
};
interface PhotoDependencies {
  prepare?: typeof preparePhoto;
  createUrl?: (blob: Blob) => string;
  revokeUrl?: (url: string) => void;
  id?: () => string;
}
/** At most six selected records and one retired native job; no growing promise/queue history. */
export class PhotoStore {
  private live = true;
  private records = new Map<string, RecordPhoto>();
  private snapshot: readonly PhotoItem[] = [];
  private activeJob: {
    id: string;
    abort: AbortController;
    rawBytes: number;
  } | null = null;
  private readonly prepare: typeof preparePhoto;
  private readonly createUrl: (blob: Blob) => string;
  private readonly revokeUrl: (url: string) => void;
  private readonly id: () => string;
  constructor(
    private valid: () => boolean,
    private changed: (photos: readonly PhotoItem[]) => void,
    dependencies: PhotoDependencies = {},
  ) {
    this.prepare = dependencies.prepare ?? preparePhoto;
    this.createUrl =
      dependencies.createUrl ?? ((blob) => URL.createObjectURL(blob));
    this.revokeUrl =
      dependencies.revokeUrl ?? ((url) => URL.revokeObjectURL(url));
    this.id = dependencies.id ?? (() => crypto.randomUUID());
  }
  getSnapshot = () => this.snapshot;
  private publish() {
    if (!this.live) return;
    this.snapshot = Object.freeze(
      [...this.records.values()].map((r) => r.item),
    );
    this.changed(this.snapshot);
  }
  add(files: readonly Blob[], purpose: PhotoPurpose): string | null {
    if (!this.live || !this.valid()) return 'This room session has ended.';
    if (files.length === 0) return null;
    if (files.length + this.records.size > POLICY.photos)
      return 'Keep up to six photos. Remove one before adding more.';
    if (files.some((f) => f.size === 0 || f.size > POLICY.rawPhotoBytes))
      return 'Each photo must be between 1 byte and 8 MiB.';
    const retained =
      [...this.records.values()].reduce((n, r) => n + r.item.rawBytes, 0) +
      (this.activeJob && !this.records.has(this.activeJob.id)
        ? this.activeJob.rawBytes
        : 0);
    if (retained + files.reduce((n, f) => n + f.size, 0) > POLICY.rawTotalBytes)
      return 'Keep the selected photos within 24 MiB. A removed photo may still be finishing its local decode.';
    const ids = files.map(() => this.id());
    if (
      new Set(ids).size !== ids.length ||
      ids.some((id) => this.records.has(id))
    )
      return 'Could not add these photos. Try again.';
    for (const [index, file] of files.entries()) {
      const id = ids[index]!;
      this.records.set(id, {
        file,
        prepared: null,
        item: Object.freeze({
          id,
          purpose,
          status: 'queued',
          previewUrl: null,
          message: '',
          rawBytes: file.size,
          type: null,
          width: null,
          height: null,
          normalizedBytes: 0,
          decodeMs: 0,
          prepareMs: 0,
        }),
      });
    }
    this.publish();
    void this.pump();
    return null;
  }
  remove(id: string) {
    const record = this.records.get(id);
    if (!record || !this.live || !this.valid()) return;
    this.records.delete(id);
    if (this.activeJob?.id === id) this.activeJob.abort.abort();
    if (record.item.previewUrl) this.revokeUrl(record.item.previewUrl);
    record.file = null;
    record.prepared = null;
    this.publish();
  }
  purpose(id: string, purpose: PhotoPurpose) {
    const record = this.records.get(id);
    if (!this.live || !record || !this.valid()) return;
    record.item = Object.freeze({ ...record.item, purpose });
    this.publish();
  }
  reorder(id: string, direction: -1 | 1) {
    if (!this.live || !this.valid()) return;
    const records = [...this.records.entries()],
      index = records.findIndex(([key]) => key === id),
      target = index + direction;
    if (index < 0 || target < 0 || target >= records.length) return;
    [records[index], records[target]] = [records[target]!, records[index]!];
    this.records = new Map(records);
    this.publish();
  }
  private current(
    job: NonNullable<PhotoStore['activeJob']>,
    record: RecordPhoto,
  ) {
    return (
      this.live &&
      this.activeJob === job &&
      !job.abort.signal.aborted &&
      this.records.get(job.id) === record &&
      this.valid()
    );
  }
  private async pump() {
    if (this.activeJob || !this.live || !this.valid()) return;
    const next = [...this.records.values()].find(
      (r) => r.item.status === 'queued' && r.file,
    );
    if (!next) return;
    const file = next.file!,
      job = {
        id: next.item.id,
        abort: new AbortController(),
        rawBytes: file.size,
      };
    this.activeJob = job;
    next.item = Object.freeze({ ...next.item, status: 'processing' });
    this.publish();
    const timer = setTimeout(() => {
      if (this.current(job, next)) {
        job.abort.abort();
        next.item = Object.freeze({
          ...next.item,
          status: 'failed',
          message: 'This photo took too long to open. Try a smaller image.',
        });
        this.publish();
      }
    }, POLICY.imageDecodeMs);
    try {
      const prepared = await this.prepare(file, job.abort.signal);
      if (!this.current(job, next)) return;
      const bytes =
        [...this.records.values()].reduce(
          (n, r) => n + (r.prepared?.normalized.size ?? 0),
          0,
        ) + prepared.normalized.size;
      if (bytes > POLICY.normalizedTotalBytes) {
        next.item = Object.freeze({
          ...next.item,
          status: 'failed',
          message:
            'The prepared photos are too large together. Remove a photo or choose smaller images.',
        });
        return;
      }
      const previewUrl = this.createUrl(prepared.preview);
      if (!this.current(job, next)) {
        this.revokeUrl(previewUrl);
        return;
      }
      next.prepared = prepared;
      next.item = Object.freeze({
        ...next.item,
        status: 'ready',
        previewUrl,
        type: prepared.type,
        width: prepared.inputWidth,
        height: prepared.inputHeight,
        normalizedBytes: prepared.normalized.size,
        decodeMs: prepared.decodeMs,
        prepareMs: prepared.prepareMs,
        message: '',
      });
    } catch (error) {
      if (this.current(job, next))
        next.item = Object.freeze({
          ...next.item,
          status: 'failed',
          message: imageErrorMessage(error),
        });
    } finally {
      clearTimeout(timer);
      next.file = null;
      if (this.activeJob === job) this.activeJob = null;
      if (this.live) {
        this.publish();
        void this.pump();
      }
    }
  }
  /** Future recognition takes only this allow-listed normalized manifest/body projection. */
  preparedRequest() {
    if (!this.live || !this.valid() || !this.records.size) return null;
    const records = [...this.records.values()];
    if (records.some((r) => r.item.status !== 'ready' || !r.prepared))
      return null;
    const manifest = photoManifestSchema.safeParse(
      records.map((r) => ({
        id: r.item.id,
        purpose: r.item.purpose,
        type: 'image/jpeg',
        width: r.prepared!.width,
        height: r.prepared!.height,
        bytes: r.prepared!.normalized.size,
      })),
    );
    return manifest.success
      ? {
          manifest: manifest.data,
          images: records.map((r) => r.prepared!.normalized),
        }
      : null;
  }
  dispose() {
    if (!this.live) return;
    this.live = false;
    this.activeJob?.abort.abort();
    for (const record of this.records.values()) {
      if (record.item.previewUrl) this.revokeUrl(record.item.previewUrl);
      record.file = null;
      record.prepared = null;
    }
    this.records.clear();
    this.snapshot = [];
  }
}
