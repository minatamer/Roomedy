import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import type * as PdfLib from '../apps/frontend/node_modules/pdf-lib';
import { createRoomFixture } from '../apps/frontend/src/features/session/fixtures/rooms.js';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import {
  estimatePdf,
  estimateQuantityText,
} from '../apps/frontend/src/features/cost/estimate-pdf.js';
import { DesignExportError } from '../apps/frontend/src/features/design-export/facts.js';
import { POLICY } from '@roomedy/contracts/policy';
import { convertOfferToUsd, calculateRoomEstimate } from '@roomedy/spatial';
const requireFrontend = createRequire(
  new URL('../apps/frontend/package.json', import.meta.url),
);
const lib = (await import(
  pathToFileURL(requireFrontend.resolve('pdf-lib')).href
)) as typeof PdfLib;
const jpeg = Uint8Array.from(
  Buffer.from(
    '/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAACAAIDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AJVAA//Z',
    'base64',
  ),
);
const pictures = { overview: jpeg, plan: jpeg, simplified: false };
function version(long = false) {
  const c = new SessionController(createRoomFixture('sample'), {
    now: () => 1000,
  });
  try {
    c.setDestination('cost');
    const d = c.getSnapshot().cost!,
      offers = structuredClone(d.offers),
      floor = offers.find((o) => o.id === d.settings.floor.offerId)!;
    floor.source.url = 'https://example.com/floor?variant=oak&ref=roomedy';
    if (long) {
      floor.label = 'A very long product description '.repeat(4).slice(0, 120);
      floor.source.evidence = 'W'.repeat(400);
      floor.variant = 'V'.repeat(240);
    }
    c.updateCost(d.settings, offers);
    c.saveEstimate('Room estimate v1');
    return c.getSnapshot().estimateVersions[0]!;
  } finally {
    c.dispose();
  }
}
async function read(bytes: Uint8Array) {
  const pdf = await lib.PDFDocument.load(bytes),
    pages: string[] = [],
    links: string[] = [];
  for (const page of pdf.getPages()) {
    const streams = page.node.Contents();
    let body = '';
    if (!(streams instanceof lib.PDFArray))
      throw new Error('Generated PDF must have page content arrays');
    if (streams)
      for (let i = 0; i < streams.size(); i++) {
        const raw = streams.lookup(i, lib.PDFRawStream),
          decoded = Buffer.from(lib.decodePDFRawStream(raw).decode()).toString(
            'latin1',
          );
        body += [...decoded.matchAll(/<([0-9a-f]+)>\s*Tj/gi)]
          .map((m) => Buffer.from(m[1]!, 'hex').toString('latin1'))
          .join('\n');
      }
    pages.push(body);
    const annotations = page.node.Annots();
    if (annotations)
      for (let i = 0; i < annotations.size(); i++) {
        const annotation = annotations.lookup(i, lib.PDFDict),
          action = annotation.lookup(lib.PDFName.of('A'), lib.PDFDict);
        expect(action.get(lib.PDFName.of('S'))?.toString()).toBe('/URI');
        links.push(
          action.lookup(lib.PDFName.of('URI'), lib.PDFString).decodeText(),
        );
      }
  }
  return { pdf, pages, text: pages.join('\n'), links };
}
describe('actual selectable itemized estimate PDF', () => {
  it('prints frozen USD equivalents with a dated reference link, and rejects a foreign-currency PDF', async () => {
    const v = structuredClone(version()),
      floor = v.pricing.offers.find(
        (o) => o.id === v.pricing.settings.floor.offerId,
      )!;
    const usd = convertOfferToUsd(
      {
        ...floor,
        market: { ...floor.market, currency: 'EGP' },
        source: {
          ...floor.source,
          kind: 'sourced',
          observedAt: 1000,
          evidence: 'Verified variant',
        },
      },
      {
        usdPerUnit: '0.017831',
        date: '1970-01-01',
        observedAt: 1000,
        url: 'https://api.frankfurter.dev/v2/rate/egp/usd',
      },
    );
    v.pricing.offers[v.pricing.offers.indexOf(floor)] = usd;
    const calculated = calculateRoomEstimate(
      v.room,
      v.pricing.settings,
      v.pricing.offers,
    );
    if (!calculated.ok) throw new Error('fixture');
    v.estimate = calculated.estimate;
    const output = await read(await estimatePdf(v, pictures));
    expect(output.text).toContain('USD reference equivalent');
    expect(output.text).toContain('rate dated 1970-01-01');
    expect(output.text).not.toContain('EGP');
    expect(output.links).toContain(usd.fx!.url);
    const foreign = structuredClone(v);
    foreign.estimate.locality.currency = 'EGP';
    await expect(estimatePdf(foreign, pictures)).rejects.toThrow();
  });
  it('writes exact known totals, six unresolved items, pack/can quantities and historical source annotations', async () => {
    const v = version(),
      before = JSON.stringify(v),
      bytes = await estimatePdf(v, pictures),
      result = await read(bytes);
    expect(Buffer.from(bytes).toString('latin1', 0, 8)).toMatch(/^%PDF-/);
    expect(result.pdf.getTitle()).toBe('Roomedy estimate - Room estimate v1');
    expect(result.text).toContain('USD 1,801.48');
    expect(result.text).toContain('USD 42.00/pack');
    expect(result.text).not.toContain('EGP');
    expect(result.text).toContain('6 unpriced lines');
    expect(result.text).toContain('11 pack');
    expect(result.text).toContain('2 x 5 L');
    expect(result.text).toContain('9.6 m2 net');
    expect(result.text).not.toContain('/1000000 m2 net');
    expect(result.text).toContain('UNPRICED');
    expect(result.text).toContain('Known costs so far');
    expect(result.text).not.toContain('Continued:');
    expect(result.text).not.toContain('�');
    expect(result.text).toContain('Discovery link only');
    expect(result.text).toContain('authored examples');
    expect(result.links).toContain(
      'https://example.com/floor?variant=oak&ref=roomedy',
    );
    expect(
      result.pages.filter((p) => p.includes('Item / selected scope')).length,
    ).toBeGreaterThan(1);
    for (const page of result.pdf.getPages()) {
      expect(page.getWidth()).toBeCloseTo(595.28, 2);
      expect(page.getHeight()).toBeCloseTo(841.89, 2);
    }
    expect(JSON.stringify(v)).toBe(before);
    expect(result.pdf.getPageCount()).toBeLessThanOrEqual(
      POLICY.estimateExportPages,
    );
  });
  it('wraps long names and unbroken evidence without dropping their text', async () => {
    const result = await read(await estimatePdf(version(true), pictures));
    expect(result.text.replace(/\s+/g, '')).toContain('W'.repeat(400));
    expect(result.text.replace(/\s+/g, '')).toContain('V'.repeat(240));
    expect(result.pdf.getPageCount()).toBeGreaterThan(4);
  });
  it('rejects unsupported scripts with a useful language code, preserving the original snapshot', async () => {
    const v = structuredClone(version());
    v.label = 'غرفة';
    const before = JSON.stringify(v);
    await expect(estimatePdf(v, pictures)).rejects.toMatchObject({
      code: 'unsupported-text',
    });
    expect(JSON.stringify(v)).toBe(before);
  });
  it('bounds generated pages/bytes and rechecks cancellation during work', async () => {
    const v = version();
    await expect(estimatePdf(v, pictures, { pages: 1 })).rejects.toMatchObject({
      code: 'too-large',
    });
    await expect(estimatePdf(v, pictures, { bytes: 1 })).rejects.toMatchObject({
      code: 'too-large',
    });
    await expect(
      estimatePdf(v, pictures, { pages: POLICY.estimateExportPages + 1 }),
    ).rejects.toMatchObject({ code: 'too-large' });
    let checks = 0;
    await expect(
      estimatePdf(v, pictures, {
        check: () => {
          if (++checks === 6) throw new DesignExportError('cancelled');
        },
      }),
    ).rejects.toMatchObject({ code: 'cancelled' });
  });
  it('rejects changed stored totals instead of printing a different calculation as historical truth', async () => {
    const v = structuredClone(version());
    v.estimate.knownTotalMinor++;
    await expect(estimatePdf(v, pictures)).rejects.toMatchObject({
      code: 'changed',
    });
    expect(
      estimateQuantityText({
        numerator: 221760000000,
        denominator: 10000,
        unit: 'mm2',
      }),
    ).toBe('22.176 m2');
    expect(estimateQuantityText(null)).toBe('Needs review');
  });
});
