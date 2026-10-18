import type { Request } from 'express';
import { BoundedBytes } from '@roomedy/contracts/bounded-bytes';
import { POLICY } from '@roomedy/contracts/policy';

export class BodyError extends Error {
  constructor(
    readonly code: 'invalid-input' | 'body-limit' | 'timeout' | 'cancelled',
  ) {
    super(code);
  }
}
/** Paused request data events own one packed accumulator; no array of retained wire fragments. */
export function readBody(
  request: Request,
  signal: AbortSignal,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const packed = new BoundedBytes(
      POLICY.preparedProviderRequestBytes,
      POLICY.requestFragments,
    );
    let done = false;
    const finish = (error?: BodyError, value?: unknown) => {
      if (done) return;
      done = true;
      request.pause();
      request.off('data', data);
      request.off('end', end);
      request.off('aborted', aborted);
      request.off('error', failed);
      signal.removeEventListener('abort', aborted);
      clearTimeout(timer);
      packed.clear();
      if (error) reject(error);
      else resolve(value);
    };
    const data = (chunk: Buffer) => {
      try {
        packed.append(chunk);
      } catch {
        finish(new BodyError('body-limit'));
      }
    };
    const end = () => {
      try {
        const value: unknown = JSON.parse(
          new TextDecoder('utf-8', { fatal: true }).decode(packed.take()),
        );
        finish(undefined, value);
      } catch {
        finish(new BodyError('invalid-input'));
      }
    };
    const aborted = () => finish(new BodyError('cancelled'));
    const failed = () => finish(new BodyError('invalid-input'));
    const timer = setTimeout(
      () => finish(new BodyError('timeout')),
      POLICY.intakeMs,
    );
    const length = request.headers['content-length'];
    if (
      !/^application\/json(?:\s*;|$)/i.test(
        request.headers['content-type'] ?? '',
      ) ||
      (request.headers['content-encoding'] &&
        request.headers['content-encoding'] !== 'identity')
    ) {
      finish(new BodyError('invalid-input'));
      return;
    }
    if (
      length !== undefined &&
      (!/^\d{1,10}$/.test(length) ||
        Number(length) > POLICY.preparedProviderRequestBytes)
    ) {
      finish(new BodyError('body-limit'));
      return;
    }
    if (signal.aborted) {
      aborted();
      return;
    }
    request.on('data', data);
    request.on('end', end);
    request.on('aborted', aborted);
    request.on('error', failed);
    signal.addEventListener('abort', aborted, { once: true });
  });
}
