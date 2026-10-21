import { describe, it, expect, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import { POLICY } from '@roomedy/contracts/policy';
import { BoundedBytes } from '@roomedy/contracts/bounded-bytes';
import { decodeInput } from '@roomedy/contracts/intake';
import {
  Admission,
  inputDigest,
} from '../apps/backend/src/security/admission.js';
import { createRuntime } from '../apps/backend/src/runtime/create-runtime.js';
import { parseRuntimeConfig } from '../apps/backend/src/config/runtime-config.js';
import { createFakeProvider } from '../apps/backend/src/providers/provider.js';
import type { ProviderOutcome } from '../apps/backend/src/providers/provider.js';
import {
  operationInput,
  operationResult,
  identityIds,
  operationVersions,
  recognitionInput,
} from './fixtures/operation.js';

describe('content-bound boot admission', () => {
  it('retains consumed replay protection past TTL while remote work is unresolved', () => {
    let now = 0;
    const admission = new Admission(() => now, identityIds(), 1);
    const grant = admission.issue('assistant', 'digest', 'operation')!;
    expect(admission.consume(grant.grant, 'assistant', 'digest')).toBe(true);
    now = POLICY.grantTtlMs + 1;
    expect(admission.beginAdmission()).toBe(false);
    expect(admission.snapshot().grants).toBe(1);
    admission.retire(grant.grant);
    expect(admission.beginAdmission()).toBe(true);
    expect(admission.snapshot().grants).toBe(0);
  });
  it('binds actual normalized bytes and strict semantic context, not just revision/manifest', async () => {
    const bytes = decodeInput(
      await readFile(
        new URL('./fixtures/intake/orientation.jpg', import.meta.url),
      ),
    ).bytes;
    const input = {
      ...operationVersions,
      kind: 'recognize-room' as const,
      condition: 'partial' as const,
      identity: operationInput().identity,
      manifest: [
        {
          id: 'photo',
          purpose: 'room' as const,
          type: 'image/jpeg' as const,
          width: 640,
          height: 480,
          bytes: bytes.length,
        },
      ],
      images: [{ id: 'photo', data: Buffer.from(bytes).toString('base64') }],
    };
    const digest = inputDigest(input);
    expect(digest).toMatch(/^[a-f0-9]{64}$/);
    const altered = structuredClone(input),
      changed = bytes.slice();
    changed[changed.length - 10]! ^= 1;
    altered.images[0]!.data = Buffer.from(changed).toString('base64');
    expect(inputDigest(altered)).not.toBe(digest);
    altered.manifest[0]!.width++;
    expect(inputDigest(altered)).toBeNull();
    const semantic = operationInput(),
      before = inputDigest(semantic);
    semantic.text = 'Another request.';
    expect(inputDigest(semantic)).not.toBe(before);
    semantic.identity.inputRevision++;
    expect(inputDigest(semantic)).toBeNull();
  });
  it('atomically consumes once, refuses wrong operation/digest, restart and second runtime replay', () => {
    let now = 0;
    const one = new Admission(() => now, identityIds('boot_one')),
      two = new Admission(() => now, identityIds('boot_two'));
    expect(one.beginAdmission()).toBe(true);
    const grant = one.issue('assistant', 'digest', 'digest')!;
    expect(one.issue('assistant', 'digest', 'digest')).toEqual(grant);
    expect(one.issue('assistant', 'substituted', 'digest')).toBeNull();
    const secondGrant = two.issue('assistant', 'digest', 'digest')!;
    expect(secondGrant.grant).not.toBe(grant.grant);
    expect(one.consume(grant.grant, 'recognize-room', 'digest')).toBe(false);
    expect(one.consume(grant.grant, 'assistant', 'other')).toBe(false);
    expect(two.consume(grant.grant, 'assistant', 'digest')).toBe(false);
    expect(one.consume(grant.grant, 'assistant', 'digest')).toBe(true);
    expect(one.issue('assistant', 'digest', 'digest')).toBeNull();
    one.retire(grant.grant);
    expect(one.consume(grant.grant, 'assistant', 'digest')).toBe(false);
    const restarted = new Admission(() => now, identityIds('boot_restart'));
    restarted.issue('assistant', 'digest', 'digest');
    expect(restarted.consume(grant.grant, 'assistant', 'digest')).toBe(false);
    const last = one.issue('assistant', 'last', 'last')!;
    now = last.expiresAt;
    expect(one.consume(last.grant, 'assistant', 'last')).toBe(false);
    expect(one.snapshot().grants).toBe(0);
  });
  it('does not evict active replay protection at ledger capacity; slots release exactly once', () => {
    const admission = new Admission(() => 0, identityIds(), 2);
    const a = admission.issue('assistant', 'a', 'a')!,
      b = admission.issue('assistant', 'b', 'b')!;
    expect(admission.issue('assistant', 'c', 'c')).toBeNull();
    expect(admission.beginAdmission()).toBe(false);
    expect(admission.consume(a.grant, 'assistant', 'a')).toBe(true);
    expect(admission.issue('assistant', 'c', 'c')).toBeNull();
    expect(admission.consume(b.grant, 'assistant', 'b')).toBe(true);
    const first = admission.takeIntake()!,
      second = admission.takeIntake()!;
    expect(admission.takeIntake()).toBeNull();
    first();
    first();
    second();
    expect(admission.snapshot().intake).toBe(0);
    admission.close();
    expect(admission.takeWork()).toBeNull();
  });
  it('packs tiny fragments into bounded pages while preserving exact bytes and rejecting overhead', () => {
    const packed = new BoundedBytes(8192, 4096);
    for (let i = 0; i < 4096; i++) packed.append(Uint8Array.of(i % 256));
    expect(packed.retainedPages).toBe(1);
    expect(packed.take()).toEqual(
      Uint8Array.from({ length: 4096 }, (_, i) => i % 256),
    );
    for (let i = 0; i < 4096; i++) packed.append(new Uint8Array());
    expect(() => packed.append(new Uint8Array())).toThrow('body-limit');
    packed.clear();
    expect(packed.retainedPages).toBe(0);
  });
  it('enforces one process-wide rate window across grant identities without evicting replay records', () => {
    let now = 0;
    const admission = new Admission(() => now, identityIds());
    for (let i = 0; i < POLICY.admissionsPerWindow; i++) {
      expect(admission.beginAdmission()).toBe(true);
      const grant = admission.issue('assistant', `digest_${i}`, `digest_${i}`)!;
      expect(admission.consume(grant.grant, 'assistant', `digest_${i}`)).toBe(
        i < POLICY.dispatchesPerWindow,
      );
    }
    expect(admission.beginAdmission()).toBe(false);
    expect(admission.snapshot().grants).toBe(POLICY.admissionsPerWindow);
    now = POLICY.rateWindowMs;
    expect(admission.beginAdmission()).toBe(true);
    expect(admission.snapshot().grants).toBe(POLICY.admissionsPerWindow);
  });
});

describe('independent deadlines and shared unresolved work', () => {
  it('keeps challenge interaction/failure explicit and refuses fake verification for live readiness', async () => {
    let verifications = 0;
    const input = operationInput(),
      log = vi.fn();
    const dependencies = {
      now: Date.now,
      nextId: identityIds(),
      log,
      provider: createFakeProvider(),
      handlers: { assistant: async () => operationResult(input) },
    };
    const runtime = createRuntime(
      parseRuntimeConfig({ ROOMEDY_BRIDGE_SECRET: 'synthetic' }),
      {
        ...dependencies,
        challenge: {
          kind: 'fake',
          async verify(proof) {
            verifications++;
            return proof === 'fixture-proof'
              ? 'verified'
              : proof
                ? 'failed'
                : 'interaction';
          },
        },
      },
    );
    expect(
      await runtime.operations.grant(input, null, new AbortController().signal),
    ).toMatchObject({
      kind: 'verification',
      state: 'interaction',
      simulation: true,
    });
    expect(
      await runtime.operations.grant(
        input,
        'wrong',
        new AbortController().signal,
      ),
    ).toMatchObject({ kind: 'verification', state: 'failed' });
    expect(
      await runtime.operations.grant(
        input,
        'fixture-proof',
        new AbortController().signal,
      ),
    ).toMatchObject({ kind: 'granted', simulation: true });
    const aborted = new AbortController();
    aborted.abort();
    expect(
      await runtime.operations.grant(input, 'fixture-proof', aborted.signal),
    ).toMatchObject({ error: { code: 'cancelled' } });
    expect(verifications).toBe(3);
    runtime.operations.close();
    const live = createRuntime(
      parseRuntimeConfig({
        FAKE_MODE: 'false',
        PAID_DEMO_ENABLED: 'true',
        TURNSTILE_SITE_KEY: 'synthetic-site',
        OPENAI_API_KEY: 'synthetic-key',
        ROOMEDY_BRIDGE_SECRET: 'synthetic',
      }),
      {
        ...dependencies,
        provider: { ...createFakeProvider(), kind: 'live' },
        challenge: {
          kind: 'fake',
          async verify() {
            return 'verified';
          },
        },
      },
    );
    expect(live.publicConfig.mode).toBe('live');
    expect(live.publicConfig.capabilities.assistant).toBe(false);
    expect(
      await live.operations.grant(
        input,
        'fixture-proof',
        new AbortController().signal,
      ),
    ).toMatchObject({ error: { code: 'not-available' } });
    expect(live.meteredDispatches()).toBe(0);
    live.operations.close();
  });
  it('bounds ignored challenge promises instead of accumulating timed-out verification work', async () => {
    vi.useFakeTimers();
    const pending: (() => void)[] = [],
      input = operationInput();
    const runtime = createRuntime(
      parseRuntimeConfig({ ROOMEDY_BRIDGE_SECRET: 'synthetic' }),
      {
        now: Date.now,
        nextId: identityIds(),
        log: vi.fn(),
        provider: createFakeProvider(),
        handlers: { assistant: async () => operationResult(input) },
        challenge: {
          kind: 'fake',
          verify: () =>
            new Promise((resolve) => pending.push(() => resolve('verified'))),
        },
      },
    );
    try {
      const one = runtime.operations.grant(
          input,
          null,
          new AbortController().signal,
        ),
        two = runtime.operations.grant(
          input,
          null,
          new AbortController().signal,
        );
      await vi.advanceTimersByTimeAsync(POLICY.intakeMs);
      expect(await one).toMatchObject({
        kind: 'verification',
        state: 'failed',
      });
      expect(await two).toMatchObject({
        kind: 'verification',
        state: 'failed',
      });
      expect(
        await runtime.operations.grant(
          input,
          null,
          new AbortController().signal,
        ),
      ).toMatchObject({ error: { code: 'busy' } });
      expect(pending).toHaveLength(2);
      pending.forEach((done) => done());
      await vi.advanceTimersByTimeAsync(0);
      expect(runtime.operations.admission.snapshot().grants).toBe(0);
    } finally {
      runtime.operations.close();
      vi.useRealTimers();
    }
  });
  it('enforces serial finite rounds and a whole-operation deadline even without browser abort propagation', async () => {
    vi.useFakeTimers();
    const input = operationInput(),
      outcomes: string[] = [];
    let settle: (() => void) | undefined;
    const runtime = createRuntime(
      parseRuntimeConfig({ ROOMEDY_BRIDGE_SECRET: 'synthetic' }),
      {
        now: Date.now,
        nextId: identityIds(),
        log: vi.fn(),
        provider: createFakeProvider(async () => ({
          kind: 'completed',
          data: {},
          calls: [],
        })),
        handlers: {
          assistant: async (current, budget) => {
            const request = {
              instructions: 'fixture',
              input: [],
              format: {
                name: 'fixture',
                schema: {
                  type: 'object',
                  properties: {},
                  additionalProperties: false,
                },
              },
              tools: [],
            };
            for (let i = 0; i < POLICY.providerRounds + 1; i++)
              outcomes.push((await budget.call(request)).kind);
            await new Promise<void>((resolve) => {
              settle = resolve;
            });
            return operationResult(current);
          },
        },
      },
    );
    try {
      const grant = await runtime.operations.grant(
        input,
        null,
        new AbortController().signal,
      );
      if (!('grant' in grant)) throw new Error('fixture');
      const result = runtime.operations.run(
        input,
        grant.grant,
        new AbortController().signal,
      );
      await vi.advanceTimersByTimeAsync(0);
      expect(outcomes).toEqual([
        'completed',
        'completed',
        'completed',
        'completed',
        'malformed',
      ]);
      await vi.advanceTimersByTimeAsync(POLICY.assistantMs);
      expect(await result).toMatchObject({ kind: 'timeout' });
      expect(runtime.operations.admission.snapshot().work).toBe(1);
      settle!();
      await vi.advanceTimersByTimeAsync(0);
      expect(runtime.operations.admission.snapshot().work).toBe(0);
      expect(runtime.operations.calls()).toBe(4);
    } finally {
      runtime.operations.close();
      vi.useRealTimers();
    }
  });
  it('shutdown fences active work and returns once while preserving conservative accounting', async () => {
    vi.useFakeTimers();
    const input = operationInput(),
      log = vi.fn();
    let settle: (() => void) | undefined;
    const runtime = createRuntime(
      parseRuntimeConfig({ ROOMEDY_BRIDGE_SECRET: 'synthetic' }),
      {
        now: Date.now,
        nextId: identityIds(),
        log,
        provider: createFakeProvider(),
        handlers: {
          assistant: async (current) => {
            await new Promise<void>((resolve) => {
              settle = resolve;
            });
            return operationResult(current);
          },
        },
      },
    );
    try {
      const grant = await runtime.operations.grant(
        input,
        null,
        new AbortController().signal,
      );
      if (!('grant' in grant)) throw new Error('fixture');
      const result = runtime.operations.run(
        input,
        grant.grant,
        new AbortController().signal,
      );
      await vi.advanceTimersByTimeAsync(0);
      runtime.operations.close();
      runtime.operations.close();
      expect(await result).toMatchObject({ kind: 'cancelled' });
      expect(runtime.operations.available('assistant')).toBe(false);
      settle!();
      await vi.advanceTimersByTimeAsync(POLICY.assistantMs);
      expect(runtime.operations.admission.snapshot().work).toBe(0);
      expect(
        log.mock.calls.filter(
          ([entry]) => entry.code === 'operation-uncertain',
        ),
      ).toHaveLength(1);
    } finally {
      runtime.operations.close();
      vi.useRealTimers();
    }
  });
  it('holds both shared slots through disconnect/ignored abort and retires once after actual settlement', async () => {
    const recognition = await recognitionInput();
    vi.useFakeTimers();
    const pending: ((outcome: ProviderOutcome) => void)[] = [];
    const provider = createFakeProvider(
      () => new Promise((resolve) => pending.push(resolve)),
    );
    const runtime = createRuntime(
      parseRuntimeConfig({ ROOMEDY_BRIDGE_SECRET: 'synthetic-private' }),
      {
        now: Date.now,
        nextId: identityIds(),
        log: vi.fn(),
        provider,
        handlers: {
          'recognize-room': async (input, budget) => {
            const result = await budget.call({
              instructions: 'fixture',
              input: [],
              format: {
                name: 'fixture',
                schema: {
                  type: 'object',
                  properties: {},
                  additionalProperties: false,
                },
              },
              tools: [],
            });
            return operationResult(input, result.kind);
          },
          assistant: async (input, budget) => {
            const result = await budget.call({
              instructions: 'fixture',
              input: [],
              format: {
                name: 'fixture',
                schema: {
                  type: 'object',
                  properties: {},
                  additionalProperties: false,
                },
              },
              tools: [],
            });
            return operationResult(input, result.kind);
          },
        },
      },
    );
    try {
      const input = operationInput(),
        a = await runtime.operations.grant(
          input,
          null,
          new AbortController().signal,
        ),
        b = await runtime.operations.grant(
          recognition,
          null,
          new AbortController().signal,
        );
      if (!('grant' in a) || !('grant' in b)) throw new Error('fixture-grant');
      const client = new AbortController();
      const one = runtime.operations.run(input, a.grant, client.signal),
        two = runtime.operations.run(
          recognition,
          b.grant,
          new AbortController().signal,
        );
      await vi.advanceTimersByTimeAsync(1);
      client.abort();
      expect(await one).toMatchObject({ kind: 'cancelled' });
      expect(runtime.operations.admission.snapshot().work).toBe(2);
      expect(
        await runtime.operations.run(
          input,
          a.grant,
          new AbortController().signal,
        ),
      ).toMatchObject({ error: { code: 'busy' } });
      await vi.advanceTimersByTimeAsync(POLICY.recognitionMs);
      expect(await two).toMatchObject({ kind: 'timeout' });
      expect(runtime.operations.admission.snapshot().work).toBe(2);
      for (const resolve of pending) resolve({ kind: 'unavailable' });
      await vi.advanceTimersByTimeAsync(0);
      expect(runtime.operations.admission.snapshot().work).toBe(0);
      expect(runtime.operations.calls()).toBe(2);
      runtime.operations.close();
      runtime.operations.close();
      expect(runtime.operations.available('assistant')).toBe(false);
    } finally {
      runtime.operations.close();
      vi.useRealTimers();
    }
  });
});
