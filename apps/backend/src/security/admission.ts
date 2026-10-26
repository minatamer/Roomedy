import { createHash } from 'node:crypto';
import { POLICY } from '@roomedy/contracts/policy';
import type {
  OperationInput,
  OperationKind,
} from '@roomedy/contracts/operations';
import { imageHeader, decodeInput } from '@roomedy/contracts/intake';
import { validateRoom } from '@roomedy/spatial';

/** Strict decoded bytes and semantic projection are hashed by the server, never a client digest. */
export function inputDigest(input: OperationInput): string | null {
  if (input.kind === 'recognize-room') {
    if (input.images.length !== input.manifest.length) return null;
    for (const [index, photo] of input.manifest.entries()) {
      const image = input.images[index]!;
      if (
        image.id !== photo.id ||
        photo.type !== 'image/jpeg' ||
        !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
          image.data,
        )
      )
        return null;
      const bytes = Buffer.from(image.data, 'base64');
      if (
        bytes.length !== photo.bytes ||
        bytes.toString('base64') !== image.data
      )
        return null;
      try {
        const header = imageHeader(bytes);
        decodeInput(bytes); // Bounded complete container/metadata traversal, no native server decode.
        if (
          header.type !== photo.type ||
          header.width !== photo.width ||
          header.height !== photo.height
        )
          return null;
      } catch {
        return null;
      }
    }
  } else if (input.kind === 'assistant') {
    if (
      !validateRoom(input.room) ||
      input.identity.roomId !== input.room.roomId ||
      input.identity.inputRevision !== input.room.roomRevision ||
      Buffer.byteLength(JSON.stringify(input.context)) > POLICY.contextBytes ||
      Buffer.byteLength(JSON.stringify(input.room)) > POLICY.semanticPairBytes
    )
      return null;
  }
  return createHash('sha256').update(JSON.stringify(input)).digest('hex');
}

export interface ChallengePort {
  readonly kind: 'fake' | 'live';
  verify(
    proof: string | null,
    inputDigest: string,
    signal: AbortSignal,
  ): Promise<'verified' | 'interaction' | 'failed'>;
}
/** Content-free, process-local ledger. No active replay record is evicted to admit another. */
export class Admission {
  private ledger = new Map<
    string,
    {
      digest: string;
      kind: OperationKind;
      expiry: number;
      consumed: boolean;
      operation: string;
      active: boolean;
    }
  >();
  private intake = 0;
  private work = 0;
  private admissions = 0;
  private dispatches = 0;
  private windowStart: number;
  private closed = false;
  private epoch: string;
  constructor(
    private now: () => number,
    private id: () => string,
    private capacity: number = POLICY.grantEntries,
  ) {
    this.windowStart = now();
    this.epoch = id();
  }
  private prune() {
    const now = this.now();
    for (const [key, value] of this.ledger)
      if (value.expiry <= now && !value.active) this.ledger.delete(key);
    if (now - this.windowStart >= POLICY.rateWindowMs) {
      this.windowStart = now;
      this.admissions = 0;
      this.dispatches = 0;
    }
  }
  takeIntake() {
    return this.slot('intake', POLICY.intakeSlots);
  }
  takeWork() {
    return this.slot('work', POLICY.expensiveOperations);
  }
  private slot(key: 'intake' | 'work', maximum: number) {
    if (this.closed || this[key] >= maximum) return null;
    this[key]++;
    let released = false;
    return () => {
      if (!released) {
        released = true;
        this[key]--;
      }
    };
  }
  beginAdmission() {
    this.prune();
    if (
      this.closed ||
      this.ledger.size >= this.capacity ||
      this.admissions >= POLICY.admissionsPerWindow
    )
      return false;
    this.admissions++;
    return true;
  }
  issue(kind: OperationKind, digest: string, operation: string) {
    this.prune();
    if (this.closed) return null;
    for (const [grant, entry] of this.ledger) {
      if (entry.operation === operation)
        return !entry.consumed && entry.kind === kind && entry.digest === digest
          ? { grant, expiresAt: entry.expiry }
          : null;
    }
    if (this.closed || this.ledger.size >= this.capacity) return null;
    const grant = `${this.epoch}_${this.id()}`;
    if (
      grant.length > 80 ||
      !/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(grant) ||
      this.ledger.has(grant)
    )
      return null;
    const expiresAt = this.now() + POLICY.grantTtlMs;
    this.ledger.set(grant, {
      kind,
      digest,
      expiry: expiresAt,
      consumed: false,
      operation,
      active: false,
    });
    return { grant, expiresAt };
  }
  consume(grant: string, kind: OperationKind, digest: string) {
    this.prune();
    const record = this.ledger.get(grant);
    if (
      this.closed ||
      !record ||
      record.consumed ||
      record.kind !== kind ||
      record.digest !== digest ||
      this.dispatches >= POLICY.dispatchesPerWindow
    )
      return false;
    // Synchronous check+consume happens before any await/provider work.
    record.consumed = true;
    record.active = true;
    this.dispatches++;
    return true;
  }
  retire(grant: string) {
    const record = this.ledger.get(grant);
    if (record) record.active = false;
  }
  close() {
    this.closed = true;
  }
  snapshot() {
    return {
      intake: this.intake,
      work: this.work,
      grants: this.ledger.size,
      admissions: this.admissions,
      operations: this.dispatches,
    };
  }
}
