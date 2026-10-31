import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import type * as PdfLib from '../apps/frontend/node_modules/pdf-lib';
import { createRoomFixture } from '../apps/frontend/src/features/session/fixtures/rooms.js';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import { createManualRoom } from '../apps/frontend/src/features/session/entry/manual-room.js';
import { marketTargets } from '../apps/frontend/src/features/cost/market-research.js';
import { chooseProduct } from '../apps/frontend/src/features/cost/attach-offer.js';
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
  it('keeps an unpriced selected link as a reference without claiming a quote or listing rate', async () => {
    const c = new SessionController(createManualRoom('partial'));
    try {
      c.setDestination('cost', 'en-US');
      const s = c.getSnapshot(),
        target = marketTargets(s.workspace!.current)[0]!;
      expect(
        chooseProduct(
          c,
          target.brief,
          {
            label: 'Unpriced selected reference',
            url: 'https://merchant.example/reference',
            imageUrl: null,
            offer: null,
            listing: null,
            conditions: 'standard',
            match: 'similar',
            differences: [],
            evidence: 'Specific product page, no verified price',
          },
          s.cost!.revision,
          s.workspace!.current.roomRevision,
          false,
        ).ok,
      ).toBe(true);
      expect(c.saveEstimate('Reference only').ok).toBe(true);
      const saved = c.getSnapshot().estimateVersions[0]!,
        before = JSON.stringify(saved),
        output = await read(await estimatePdf(saved, pictures));
      expect(output.text).toContain('Selected reference');
      expect(output.text).toContain('Price needs review');
      expect(output.text).toContain('Review price or fit');
      expect(output.links).toContain('https://merchant.example/reference');
      expect(saved.estimate.knownTotalMinor).toBe(0);
      expect(JSON.stringify(saved)).toBe(before);
    } finally {
      c.dispose();
    }
  });
  it.each([false, true])(
    'uses the current downloadable PDF layout for selected products (simulation: %s)',
    async (simulation) => {
      const c = new SessionController(createManualRoom('partial'));
      try {
        c.setDestination('cost', 'en-US');
        for (const target of marketTargets(
          c.getSnapshot().workspace!.current,
        )) {
          const s = c.getSnapshot(),
            kind = target.brief.kind;
          expect(
            chooseProduct(
              c,
              target.brief,
              {
                label: target.label + ' selected product',
                url: 'https://merchant.example/' + target.key,
                imageUrl: null,
                evidence: 'Offline published listing fixture',
                offer: null,
                conditions: 'standard',
                match: 'similar',
                differences: [],
                listing: {
                  priceMinor: 10000,
                  currency: 'USD',
                  country: 'US',
                  unit:
                    kind === 'floor'
                      ? 'pack'
                      : kind === 'paint'
                        ? 'can'
                        : 'item',
                  volumeMl: kind === 'paint' ? 2500 : null,
                  observedAt: 123,
                },
              },
              s.cost!.revision,
              s.workspace!.current.roomRevision,
              simulation,
              target.matchingWalls,
            ).ok,
          ).toBe(true);
        }
        expect(c.saveEstimate('Priced room').ok).toBe(true);
        const saved = c.getSnapshot().estimateVersions[0]!,
          before = JSON.stringify(saved);
        expect(saved.estimate.unpricedCount).toBe(0);
        expect(saved.estimate.complete).toBe(false);
        const output = await read(await estimatePdf(saved, pictures));
        expect(output.text).toContain('All selected items have a price.');
        expect(output.text).toContain(
          'Measurements, coverage or product details still need review.',
        );
        expect(output.text).not.toContain('0 unpriced');
        expect(output.text).not.toContain('0 unresolved');
        if (simulation) expect(output.text).toContain('authored examples');
        else expect(output.text).not.toContain('authored examples');
        expect(output.text).not.toContain('Sample amounts need');
        expect(output.text).toContain('Product checks');
        expect(output.text.replace(/\s+/g, ' ')).toContain(
          'Paint: colour, sheen & coats.',
        );
        expect(output.text).toContain('HOW THE TOTAL IS BUILT');
        expect(output.text).toContain('BEFORE YOU ORDER');
        expect(output.text).not.toContain('Your shopping plan');
        expect(output.pdf.getPageCount()).toBe(6);
        const productPages = output.pages.filter((page) =>
          page.includes('Item / selected scope'),
        );
        expect(productPages).toHaveLength(1);
        for (const choice of saved.pricing.productChoices!)
          expect(productPages[0]!.replace(/\s+/g, '')).toContain(
            choice.label.replace(/\s+/g, ''),
          );
        const quantityPages = output.pages.filter((page) =>
          page.includes('Quantity details'),
        );
        expect(quantityPages).toHaveLength(1);
        const quantityPage = quantityPages[0]!;
        expect(quantityPage).toContain('ROOM FLOOR');
        expect(quantityPage).toContain('WITH CUTTING WASTE');
        expect(quantityPage).toContain('NET WALLS');
        expect(quantityPage).toContain('PAINT NEEDED');
        expect(quantityPage).toContain('BUY');
        expect(quantityPage).not.toContain('Price & source');
        expect(quantityPage).not.toContain('Review notes');
        expect(quantityPage).not.toContain('Selected product - price included');
        const sourcePages = output.pages.filter((page) =>
          page.includes('Products, rates & source evidence'),
        );
        expect(sourcePages).toHaveLength(1);
        expect(sourcePages[0]).toContain('PRICE BASIS');
        expect(sourcePages[0]).toContain(simulation ? 'Example' : 'Listed');
        expect(sourcePages[0]).toContain('OUTSIDE THIS ESTIMATE');
        expect(sourcePages[0]).toContain('CHECK BEFORE ORDERING');
        expect(sourcePages[0]).toContain('PLANNING ONLY');
        expect(sourcePages[0]).not.toContain('Calculation references');
        expect(output.text).not.toContain(saved.calculationVersion);
        expect(output.pdf.getKeywords()).toContain(saved.calculationVersion);
        expect(output.pdf.getKeywords()).toContain(saved.id);
        expect(output.links).toHaveLength(8);
        expect(new Set(output.links).size).toBe(4);
        expect(JSON.stringify(saved)).toBe(before);
      } finally {
        c.dispose();
      }
    },
  );
  it.each([true, false])(
    'exports whole-room pack quantities with product/assumed coverage, facts=%s',
    async (facts) => {
      const c = new SessionController(createManualRoom('partial'));
      try {
        c.setDestination('cost', 'en-US');
        const s = c.getSnapshot(),
          target = marketTargets(s.workspace!.current).find(
            (t) => t.brief.kind === 'floor',
          )!;
        expect(
          chooseProduct(
            c,
            target.brief,
            {
              label: 'Whole-room floor',
              url: 'https://merchant.example/room-floor',
              imageUrl: null,
              match: 'lead',
              conditions: 'standard',
              evidence: 'Offline fixture',
              differences: [],
              offer: null,
              listing: {
                priceMinor: 4200,
                currency: 'USD',
                country: 'US',
                unit: 'pack',
                volumeMl: null,
                observedAt: 123,
                ...(facts ? { coverageMm2: 2_200_000 } : {}),
              },
            },
            s.cost!.revision,
            s.workspace!.current.roomRevision,
            false,
          ).ok,
        ).toBe(true);
        c.saveEstimate('Whole-room floor');
        const saved = c.getSnapshot().estimateVersions[0]!,
          before = JSON.stringify(saved),
          output = await read(await estimatePdf(saved, pictures));
        expect(output.text).toContain('USD 462.00');
        expect(output.text).toContain('11 pack');
        expect(output.text).toContain('BUY');
        expect(output.text).toContain('11 packs');
        expect(output.text).toContain('WITH CUTTING WASTE');
        expect(output.text).toContain(
          facts ? 'Product coverage' : 'Planning coverage',
        );
        expect(JSON.stringify(saved)).toBe(before);
      } finally {
        c.dispose();
      }
    },
  );
  it('includes selected listing prices in the actual PDF subtotal and excludes unchosen alternatives', async () => {
    const c = new SessionController(createManualRoom('partial'));
    try {
      c.setDestination('cost', 'en-US');
      const state = c.getSnapshot(),
        target = marketTargets(state.workspace!.current)[0]!;
      const candidate = {
        label: 'Chosen pending bed',
        url: 'https://merchant.example/chosen-bed',
        imageUrl: 'https://cdn.example/chosen-bed.jpg',
        match: 'lead' as const,
        conditions: 'standard' as const,
        evidence: 'Observed listed product; specifications incomplete',
        differences: [],
        offer: null,
        listing: {
          priceMinor: 24900,
          currency: 'USD' as const,
          country: 'US',
          unit: 'item' as const,
          volumeMl: null,
          observedAt: 123,
        },
      };
      expect(
        chooseProduct(
          c,
          target.brief,
          {
            ...candidate,
            label: 'Unchosen pending bed',
            url: 'https://merchant.example/unchosen-bed',
          },
          state.cost!.revision,
          state.workspace!.current.roomRevision,
          false,
        ).ok,
      ).toBe(true);
      const current = c.getSnapshot();
      expect(
        chooseProduct(
          c,
          target.brief,
          candidate,
          current.cost!.revision,
          current.workspace!.current.roomRevision,
          false,
        ).ok,
      ).toBe(true);
      expect(c.saveEstimate('Selected products').ok).toBe(true);
      const saved = c.getSnapshot().estimateVersions[0]!,
        before = JSON.stringify(saved);
      const photo = {
        key: target.key,
        url: candidate.url,
        imageUrl: candidate.imageUrl!,
        jpeg,
      };
      const output = await read(
        await estimatePdf(saved, { ...pictures, products: [photo] }),
      );
      const images = (result: Awaited<ReturnType<typeof read>>) =>
        result.pdf.getPages().reduce((count, page) => {
          const objects = page.node
            .Resources()
            ?.lookupMaybe(lib.PDFName.of('XObject'), lib.PDFDict);
          return (
            count +
            (objects?.keys().filter((key) => {
              const object = objects.lookup(key);
              return (
                object instanceof lib.PDFRawStream &&
                object.dict.get(lib.PDFName.of('Subtype'))?.toString() ===
                  '/Image'
              );
            }).length ?? 0)
          );
        }, 0);
      expect(images(output)).toBe(3);
      expect(output.text).toContain('Selected product photo');
      expect(output.text).toContain('Quantity details');
      const wrong = await read(
        await estimatePdf(saved, {
          ...pictures,
          products: [
            { ...photo, url: 'https://merchant.example/unchosen-bed' },
          ],
        }),
      );
      expect(images(wrong)).toBe(2);
      expect(wrong.text).toContain('unavailable');
      expect(wrong.links).toContain(candidate.url);
      const corrupt = await read(
        await estimatePdf(saved, {
          ...pictures,
          products: [{ ...photo, jpeg: new Uint8Array([1, 2, 3]) }],
        }),
      );
      expect(images(corrupt)).toBe(2);
      expect(corrupt.links).toContain(candidate.url);
      expect(output.text).toContain('Your selected products');
      expect(output.text).toContain('Chosen pending bed');
      expect(output.text).not.toContain('Unchosen pending bed');
      expect(output.text).toContain('Included in subtotal');
      expect(output.text).toContain('USD 249.00');
      expect(output.text).toContain('Listed');
      expect(output.links).toContain(candidate.url);
      expect(output.links).not.toContain(
        'https://merchant.example/unchosen-bed',
      );
      expect(saved.estimate.knownTotalMinor).toBe(24900);
      expect(JSON.stringify(saved)).toBe(before);
    } finally {
      c.dispose();
    }
  });
  it('renders human paint areas in the actual PDF without mutating the saved calculation', async () => {
    const saved = version(),
      before = JSON.stringify(saved);
    const output = await read(await estimatePdf(saved, pictures));
    expect(output.text).not.toMatch(/\d+\/1000000 m/);
    expect(output.text).toMatch(/wall: [\d.,]+ m/);
    expect(JSON.stringify(saved)).toBe(before);
  });
  it('exports a simple shopping plan without excluded delivery rows or installation steps', async () => {
    const c = new SessionController(createRoomFixture('sample'));
    try {
      c.setDestination('cost', 'en-US');
      expect(c.saveEstimate('Material shopping').ok).toBe(true);
      const version = c.getSnapshot().estimateVersions[0]!;
      const output = await read(await estimatePdf(version, pictures));
      expect(output.text).toContain('BEFORE YOU ORDER');
      expect(output.text).toContain('Paint: colour, sheen & coats.');
      expect(output.text).not.toContain('Your shopping plan');
      expect(output.text).not.toContain('Prepare and paint');
      expect(output.text).not.toContain('Clear and protect');
      expect(output.text).not.toContain('service is explicitly excluded');
      expect(
        version.estimate.lines.every((line) => line.category !== 'delivery'),
      ).toBe(true);
      expect(output.text).toContain('USD');
    } finally {
      c.dispose();
    }
  });
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
