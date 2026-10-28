import { afterEach, describe, expect, it } from 'vitest';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import { createRoomFixture } from '../apps/frontend/src/features/session/fixtures/rooms.js';
import {
  captureVersion,
  versionChanges,
} from '../apps/frontend/src/features/cost/versions.js';
import { pricingState } from '../apps/frontend/src/features/cost/state.js';
import {
  exportProject,
  readProject,
  readRecovery,
  recoveryOf,
  validateProject,
} from '../apps/frontend/src/features/session/project.js';
import { calculateRoomEstimate, convertOfferToUsd } from '@roomedy/spatial';
import { POLICY } from '@roomedy/contracts/policy';
const controllers: SessionController[] = [];
function session(now = () => 1000) {
  const c = new SessionController(createRoomFixture('sample'), { now });
  controllers.push(c);
  c.setDestination('cost');
  return c;
}
afterEach(() => {
  controllers.splice(0).forEach((c) => c.dispose());
});
describe('detached reviewed planning versions', () => {
  it('freezes dated USD conversion inputs across project import, recovery and later pricing edits', () => {
    const c = session(),
      draft = c.getSnapshot().cost!,
      offers = structuredClone(draft.offers);
    const floor = offers.find((o) => o.id === draft.settings.floor.offerId)!;
    const converted = convertOfferToUsd(
      {
        ...floor,
        market: { ...floor.market, currency: 'EGP' },
        source: {
          kind: 'sourced',
          label: 'Observed product',
          url: 'https://example.com/floor',
          observedAt: 1000,
          evidence: 'Exact product',
        },
      },
      {
        usdPerUnit: '0.017831',
        date: '1970-01-01',
        observedAt: 1000,
        url: 'https://api.frankfurter.dev/v2/rate/egp/usd',
      },
    );
    offers[offers.indexOf(floor)] = converted;
    expect(c.updateCost(draft.settings, offers)).toBe(true);
    expect(c.saveEstimate('Dated USD equivalent').ok).toBe(true);
    const saved = JSON.stringify(c.getSnapshot().estimateVersions[0]);
    const file = readProject(exportProject(c.getSnapshot())!);
    expect(file.ok).toBe(true);
    if (file.ok) {
      const imported = session();
      expect(imported.importProject(file.value)).toBe(true);
      expect(JSON.stringify(imported.getSnapshot().estimateVersions[0])).toBe(
        saved,
      );
    }
    const record = recoveryOf(c.getSnapshot())!,
      recovered = readRecovery(JSON.stringify(record), 2000);
    expect(recovered.ok).toBe(true);
    if (recovered.ok) {
      const restored = session(() => 2000);
      expect(restored.restore(recovered.value)).toBe(true);
      expect(JSON.stringify(restored.getSnapshot().estimateVersions[0])).toBe(
        saved,
      );
    }
    c.updateCost(draft.settings, draft.offers);
    expect(JSON.stringify(c.getSnapshot().estimateVersions[0])).toBe(saved);
  });
  it('freezes v1 design, totals, quantities and evidence independently from later draft edits, refresh and Undo', () => {
    const c = session(),
      first = c.saveEstimate('First plan');
    expect(first.ok).toBe(true);
    const version = c.getSnapshot().estimateVersions[0]!,
      bytes = JSON.stringify(version);
    expect(Object.isFrozen(version.room.furniture[0])).toBe(true);
    expect(Object.isFrozen(version.pricing.offers[0]!.source)).toBe(true);
    const d = structuredClone(pricingState(c.getSnapshot().cost!));
    d.settings.floor.wasteBps = 2000;
    d.offers[0]!.source.evidence = 'A later manual observation';
    c.updateCost(d.settings, d.offers);
    c.dispatch(
      [{ type: 'finish', id: version.room.furniture[0]!.id, finish: 'sage' }],
      'Sage',
    );
    expect(c.saveEstimate('Second plan').ok).toBe(true);
    expect(c.getSnapshot().estimateVersions[1]!.room.furniture[0]!.finish).toBe(
      'sage',
    );
    expect(JSON.stringify(version)).toBe(bytes);
    c.undo();
    c.undo();
    expect(c.getSnapshot().estimateVersions).toHaveLength(2);
    expect(JSON.stringify(c.getSnapshot().estimateVersions[0])).toBe(bytes);
    const file = readProject(exportProject(c.getSnapshot())!);
    expect(file.ok).toBe(true);
    if (file.ok) expect(JSON.stringify(file.value.versions[0])).toBe(bytes);
  });
  it('captures external input references, retains unresolved costs and has no supplier acceptance claim', () => {
    const c = session(),
      room = structuredClone(c.getSnapshot().workspace!.current),
      pricing = structuredClone(pricingState(c.getSnapshot().cost!));
    const version = captureVersion(room, pricing, 'version', 'Reviewed', 123)!;
    room.room.floorFinish = 'clay';
    pricing.offers[0]!.source.evidence = 'changed';
    expect(version.room.room.floorFinish).toBe('oak');
    expect(version.pricing.offers[0]!.source.evidence).not.toBe('changed');
    expect(version.approval).toBe('consumer-planning');
    expect(version.estimate.complete).toBe(false);
    expect(version.estimate.totalMinor).toBeNull();
    expect(version.estimate.unpricedCount).toBeGreaterThan(0);
  });
  it('compares quantities, scope, products/rates/tax/logistics and currency without inventing FX savings', () => {
    const c = session();
    c.saveEstimate('V1');
    const before = c.getSnapshot().estimateVersions[0]!;
    const p = structuredClone(pricingState(c.getSnapshot().cost!));
    p.settings.floor.wasteBps = 2000;
    p.offers[0]!.tax.source = 'Later tax observation';
    const result = calculateRoomEstimate(before.room, p.settings, p.offers);
    if (!result.ok) throw new Error(result.code);
    const diff = versionChanges(before, {
      room: before.room,
      pricing: p,
      estimate: result.estimate,
    });
    expect(diff.reasons.join(' ')).toMatch(/scope.*rates/);
    expect(diff.removed.length).toBeGreaterThan(0);
    expect(diff.added.length).toBeGreaterThan(0);
    expect(diff.differenceMinor).toBe(
      result.estimate.knownTotalMinor - before.estimate.knownTotalMinor,
    );
    const changed = structuredClone(result.estimate);
    changed.locality.currency = 'EUR';
    p.settings.locality.currency = 'EUR';
    expect(
      versionChanges(before, {
        room: before.room,
        pricing: p,
        estimate: changed,
      }).differenceMinor,
    ).toBeNull();
  });
  it('caps versions at four, rejects invalid labels and refuses unresolved previews without changing saved records', () => {
    const c = session();
    expect(c.saveEstimate(' ').ok).toBe(false);
    const d = c.getSnapshot().cost!;
    c.prepareCostProposal(pricingState(d), 'Preview', [], d.revision);
    expect(c.saveEstimate('Pending').ok).toBe(false);
    c.cancelPreview();
    for (let i = 0; i < 4; i++)
      expect(c.saveEstimate(`V${i + 1}`).ok).toBe(true);
    const before = c.getSnapshot().estimateVersions;
    expect(c.saveEstimate('Fifth').ok).toBe(false);
    expect(c.getSnapshot().estimateVersions).toBe(before);
  });
  it('new draft from a version resets transient authority while keeping baseline, approved records and original expiry', () => {
    let now = 1000;
    const c = session(() => now);
    c.saveEstimate('V1');
    const first = c.getSnapshot(),
      v = first.estimateVersions[0]!;
    const p = structuredClone(first.cost!.settings);
    p.floor.wasteBps = 2000;
    c.updateCost(p);
    c.costMessage('visitor', 'Private conversation');
    const token = c.beginOperation()!;
    now += 60_000;
    expect(c.draftFromEstimate(v.id)).toBe(true);
    const state = c.getSnapshot();
    expect(state.workspace!.workspaceId).not.toBe(first.workspace!.workspaceId);
    expect(c.isCurrent(token)).toBe(false);
    expect(state.workspace!.history.entries).toHaveLength(0);
    expect(state.workspace!.baseline).toEqual(first.workspace!.baseline);
    expect(pricingState(state.cost!)).toEqual(v.pricing);
    expect(state.cost!.messages).toEqual([]);
    expect(state.expiresAt).toBe(first.expiresAt);
    expect(state.createdAt).toBe(first.createdAt);
    expect(state.estimateVersions).toEqual(first.estimateVersions);
    expect(
      c.updateCost({
        ...state.cost!.settings,
        floor: { ...state.cost!.settings.floor, wasteBps: 2500 },
      }),
    ).toBe(true);
    c.undo();
    expect(pricingState(c.getSnapshot().cost!)).toEqual(v.pricing);
  });
  it('save cancels pending research and expiry/reset/disposal remove all saved data', () => {
    let now = 1000;
    const c = session(() => now),
      token = c.beginOperation()!;
    c.saveEstimate('V1');
    expect(c.isCurrent(token)).toBe(false);
    now = c.getSnapshot().expiresAt;
    expect(c.saveEstimate('Late').ok).toBe(false);
    expect(c.getSnapshot().estimateVersions).toEqual([]);
    const r = session();
    r.saveEstimate('V1');
    r.reset(createRoomFixture('empty'));
    expect(r.getSnapshot().estimateVersions).toEqual([]);
    r.setDestination('cost');
    r.saveEstimate('Other');
    r.dispose();
    expect(r.getSnapshot().estimateVersions).toEqual([]);
  });
});
describe('strict format2 project migration and recovery', () => {
  it('preserves recorded EGP prices and frozen totals through import/recovery while fresh projects default to USD', () => {
    const historical = session(),
      pricing = structuredClone(pricingState(historical.getSnapshot().cost!));
    // Synthetic historical record: explicit EGP input, never a currency migration.
    pricing.settings.locality.currency = 'EGP';
    for (const offer of pricing.offers) {
      offer.market.currency = 'EGP';
      if ('packs' in offer) {
        for (const pack of offer.packs) pack.priceMinor *= 20;
      } else {
        offer.priceMinor *= 20;
        if (offer.kind === 'service') offer.minimumMinor *= 20;
      }
    }
    expect(historical.updateCost(pricing.settings, pricing.offers)).toBe(true);
    expect(historical.saveEstimate('Recorded EGP plan').ok).toBe(true);
    const source = historical.getSnapshot(),
      saved = JSON.stringify(source.estimateVersions),
      project = readProject(exportProject(source)!);
    expect(project.ok).toBe(true);
    if (!project.ok) return;
    const imported = session();
    expect(imported.getSnapshot().cost!.settings.locality.currency).toBe('USD');
    expect(imported.importProject(project.value)).toBe(true);
    expect(pricingState(imported.getSnapshot().cost!)).toEqual(pricing);
    expect(JSON.stringify(imported.getSnapshot().estimateVersions)).toBe(saved);
    const record = recoveryOf(imported.getSnapshot())!,
      read = readRecovery(JSON.stringify(record), 2000);
    expect(read.ok).toBe(true);
    if (!read.ok) return;
    const restored = session(() => 2000);
    expect(restored.restore(read.value)).toBe(true);
    expect(pricingState(restored.getSnapshot().cost!)).toEqual(pricing);
    expect(JSON.stringify(restored.getSnapshot().estimateVersions)).toBe(saved);
    expect(session().getSnapshot().cost!.settings.locality.currency).toBe(
      'USD',
    );
  });
  it('round-trips exact saved versions and accepted pricing, excluding private operational state', () => {
    const c = session();
    c.costMessage('visitor', 'PRIVATE_CHAT');
    c.saveEstimate('First');
    const source = c.getSnapshot();
    const text = exportProject({
      ...source,
      photos: ['PRIVATE_PHOTO'],
    } as typeof source)!;
    expect(text).not.toMatch(
      /PRIVATE_|messages|workspaceId|pending|history|receipts|costProposal|blob:/,
    );
    const read = readProject(text);
    expect(read.ok).toBe(true);
    if (!read.ok) return;
    const other = session();
    expect(other.importProject(read.value)).toBe(true);
    expect(pricingState(other.getSnapshot().cost!)).toEqual(
      pricingState(source.cost!),
    );
    expect(other.getSnapshot().estimateVersions).toEqual(
      source.estimateVersions,
    );
    expect(other.getSnapshot().workspace!.workspaceId).not.toBe(
      source.workspace!.workspaceId,
    );
    expect(other.getSnapshot().cost!.messages).toEqual([]);
    expect(read.value.version).toBe(2);
  });
  it('migrates closed version1 project/recovery without inventing prices, versions or approval', () => {
    const c = session(),
      state = c.getSnapshot();
    const legacy = {
      format: 'roomedy-project',
      version: 1,
      catalogueVersion: 'catalogue-v1',
      rulesVersion: 'rectangle-quarterturn-v1',
      current: state.workspace!.current,
      baseline: state.workspace!.baseline,
    };
    const read = readProject(JSON.stringify(legacy));
    expect(read.ok).toBe(true);
    if (!read.ok) return;
    expect(read.value).toMatchObject({ version: 2, cost: null, versions: [] });
    const recovery = readRecovery(
      JSON.stringify({
        createdAt: 1000,
        expiresAt: 1000 + POLICY.guestLifetimeMs,
        project: legacy,
        ui: { view: '2d' },
      }),
      2000,
    );
    expect(recovery.ok).toBe(true);
    expect(c.importProject(legacy)).toBe(true);
    expect(c.getSnapshot().cost).toBeNull();
    expect(c.getSnapshot().destination).toBe('design');
  });
  it.each([
    'total',
    'revision',
    'room',
    'engine',
    'representation',
    'duplicate',
    'chat',
    'currency',
    'future',
  ] as const)('rejects invalid %s before replacing accepted work', (kind) => {
    const c = session();
    c.saveEstimate('V1');
    const before = c.getSnapshot(),
      text = exportProject(before)!,
      raw = JSON.parse(text),
      v = raw.versions[0];
    if (kind === 'total') v.estimate.knownTotalMinor++;
    if (kind === 'revision') v.estimate.roomRevision++;
    if (kind === 'room') v.room.roomId = 'other';
    if (kind === 'engine') v.calculationVersion = 'future-calculation';
    if (kind === 'representation') v.representationVersion = 'future-assets';
    if (kind === 'duplicate') raw.versions.push(v);
    if (kind === 'chat') raw.cost.messages = ['PRIVATE'];
    if (kind === 'currency') raw.cost.settings.locality.currency = 'EUR';
    if (kind === 'future') raw.version = 8;
    expect(readProject(JSON.stringify(raw)).ok).toBe(false);
    expect(c.importProject(raw)).toBe(false);
    expect(c.getSnapshot()).toBe(before);
  });
  it('bounds UTF-8 envelopes and saving new versions before discarding useful memory work', () => {
    const c = session(),
      d = structuredClone(pricingState(c.getSnapshot().cost!)),
      template = d.offers[0]!;
    while (d.offers.length < 160)
      d.offers.push({
        ...structuredClone(template),
        id: `unused_${d.offers.length}`,
        source: {
          ...template.source,
          url: `https://example.com/${'x'.repeat(1900)}`,
          evidence: 'e'.repeat(400),
        },
      });
    expect(c.updateCost(d.settings, d.offers)).toBe(true);
    expect(c.saveEstimate('Large V1').ok).toBe(true);
    const before = c.getSnapshot().estimateVersions;
    expect(c.saveEstimate('Large V2').ok).toBe(false);
    expect(c.getSnapshot().estimateVersions).toBe(before);
    expect(c.getSnapshot().cost!.offers).toHaveLength(160);
    expect(readProject('界'.repeat(POLICY.projectBytes / 2)).ok).toBe(false);
    expect(
      validateProject(JSON.parse(exportProject(c.getSnapshot())!)).ok,
    ).toBe(true);
  });
  it('recovers original expiry and selected destination with saved revisions but no active work', () => {
    const c = session();
    c.dispatch(
      [
        {
          type: 'finish',
          id: c.getSnapshot().workspace!.current.furniture[0]!.id,
          finish: 'sage',
        },
      ],
      'Sage',
    );
    c.saveEstimate('V1');
    const record = recoveryOf(c.getSnapshot())!,
      read = readRecovery(JSON.stringify(record), 2000);
    expect(read.ok).toBe(true);
    if (!read.ok) return;
    const restored = session(() => 2000);
    expect(restored.restore(read.value)).toBe(true);
    expect(restored.getSnapshot().expiresAt).toBe(record.expiresAt);
    expect(restored.getSnapshot().destination).toBe('cost');
    expect(restored.getSnapshot().estimateVersions[0]!.room.roomRevision).toBe(
      1,
    );
    expect(restored.getSnapshot().pending).toBeNull();
    expect(restored.getSnapshot().workspace!.history.entries).toEqual([]);
    expect(readRecovery(JSON.stringify(record), record.expiresAt).ok).toBe(
      false,
    );
  });
});
