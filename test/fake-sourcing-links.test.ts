import { describe, expect, it } from 'vitest';
import { sampleEstimateOffers } from '@roomedy/spatial';
import { sourcingInputSchema } from '@roomedy/contracts/operations';
import { VERSIONS } from '@roomedy/contracts/policy';
import { sourcingReplySchema } from '@roomedy/contracts/sourcing';
import { createManualRoom } from '../apps/frontend/src/features/session/entry/manual-room.js';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import { buildSourcingBrief } from '../apps/frontend/src/features/cost/brief.js';
import { selectOffer } from '../apps/frontend/src/features/cost/attach-offer.js';
import { sourcingFakeResponse } from '../apps/backend/src/sourcing/fake.js';
import {
  normalizeSourcing,
  sourcingRequest,
} from '../apps/backend/src/sourcing/sourcing.js';

const categories = sampleEstimateOffers()
  .filter((offer) => offer.kind === 'furniture')
  .map((offer) => offer.category);
const room = createManualRoom('partial');
function input(category = 'bed') {
  const base = buildSourcingBrief(room, room.furniture[0]!.id)!;
  return sourcingInputSchema.parse({
    schemaVersion: VERSIONS.schema,
    catalogueVersion: VERSIONS.catalogue,
    rulesVersion: VERSIONS.rules,
    kind: 'sourcing',
    identity: {
      workspaceId: 'workspace',
      generation: 0,
      operationId: 'fake_options',
      roomId: room.roomId,
      inputRevision: room.roomRevision,
    },
    costRevision: 0,
    locality: { country: 'US', city: 'United States', currency: 'USD' },
    brief: { ...base, category, label: `Example ${category}` },
  });
}
describe('unpaid IKEA example options', () => {
  it.each(categories)(
    'provides a real IKEA destination for %s while keeping amounts explicitly authored',
    async (category) => {
      const request = input(category);
      const response = await sourcingFakeResponse(
        sourcingRequest(request),
        new AbortController().signal,
      );
      if (response.kind !== 'completed') throw new Error(response.kind);
      const result = sourcingReplySchema.parse(response.data);
      const first = result.candidates[0]!;
      expect(new URL(first.url).hostname).toBe('www.ikea.com');
      expect(new URL(first.url).pathname).toMatch(
        /^\/us\/en\/(?:p\/|search\/)/,
      );
      expect(first.url).not.toContain('example.com');
      expect(first.offer?.source.kind).toBe('sample');
      expect(first.evidence).toContain('Authored example');
      expect(result.notes.join(' ')).toContain('No merchant page');
      expect(response.calls).toEqual([]);
      if (category === 'tv') expect(first.url).toContain('/search/');
      else expect(first.url).toContain('/p/');
    },
  );
  it('retains the guide after lookup, then uses only the explicitly selected fake price and supports Undo', async () => {
    const controller = new SessionController(room);
    try {
      controller.setDestination('cost', 'en-US');
      const draft = controller.getSnapshot().cost!;
      const request = input();
      const response = await sourcingFakeResponse(
        sourcingRequest(request),
        new AbortController().signal,
      );
      if (response.kind !== 'completed') throw new Error(response.kind);
      let nextId = 0;
      const result = normalizeSourcing(
        request,
        sourcingReplySchema.parse(response.data),
        undefined,
        true,
        123,
        () => `example_${++nextId}`,
      );
      expect(result).not.toBeNull();
      expect(controller.costBreakdown()).toBe(true);
      expect(controller.getSnapshot().cost!.messages.at(-1)!.kind).toBe(
        'find-options',
      );
      const option = result!.candidates.find((candidate) => candidate.offer)!;
      expect(option.offer!.source).toMatchObject({
        kind: 'sample',
        url: option.url,
        observedAt: null,
      });
      expect(
        selectOffer(
          controller,
          request.brief,
          option,
          draft.revision,
          room.roomRevision,
        ).ok,
      ).toBe(true);
      expect(controller.costBreakdown()).toBe(true);
      expect(controller.getSnapshot().cost!.messages.at(-1)!.kind).toBe(
        'breakdown',
      );
      expect(controller.getSnapshot().cost!.messages.at(-1)!.text).toContain(
        'known subtotal',
      );
      expect(controller.undo().ok).toBe(true);
      expect(controller.costBreakdown()).toBe(true);
      expect(controller.getSnapshot().cost!.messages.at(-1)!.kind).toBe(
        'find-options',
      );
      expect(controller.getSnapshot().estimateVersions).toHaveLength(0);
    } finally {
      controller.dispose();
    }
  });
});
