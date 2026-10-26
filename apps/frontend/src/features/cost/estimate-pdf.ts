import { PDFDocument, PDFString, StandardFonts, rgb } from 'pdf-lib';
import type { PDFFont, PDFPage } from 'pdf-lib';
import { estimateVersionSchema } from '@roomedy/contracts/project';
import type { EstimateVersion } from '@roomedy/contracts/project';
import type {
  EstimateLine,
  EstimateOffer,
  EstimateQuantity,
} from '@roomedy/contracts/estimates';
import { sourceUrlSchema } from '@roomedy/contracts/estimates';
import { POLICY } from '@roomedy/contracts/policy';
import { calculateRoomEstimate } from '@roomedy/spatial';
import { DesignExportError } from '../design-export/facts';
import { roomWorkPlan } from './work-plan';
export interface EstimatePictures {
  overview: Uint8Array;
  plan: Uint8Array;
  simplified: boolean;
}
const paper = rgb(0.969, 0.953, 0.925),
  ink = rgb(0.263, 0.208, 0.165),
  muted = rgb(0.43, 0.35, 0.27),
  cocoa = rgb(0.47, 0.33, 0.24);
const cash = (minor: number, currency: string) =>
  `${currency} ${(minor / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export function estimateQuantityText(q: EstimateQuantity | null) {
  if (!q) return 'Needs measurement';
  const divisor =
    q.unit === 'mm2' ? 1e6 : q.unit === 'mm' || q.unit === 'ml' ? 1000 : 1;
  const unit =
    q.unit === 'mm2'
      ? 'm2'
      : q.unit === 'mm'
        ? 'm'
        : q.unit === 'ml'
          ? 'L'
          : q.unit === 'minute'
            ? 'min'
            : q.unit;
  return `${(q.numerator / q.denominator / divisor).toLocaleString('en-US', { maximumFractionDigits: 4 })} ${unit}`;
}
function rate(offer: EstimateOffer, line: EstimateLine) {
  const currency = offer.market.currency;
  if ('packs' in offer)
    return line.packs
      .map((p) => {
        const can = offer.packs.find((c) => c.id === p.id);
        return can
          ? `${p.count} x ${can.volumeMl / 1000} L at ${cash(can.priceMinor, currency)}/can`
          : null;
      })
      .filter(Boolean)
      .join('; ');
  if (offer.kind === 'service')
    return `${cash(offer.priceMinor, currency)}/${offer.basis}; minimum ${cash(offer.minimumMinor, currency)}`;
  return `${cash(offer.priceMinor, currency)}/${offer.kind === 'floor' || offer.kind === 'underlay' ? 'pack' : 'item'}`;
}
/** Author generated output only. No uploaded PDF parsing, network or source refresh. */
export async function estimatePdf(
  raw: EstimateVersion,
  pictures: EstimatePictures,
  port: {
    check?: () => void;
    progress?: (text: string) => void;
    pages?: number;
    bytes?: number;
  } = {},
): Promise<Uint8Array> {
  const version = estimateVersionSchema.parse(raw),
    e = version.estimate,
    currency = e.locality.currency;
  const calculated = calculateRoomEstimate(
    version.room,
    version.pricing.settings,
    version.pricing.offers,
  );
  if (
    !calculated.ok ||
    JSON.stringify(calculated.estimate) !== JSON.stringify(e)
  )
    throw new DesignExportError('changed');
  const maxPages = port.pages ?? POLICY.estimateExportPages,
    maxBytes = port.bytes ?? POLICY.designExportPdfBytes;
  if (
    !Number.isInteger(maxPages) ||
    maxPages < 1 ||
    maxPages > POLICY.estimateExportPages ||
    !Number.isInteger(maxBytes) ||
    maxBytes < 1 ||
    maxBytes > POLICY.designExportPdfBytes ||
    pictures.overview.byteLength + pictures.plan.byteLength > maxBytes
  )
    throw new DesignExportError('too-large');
  const check = () => port.check?.();
  check();
  const pdf = await PDFDocument.create(),
    font = await pdf.embedFont(StandardFonts.Helvetica),
    bold = await pdf.embedFont(StandardFonts.HelveticaBold),
    titleFont = await pdf.embedFont(StandardFonts.TimesRomanItalic);
  pdf.setTitle(`Roomedy estimate - ${version.label}`);
  pdf.setAuthor('Roomedy');
  pdf.setSubject('Reviewed consumer planning estimate, sources and work plan');
  pdf.setCreator('Roomedy CPQ');
  const clean = (value: string) =>
    value
      .replace(/[\u2010-\u2015\u2212]/g, '-')
      .replace(/[\u00a0\u202f]/g, ' ')
      .replace(/\t/g, ' ')
      .replace(/×/g, 'x')
      .replace(/²/g, '2')
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"');
  const safe = (value: string, face = font) => {
    const text = clean(value);
    try {
      face.encodeText(text.replace(/\r?\n/g, ''));
    } catch {
      throw new DesignExportError('unsupported-text');
    }
    return text;
  };
  const used = version.pricing.offers.filter((o) =>
      e.lines.some((l) => l.offerIds.includes(o.id)),
    ),
    sourceNumbers = new Map(used.map((o, i) => [o.id, i + 1]));
  const noteCounts = new Map<string, number>();
  for (const line of e.lines)
    for (const note of new Set(line.notes.filter((n) => n !== line.rule)))
      noteCounts.set(note, (noteCounts.get(note) ?? 0) + 1);
  const sharedNotes = new Map(
    [...noteCounts]
      .filter(([, count]) => count > 1)
      .map(([text], i) => [text, i + 1]),
  );
  const evidence = new Map(
    [...new Set(used.map((o) => o.source.evidence).filter(Boolean))].map(
      (text, i) => [text, i + 1],
    ),
  );
  const taxEvidence = new Map(
    [
      ...new Set(
        used.map((o) => o.tax.source).filter((text): text is string => !!text),
      ),
    ].map((text, i) => [text, i + 1]),
  );

  for (const value of [
    version.label,
    e.locality.city,
    ...e.lines.flatMap((l) => [l.label, l.rule, ...l.notes]),
    ...used.flatMap((o) => [
      o.label,
      o.variant,
      o.supplier,
      o.source.evidence,
      o.leadTime ?? '',
    ]),
  ])
    safe(value);
  let page: PDFPage,
    y = 0,
    section = '',
    table = false,
    continuation: string | null = null;
  const wrap = (
    value: string,
    width: number,
    size: number,
    face: PDFFont = font,
  ) => {
    const rows: string[] = [];
    for (const paragraph of safe(value, face).split('\n')) {
      let row = '';
      for (const word of paragraph.split(/\s+/).filter(Boolean)) {
        if (face.widthOfTextAtSize(word, size) > width) {
          if (row) {
            rows.push(row);
            row = '';
          }
          let part = '';
          for (const char of word) {
            if (part && face.widthOfTextAtSize(part + char, size) > width) {
              rows.push(part);
              part = '';
            }
            part += char;
          }
          row = part;
        } else if (
          row &&
          face.widthOfTextAtSize(`${row} ${word}`, size) > width
        ) {
          rows.push(row);
          row = word;
        } else row = row ? `${row} ${word}` : word;
      }
      rows.push(row);
    }
    return rows;
  };
  const draw = (
    text: string,
    x: number,
    at: number,
    size = 10,
    face = font,
    color = ink,
  ) => page.drawText(safe(text, face), { x, y: at, size, font: face, color });
  const tableHead = () => {
    draw('Item / selected scope', 42, y, 9, bold);
    draw('Quantity', 315, y, 9, bold);
    draw('Amount', 500, y, 9, bold);
    y -= 12;
    page.drawLine({
      start: { x: 42, y },
      end: { x: 553, y },
      color: cocoa,
      thickness: 0.6,
    });
    y -= 17;
  };
  const next = () => {
    check();
    if (pdf.getPageCount() >= maxPages)
      throw new DesignExportError('too-large');
    page = pdf.addPage([595.28, 841.89]);
    page.drawRectangle({
      x: 0,
      y: 0,
      width: 595.28,
      height: 841.89,
      color: paper,
    });
    draw('roomedy.', 42, 799, 19, bold, cocoa);
    draw('ROOMEDY ESTIMATE', 428, 803, 8, bold, muted);
    const subtitle = `${version.label} | ${e.locality.city}, ${e.locality.country} | ${currency}`;
    let subtitleSize = 9;
    while (
      font.widthOfTextAtSize(safe(subtitle), subtitleSize) > 511 &&
      subtitleSize > 7
    )
      subtitleSize -= 0.25;
    if (font.widthOfTextAtSize(safe(subtitle), subtitleSize) > 511)
      throw new DesignExportError('too-large');
    draw(subtitle, 42, 779, subtitleSize, font, muted);
    y = 746;
    draw(section, 42, y, 23, titleFont, cocoa);
    y -= 31;
    if (table) tableHead();
    if (continuation) {
      for (const line of wrap(`Continued: ${continuation}`, 511, 9, bold)) {
        draw(line, 42, y, 9, bold);
        y -= 13;
      }
      y -= 5;
    }
    port.progress?.(`Creating estimate page ${pdf.getPageCount()}...`);
  };
  const space = (height: number) => {
    if (y - height < 62) next();
  };
  const para = (
    text: string,
    size = 10,
    face = font,
    color = ink,
    width = 511,
    x = 42,
  ) => {
    for (const row of wrap(text, width, size, face)) {
      space(size + 5);
      draw(row, x, y, size, face, color);
      y -= size + 5;
    }
    y -= 6;
  };
  const chapter = (text: string, isTable = false) => {
    section = text;
    table = isTable;
    continuation = null;
    next();
  };
  const link = (label: string, url: string) => {
    const address = sourceUrlSchema.parse(url),
      uri = new URL(address).href;
    for (const row of wrap(label, 511, 9)) {
      space(17);
      draw(row, 42, y, 9, font, cocoa);
      const ref = pdf.context.register(
        pdf.context.obj({
          Type: 'Annot',
          Subtype: 'Link',
          Rect: [42, y - 2, 42 + font.widthOfTextAtSize(safe(row), 9), y + 10],
          Border: [0, 0, 0],
          A: { Type: 'Action', S: 'URI', URI: PDFString.of(uri) },
        }),
      );
      page.node.addAnnot(ref);
      y -= 15;
    }
    y -= 4;
  };
  const yieldWork = async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    check();
  };
  const image = async (
    bytes: Uint8Array,
    top: number,
    width: number,
    height: number,
  ) => {
    check();
    const jpg = await pdf.embedJpg(bytes);
    check();
    const scale = Math.min(width / jpg.width, height / jpg.height);
    page.drawImage(jpg, {
      x: 42 + (width - jpg.width * scale) / 2,
      y: top - height + (height - jpg.height * scale) / 2,
      width: jpg.width * scale,
      height: jpg.height * scale,
    });
  };
  chapter('Your room, made real.');
  para(`Reviewed planning version: ${version.label}`, 13, bold);
  para(
    `Saved ${new Date(version.savedAt).toISOString()} | Room revision ${version.room.roomRevision}`,
    9,
    font,
    muted,
  );
  para(`Estimate ID: ${version.id}`, 8, font, muted);
  await image(pictures.overview, y, 511, 285);
  y -= 306;
  para(
    e.complete ? 'Estimated selected-scope total' : 'Known costs so far',
    12,
    bold,
  );
  y -= 8;
  para(cash(e.knownTotalMinor, currency), 28, bold, cocoa);
  para(
    `${e.unpricedCount} unpriced lines. ${e.complete ? 'This estimate includes the selected priced scope.' : 'The complete cost is not known; unresolved required costs are additional.'}`,
    11,
    bold,
  );
  para(
    `Allowances ${cash(e.allowanceMinor, currency)}; calculated tax ${cash(e.taxMinor, currency)}. Amounts are planning estimates, not a supplier or contractor commitment.`,
    10,
  );
  para(
    'Sample amounts are authored examples. Confirm measurements, variants, prices, stock, tax, delivery and work scope before ordering. No purchase or booking has been made.',
    9,
    font,
    muted,
  );
  chapter('The selected room & plan');
  await image(pictures.plan, y, 511, 470);
  y -= 486;
  const measure = (axis: 'width' | 'depth' | 'height') => {
    const m = version.room.room[axis];
    return `${axis}: ${m.value === null ? 'unknown' : `${m.value} mm (${m.status})`}`;
  };
  para((['width', 'depth', 'height'] as const).map(measure).join('; '));
  para(
    'Plan numbers identify furniture in the itemized estimate. ~ marks estimated dimensions. Unknown dimensions use illustrative display bounds; the picture does not establish measurement or fit.',
    9,
    font,
    muted,
  );
  if (pictures.simplified)
    para(
      'Some representations use labelled simplified bounds. Their physical dimensions and uncertainty remain separate from decorative mesh detail.',
      9,
      font,
      muted,
    );
  chapter('Cost summary');
  for (const category of [
    'floor',
    'walls',
    'furniture',
    'services',
    'delivery',
    'tax',
    'allowance',
  ] as const) {
    const lines = e.lines.filter((l) => l.category === category);
    if (!lines.length) continue;
    para(
      `${category.toUpperCase()}: ${cash(
        lines.reduce((sum, l) => sum + (l.amountMinor ?? 0), 0),
        currency,
      )}${lines.some((l) => l.amountMinor === null) ? ' + UNPRICED ITEMS' : ''}`,
      12,
      bold,
    );
  }
  para(
    `Priced subtotal ${cash(e.pricedSubtotalMinor, currency)}; allowances ${cash(e.allowanceMinor, currency)}; added tax ${cash(e.taxMinor, currency)}. Known total ${cash(e.knownTotalMinor, currency)}.`,
    11,
    bold,
  );
  para(
    'Category amounts already include their calculated lines. Allowances and added tax are disclosed here, not charged again. Inclusive tax is not added twice. A missing amount is unpriced, never zero.',
  );
  if (version.pricing.budgetMinor !== null)
    para(
      `Planning budget ${cash(version.pricing.budgetMinor, currency)}. ${e.complete ? 'Compare it with the selected-scope estimate; allowances still need confirmation.' : 'Unpriced required costs prevent a verified budget result.'}`,
    );
  for (const assumption of e.assumptions) para(assumption, 9, font, muted);
  para(
    'This is a suggested sequence, not a site-specific installation method or schedule. Manufacturer requirements, drying/recoat/cure times, mounting, access, delivery and tradespeople must be confirmed. Source pages open separately; this PDF performs no research or purchasing.',
    9,
    font,
    muted,
  );

  para(
    `Calculation ${version.calculationVersion}; rules ${version.rulesVersion}; catalogue ${version.catalogueVersion}; representation ${version.representationVersion}. English Latin-font output. Financial text is selectable; room/plan images are raster graphics. No PDF/A, tagged-PDF or multilingual/RTL conformance is claimed.`,
    8,
    font,
    muted,
  );
  chapter('Itemized estimate', true);
  for (const [index, line] of e.lines.entries()) {
    check();
    continuation = null;
    const furniture = line.targets.find((t) => t.kind === 'furniture'),
      number =
        furniture?.kind === 'furniture'
          ? version.room.furniture.findIndex((p) => p.id === furniture.id) + 1
          : 0;
    const label = `${number ? `${number}. ` : ''}${line.label}`,
      rows = wrap(label, 261, 11, bold);
    const amount =
      line.amountMinor === null ? 'UNPRICED' : cash(line.amountMinor, currency);
    let amountSize = 11;
    while (bold.widthOfTextAtSize(amount, amountSize) > 135 && amountSize > 7)
      amountSize -= 0.25;
    const quantities = wrap(estimateQuantityText(line.quantity), 90, 9);
    const sizes = [
      ['Installed', line.installed],
      ['Required', line.required],
      ['Purchased', line.purchased],
    ] as const;
    const sizeText = sizes
      .filter(([, q]) => q)
      .map(([name, q]) => `${name}: ${estimateQuantityText(q)}`)
      .join(' | ');
    const offers = used.filter((o) => line.offerIds.includes(o.id));
    const floor = offers.find((o) => o.kind === 'floor'),
      service = offers.find((o) => o.kind === 'service');
    let rule = line.rule;
    if (
      floor?.kind === 'floor' &&
      line.category === 'floor' &&
      line.amountMinor !== null
    )
      rule = `Net ${estimateQuantityText(line.installed)} plus ${version.pricing.settings.floor.wasteBps / 100}% cutting waste. Buy ${estimateQuantityText(line.quantity)}, covering ${estimateQuantityText(line.purchased)}; ${floor.coverageMm2 / 1e6} m2 per pack. Waste is applied once.`;
    else if (
      service?.kind === 'service' &&
      line.category === 'services' &&
      line.amountMinor !== null
    )
      rule = `Recorded ${service.basis} rate applied to ${estimateQuantityText(line.quantity)}; minimum ${cash(service.minimumMinor, currency)} applied once. ${service.includedWork}`;
    const notes = [...new Set(line.notes)].filter((note) => note !== line.rule);
    const body = [
      `${line.category} | ${line.pricing} | ${line.quantityStatus} quantities`,
      sizeText,
      line.category !== 'tax' && offers.length
        ? `Unit rates / pack mix: ${offers
            .map((o) => rate(o, line))
            .filter(Boolean)
            .join('; ')}`
        : '',
      rule,
      ...notes.filter((note) => !sharedNotes.has(note)),
      notes.some((note) => sharedNotes.has(note))
        ? `Shared notes: ${notes
            .filter((note) => sharedNotes.has(note))
            .map((note) => `A${sharedNotes.get(note)}`)
            .join(', ')}`
        : '',
      offers.length
        ? `Sources: ${offers.map((o) => `[${sourceNumbers.get(o.id)}] ${o.label}`).join('; ')}`
        : '',
    ]
      .filter(Boolean)
      .join('\n');
    const headerHeight = Math.max(rows.length * 15, quantities.length * 13) + 3;
    const rowHeight = headerHeight + wrap(body, 511, 8.5).length * 13.5 + 6 + 8;
    // Ordinary rows stay together; a bounded exceptionally long row may continue with its label.
    space(Math.min(rowHeight, 620));
    const top = y;
    for (const row of rows) {
      draw(row, 42, y, 11, bold);
      y -= 15;
    }
    for (const [i, q] of quantities.entries()) draw(q, 315, top - i * 13, 9);
    draw(
      amount,
      553 - bold.widthOfTextAtSize(amount, amountSize),
      top,
      amountSize,
      bold,
      line.amountMinor === null ? cocoa : ink,
    );
    y = top - headerHeight;
    continuation = label;
    para(body, 8.5);
    y -= 8;
    continuation = null;
    if (index % 8 === 0) await yieldWork();
  }
  chapter('Products, rates & source evidence');
  para(
    'Shared notes and evidence below apply only to the numbered references shown in the financial rows and product records. Sample links are discovery links, not evidence of the authored amount or stock. Dates are historical observations, not price guarantees.',
    9,
  );
  for (const [text, id] of sharedNotes) para(`A${id}: ${text}`, 9);
  for (const [text, id] of evidence) para(`E${id}: ${text}`, 9);
  for (const [text, id] of taxEvidence) para(`T${id}: ${text}`, 9);
  for (const offer of used) {
    const date =
      offer.source.observedAt === null
        ? 'Date not recorded'
        : `${offer.source.kind === 'manual' ? 'Entered' : 'Observed'} ${new Date(offer.source.observedAt).toISOString()}`;
    const spec =
      offer.kind === 'furniture'
        ? `Outer size: ${offer.outerSizeMm ? `${offer.outerSizeMm.width} x ${offer.outerSizeMm.depth} x ${offer.outerSizeMm.height} mm` : 'not established'}. Assembly ${offer.assemblyIncluded ? 'included' : 'separate/unresolved'}. Required components: ${
            offer.components
              .filter((p) => p.required)
              .map(
                (p) => `${p.label} (${p.included ? 'included' : 'separate'})`,
              )
              .join(', ') || 'none recorded'
          }. Generic geometry is similar, not an identified branded SKU.`
        : offer.kind === 'floor'
          ? `${offer.system}; pack coverage ${offer.coverageMm2 / 1e6} m2; underlay ${offer.underlay}.`
          : 'packs' in offer
            ? `Per-coat yield ${offer.coverageMm2PerLitre / 1e6} m2/L; colour ${offer.colour}; sheen ${offer.sheen}.`
            : '';
    const body = [
      `${offer.variant} | ${offer.supplier} | ${offer.source.kind.toUpperCase()} ${offer.pricing === 'allowance' ? 'allowance' : 'unit price'}`,
      `${offer.market.city}, ${offer.market.country}, ${offer.market.currency}. Tax ${offer.tax.status}; rate ${offer.tax.rateBps === null ? 'not established' : `${offer.tax.rateBps / 100}%`}${offer.tax.source ? ` [T${taxEvidence.get(offer.tax.source)}]` : ''}. Delivery ${offer.deliveryIncluded ? 'included' : 'separate/unresolved'}; stock ${offer.availability}; lead time ${offer.leadTime ?? 'not established'}.`,
      spec,
      `${date}. ${offer.source.evidence ? `Evidence E${evidence.get(offer.source.evidence)}.` : 'No further price evidence recorded.'} Confirm exact product and conditions before ordering.`,
    ]
      .filter(Boolean)
      .join('\n');
    const label = `[${sourceNumbers.get(offer.id)}] ${offer.label}`;
    space(
      Math.min(
        650,
        wrap(label, 511, 12, bold).length * 17 +
          6 +
          wrap(body, 511, 9).length * 14 +
          6 +
          (offer.source.url ? 21 : 0) +
          8,
      ),
    );
    para(label, 12, bold);
    para(body, 9);
    if (offer.source.url)
      link(
        `${offer.source.kind === 'sample' ? 'Discovery link only' : 'Supplier source'} [${sourceNumbers.get(offer.id)}]: ${new URL(offer.source.url).hostname}`,
        offer.source.url,
      );
    y -= 8;
    await yieldWork();
  }
  const plan = roomWorkPlan(version.room, version.pricing, e);
  chapter('What to buy & the work ahead');
  para(
    'Shopping quantities come from this saved calculation. Pack/can rounding and surplus are included in the itemized rows; do not apply waste again.',
    10,
  );
  for (const item of plan.shopping) {
    const packText = item.packs
      .map((p) => {
        const offer = used.find(
          (o) =>
            o.id === p.id ||
            ('packs' in o && o.packs.some((pack) => pack.id === p.id)),
        );
        const can =
          offer && 'packs' in offer
            ? offer.packs.find((c) => c.id === p.id)
            : null;
        return `${p.count} x ${can ? `${can.volumeMl / 1000} L can` : (offer?.label ?? p.id)}`;
      })
      .join('; ');
    para(
      `${item.label}: ${estimateQuantityText(item.quantity)}${packText ? ` (${packText})` : ''}`,
      10,
    );
  }
  for (const [i, step] of plan.steps.entries()) {
    space(65);
    para(`${i + 1}. ${step.title}`, 12, bold);
    para(step.detail, 10);
    for (const s of step.sources) link(s.label, s.url);
    await yieldWork();
  }
  for (const [i, p] of pdf.getPages().entries()) {
    page = p;
    draw(`Planning estimate | ${version.id}`, 42, 35, 7, font, muted);
    draw(`${i + 1} / ${pdf.getPageCount()}`, 520, 35, 8, font, muted);
  }
  check();
  const bytes = await pdf.save({ useObjectStreams: false });
  check();
  if (bytes.byteLength > maxBytes) throw new DesignExportError('too-large');
  return bytes;
}
