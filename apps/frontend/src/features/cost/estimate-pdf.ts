import { PDFDocument, PDFString, StandardFonts, rgb } from 'pdf-lib';
import type { PDFFont, PDFPage, PDFImage } from 'pdf-lib';
import { estimateVersionSchema } from '@roomedy/contracts/project';
import type { EstimateVersion } from '@roomedy/contracts/project';
import type {
  EstimateLine,
  EstimateOffer,
  EstimateQuantity,
  ProductChoice,
} from '@roomedy/contracts/estimates';
import { imageHeader } from '@roomedy/contracts/intake';
import type { EstimateProductPicture } from './product-photos';
import { sourceUrlSchema } from '@roomedy/contracts/estimates';
import { POLICY } from '@roomedy/contracts/policy';
import { calculateRoomEstimate } from '@roomedy/spatial';
import { DesignExportError } from '../design-export/facts';
import { roomWorkPlan } from './work-plan';
import { readableEstimateNote } from './estimate-presentation';
import { currentProductChoices, choicePriceIncluded } from './product-choices';
import { quantityVisual } from './quantity-visuals';
import { listedEvidence, sourceNote, sourceScope } from './source-visuals';
export interface EstimatePictures {
  overview: Uint8Array;
  plan: Uint8Array;
  simplified: boolean;
  products?: EstimateProductPicture[];
}
const paper = rgb(0.969, 0.953, 0.925),
  ink = rgb(0.263, 0.208, 0.165),
  muted = rgb(0.43, 0.35, 0.27),
  cocoa = rgb(0.47, 0.33, 0.24),
  cream = rgb(1, 0.987, 0.96),
  oat = rgb(0.926, 0.876, 0.789),
  lineColor = rgb(0.85, 0.79, 0.69);
const cash = (minor: number, currency: string) =>
  `${currency} ${(minor / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export function estimateQuantityText(q: EstimateQuantity | null) {
  if (!q) return 'Needs review';
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
  if (currency !== 'USD') throw new DesignExportError('changed');
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
    maxBytes = port.bytes ?? POLICY.designExportPdfBytes,
    productBytes = (pictures.products ?? []).reduce(
      (sum, p) => sum + p.jpeg.byteLength,
      0,
    );
  if (
    !Number.isInteger(maxPages) ||
    maxPages < 1 ||
    maxPages > POLICY.estimateExportPages ||
    !Number.isInteger(maxBytes) ||
    maxBytes < 1 ||
    maxBytes > POLICY.designExportPdfBytes ||
    (pictures.products?.length ?? 0) > 45 ||
    productBytes > 6 * 1024 * 1024 ||
    pictures.overview.byteLength + pictures.plan.byteLength + productBytes >
      maxBytes
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
  pdf.setKeywords([
    `Estimate ID: ${version.id}`,
    `Saved: ${new Date(version.savedAt).toISOString()}`,
    `Room revision: ${version.room.roomRevision}`,
    `Calculation: ${version.calculationVersion}`,
    `Rules: ${version.rulesVersion}`,
    `Catalogue: ${version.catalogueVersion}`,
    `Representation: ${version.representationVersion}`,
    'Latin selectable financial text; raster room images; no PDF/A, tagged-PDF or RTL conformance claim',
  ]);
  const clean = (value: string) =>
    value
      .replace(/[\u2010-\u2015\u2212]/g, '-')
      .replace(/[\u00a0\u202f]/g, ' ')
      .replace(/\t/g, ' ')
      .replace(/×/g, 'x')
      .replace(/²/g, '2')
      .replace(/(\d+)\/1 (?=each\b|pack\b|can\b)/g, '$1 ')
      .replace(
        /(\d+)\/1000000 m2 net/g,
        (_match, mm2: string) =>
          `${(Number(mm2) / 1e6).toLocaleString('en-US', { maximumFractionDigits: 4 })} m2 net`,
      )
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
    sourceNumbers = new Map(used.map((o, i) => [o.id, i + 1])),
    choices = currentProductChoices(version.room, version.pricing),
    drawnChoices = new Set<string>();
  const productImages = new Map<string, PDFImage>();
  for (const picture of pictures.products ?? []) {
    check();
    const choice = choices.find(
      (c) =>
        c.key === picture.key &&
        c.url === picture.url &&
        c.imageUrl === picture.imageUrl,
    );
    if (
      !choice?.imageUrl ||
      productImages.has(choice.key) ||
      picture.jpeg.byteLength > 200 * 1024
    )
      continue;
    try {
      const header = imageHeader(picture.jpeg);
      if (
        header.type !== 'image/jpeg' ||
        Math.max(header.width, header.height) > 480
      )
        continue;
      productImages.set(choice.key, await pdf.embedJpg(picture.jpeg));
    } catch {
      /* Missing or invalid optional media keeps an honest placeholder and store link. */
    }
    check();
  }
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
  let page!: PDFPage,
    y = 0,
    section = '',
    table = false,
    chapterNumber = 0;
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
  const panel = (
    x: number,
    top: number,
    width: number,
    height: number,
    fill = cream,
    radius = 16,
  ) => {
    const r = Math.min(radius, height / 2);
    page.drawSvgPath(
      `M ${r} 0 H ${width - r} Q ${width} 0 ${width} ${r} V ${height - r} Q ${width} ${height} ${width - r} ${height} H ${r} Q 0 ${height} 0 ${height - r} V ${r} Q 0 0 ${r} 0 Z`,
      {
        x,
        y: top,
        color: fill,
        borderColor: lineColor,
        borderWidth: 0.55,
      },
    );
  };
  const right = (
    value: string,
    at: number,
    size = 11,
    face = bold,
    color = ink,
    edge = 531,
  ) => {
    draw(
      value,
      edge - face.widthOfTextAtSize(safe(value), size),
      at,
      size,
      face,
      color,
    );
  };
  const fit = (value: string, width: number, size: number, face = font) => {
    while (face.widthOfTextAtSize(safe(value), size) > width && size > 8)
      size -= 0.25;
    if (face.widthOfTextAtSize(safe(value), size) > width)
      throw new DesignExportError('too-large');
    return size;
  };
  const categoryName = (category: string) =>
    ({
      floor: 'Flooring',
      walls: 'Walls',
      furniture: 'Furniture',
      services: 'Services',
      delivery: 'Delivery',
      tax: 'Tax',
      allowance: 'Allowances',
    })[category] ?? category;
  const totalStatus =
    e.unpricedCount > 0
      ? `${e.unpricedCount} unpriced lines. The complete cost is not known; unresolved required costs are additional.`
      : e.complete
        ? 'All selected items are priced. Review quantities and checkout details.'
        : 'All selected items have a price. Measurements, coverage or product details still need review.';
  const tableHead = () => {
    draw('Item / selected scope', 42, y, 9, bold);
    right('Quantity, price & source', y, 9, bold, muted, 553);
    y -= 12;
    page.drawLine({
      start: { x: 42, y },
      end: { x: 553, y },
      color: cocoa,
      thickness: 0.5,
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
    draw('roomedy.', 42, 794, 21, bold, cocoa);
    right('YOUR ROOM / YOUR PLAN', 801, 7.5, bold, muted, 553);
    const subtitle = `${version.label} | ${e.locality.city}, ${e.locality.country} | ${currency}`;
    let subtitleSize = 9;
    while (
      font.widthOfTextAtSize(safe(subtitle), subtitleSize) > 511 &&
      subtitleSize > 7
    )
      subtitleSize -= 0.25;
    if (font.widthOfTextAtSize(safe(subtitle), subtitleSize) > 511)
      throw new DesignExportError('too-large');
    draw(subtitle, 42, 775, subtitleSize, font, muted);
    draw(
      `${String(chapterNumber).padStart(2, '0')}  /  ROOMEDY ESTIMATE`,
      42,
      745,
      8,
      bold,
      muted,
    );
    y = 714;
    draw(section, 42, y, 26, titleFont, cocoa);
    y -= 31;
    if (table) tableHead();
    port.progress?.(`Creating estimate page ${pdf.getPageCount()}...`);
  };
  const space = (height: number) => {
    if (y - height < 66) next();
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
    chapterNumber++;
    table = isTable;
    next();
  };
  const link = (label: string, url: string, x = 42, width = 511) => {
    const address = sourceUrlSchema.parse(url),
      uri = new URL(address).href;
    for (const row of wrap(label, width, 9, bold)) {
      space(17);
      draw(row, x, y, 9, bold, cocoa);
      const ref = pdf.context.register(
        pdf.context.obj({
          Type: 'Annot',
          Subtype: 'Link',
          Rect: [x, y - 2, x + bold.widthOfTextAtSize(safe(row), 9), y + 10],
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
    x = 42,
  ) => {
    check();
    const jpg = await pdf.embedJpg(bytes);
    check();
    const scale = Math.min(width / jpg.width, height / jpg.height);
    page.drawImage(jpg, {
      x: x + (width - jpg.width * scale) / 2,
      y: top - height + (height - jpg.height * scale) / 2,
      width: jpg.width * scale,
      height: jpg.height * scale,
    });
  };
  const quantityLabel = (quantity: EstimateQuantity | null) =>
    estimateQuantityText(quantity).replace(
      /([\d,.]+) (each|pack|can)$/,
      (_all, count: string, unit: string) =>
        `${count} ${unit === 'each' ? 'item' : unit}${Number(count.replaceAll(',', '')) === 1 ? '' : 's'}`,
    );
  type ProductItem = {
    label: string;
    category: string;
    amount: string;
    quantity: string;
    status: string;
    choice?: ProductChoice | undefined;
    reference: number;
  };
  const productItems: ProductItem[] = [];
  const productCard = (item: ProductItem) => {
    const x = item.choice ? 211 : 64,
      width = item.choice ? 320 : 310,
      rows = wrap(item.label, width, 12, bold),
      source = item.choice
        ? 'View product at ' + new URL(item.choice.url).hostname
        : '',
      sourceRows = source ? wrap(source, width, 9, bold).length : 0,
      height = item.choice
        ? Math.max(
            194,
            rows.length * 16 + 140 + Math.max(0, sourceRows - 1) * 15,
          )
        : Math.max(130, rows.length * 16 + 100);
    space(height);
    const top = y;
    panel(42, top, 511, height);
    draw(
      categoryName(item.category).toUpperCase(),
      64,
      top - 21,
      8,
      bold,
      muted,
    );
    if (item.choice) {
      panel(64, top - 36, 125, 125, cream, 9);
      const photo = productImages.get(item.choice.key);
      if (photo) {
        const scale = Math.min(115 / photo.width, 115 / photo.height);
        page.drawImage(photo, {
          x: 69 + (115 - photo.width * scale) / 2,
          y: top - 156 + (115 - photo.height * scale) / 2,
          width: photo.width * scale,
          height: photo.height * scale,
        });
      } else {
        draw('Photo', 99, top - 89, 11, font, muted);
        draw('unavailable', 83, top - 106, 11, font, muted);
      }
      draw(
        photo
          ? item.choice.simulation
            ? 'Illustrative product photo'
            : 'Selected product photo'
          : 'Product link is available',
        64,
        top - 175,
        7.5,
        font,
        muted,
      );
    }
    let at = top - 43;
    for (const row of rows) {
      draw(row, x, at, 12, bold);
      at -= 16;
    }
    if (item.choice) {
      draw(item.amount, x, at - 7, fit(item.amount, width, 18), font, cocoa);
      draw(item.quantity, x, at - 29, 10, bold);
      draw(item.status, x, at - 46, 9, font, muted);
      y = at - 68;
      link(source, item.choice.url, x, width);
    } else {
      right(item.amount, top - 43, fit(item.amount, 135, 12, bold), bold);
      draw(item.quantity, 64, at - 9, 10, bold);
      draw(item.status, 64, at - 27, 9, font, muted);
    }
    draw(
      `Calculation ${String(item.reference).padStart(2, '0')} / see quantity details`,
      x,
      top - height + 17,
      8,
      font,
      muted,
    );
    y = top - height - 14;
  };
  const compactProductHeight = (item: ProductItem) => {
    if (!item.choice) return null;
    const nameRows = wrap(item.label, 218.5, 11, bold).length,
      statusRows = wrap(item.status, 105.5, 8.5).length,
      quantityRows = wrap(item.quantity, 105.5, 10, bold).length,
      linkRows = wrap(
        'View product at ' + new URL(item.choice.url).hostname,
        218.5,
        9,
        bold,
      ).length;
    if (nameRows > 4 || statusRows > 3 || quantityRows > 2 || linkRows > 2)
      return null;
    return 218 + nameRows * 14 + (linkRows - 1) * 15;
  };
  const compactProduct = (
    item: ProductItem,
    x: number,
    top: number,
    height: number,
    titleLines: number,
  ) => {
    const choice = item.choice!,
      left = x + 15;
    panel(x, top, 248.5, height);
    draw(
      categoryName(item.category).toUpperCase(),
      left,
      top - 20,
      8,
      bold,
      muted,
    );
    let at = top - 42;
    for (const row of wrap(item.label, 218.5, 11, bold)) {
      draw(row, left, at, 11, bold);
      at -= 14;
    }
    const photoTop = top - 47 - titleLines * 14,
      photo = productImages.get(choice.key),
      detailX = left + 113;
    panel(left, photoTop, 100, 100, cream, 8);
    if (photo) {
      const scale = Math.min(92 / photo.width, 92 / photo.height);
      page.drawImage(photo, {
        x: left + 4 + (92 - photo.width * scale) / 2,
        y: photoTop - 96 + (92 - photo.height * scale) / 2,
        width: photo.width * scale,
        height: photo.height * scale,
      });
    } else {
      draw('Photo', left + 34, photoTop - 43, 10, font, muted);
      draw('unavailable', left + 25, photoTop - 59, 9, font, muted);
    }
    draw(
      item.amount,
      detailX,
      photoTop - 22,
      fit(item.amount, 105.5, 15),
      font,
      cocoa,
    );
    let detailY = photoTop - 44;
    for (const row of wrap(item.quantity, 105.5, 10, bold)) {
      draw(row, detailX, detailY, 10, bold);
      detailY -= 13;
    }
    detailY -= 5;
    for (const row of wrap(item.status, 105.5, 8.5)) {
      draw(row, detailX, detailY, 8.5, font, muted);
      detailY -= 12;
    }
    draw(
      photo
        ? choice.simulation
          ? 'Illustrative product photo'
          : 'Selected product photo'
        : 'Product link is available',
      left,
      photoTop - 114,
      7,
      font,
      muted,
    );
    y = photoTop - 136;
    link(
      'View product at ' + new URL(choice.url).hostname,
      choice.url,
      left,
      218.5,
    );
    draw(
      `Calculation ${String(item.reference).padStart(2, '0')} / see quantity details`,
      left,
      top - height + 15,
      7.5,
      font,
      muted,
    );
  };
  const infoCards = (
    items: { title: string; detail: string }[],
    columns = 3,
  ) => {
    const width = (511 - (columns - 1) * 12) / columns;
    for (let start = 0; start < items.length; start += columns) {
      const row = items.slice(start, start + columns),
        height = Math.max(
          ...row.map(
            (item) =>
              35 +
              wrap(item.title, width - 28, 8, bold).length * 12 +
              wrap(item.detail, width - 28, 9).length * 13,
          ),
        );
      space(height);
      const top = y;
      for (const [i, item] of row.entries()) {
        const x = 42 + i * (width + 12);
        panel(x, top, width, height);
        let at = top - 20;
        for (const text of wrap(item.title, width - 28, 8, bold)) {
          draw(text, x + 14, at, 8, bold, muted);
          at -= 12;
        }
        at -= 5;
        for (const text of wrap(item.detail, width - 28, 9)) {
          draw(text, x + 14, at, 9, font, muted);
          at -= 13;
        }
      }
      y = top - height - 12;
    }
  };
  chapter('Your room, made real.');
  para('A shopping plan for the room you imagined.', 11, font, muted);
  panel(42, y + 3, 511, 288);
  await image(pictures.overview, y - 7, 487, 268, 54);
  y -= 306;
  const coverTop = y;
  panel(42, coverTop, 511, 158, oat);
  draw(
    e.complete ? 'Estimated selected-scope total' : 'Known costs so far',
    64,
    coverTop - 27,
    9,
    bold,
    muted,
  );
  draw(
    cash(e.knownTotalMinor, currency),
    64,
    coverTop - 76,
    fit(cash(e.knownTotalMinor, currency), 467, 35),
    font,
    cocoa,
  );
  y = coverTop - 101;
  para(totalStatus, 10, font, ink, 467, 64);
  y = coverTop - 178;
  para(
    `Saved ${new Date(version.savedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}  /  ${version.label}`,
    9,
    bold,
    muted,
  );
  para(
    'Selected products, whole-room quantities and recorded prices. Start with the room plan, then review your choices and quantities.',
    10,
    font,
    muted,
  );
  if (
    used.some((offer) => offer.source.kind === 'sample') ||
    choices.some((choice) => choice.simulation)
  )
    para(
      'Sample amounts are authored examples, not live store quotes.',
      9,
      font,
      muted,
    );
  chapter('The selected room & plan');
  panel(42, y + 3, 511, 365);
  await image(pictures.plan, y - 8, 487, 343, 54);
  y -= 383;
  const measure = (axis: 'width' | 'depth' | 'height') => {
    const m = version.room.room[axis];
    return m.value === null
      ? 'Not measured'
      : `${(m.value / 1000).toLocaleString('en-US', { maximumFractionDigits: 3 })} m`;
  };
  const dimensionsTop = y;
  for (const [i, axis] of (['width', 'depth', 'height'] as const).entries()) {
    const x = 42 + i * 174;
    panel(x, dimensionsTop, 163, 78);
    draw(axis.toUpperCase(), x + 15, dimensionsTop - 20, 8, bold, muted);
    draw(measure(axis), x + 15, dimensionsTop - 43, 17, font);
    draw(
      version.room.room[axis].value === null
        ? 'Needs your measurement'
        : version.room.room[axis].status,
      x + 15,
      dimensionsTop - 62,
      8,
      font,
      muted,
    );
  }
  y = dimensionsTop - 101;
  infoCards([
    {
      title: 'PLAN NUMBERS',
      detail: 'Match numbered furniture to the selected product cards.',
    },
    {
      title: '~ ESTIMATED',
      detail: 'Estimated dimensions need checking before ordering.',
    },
    {
      title: pictures.simplified
        ? 'SIMPLIFIED / UNKNOWN'
        : 'UNKNOWN DIMENSIONS',
      detail: pictures.simplified
        ? 'Simplified meshes and unknown sizes use illustrative bounds. Check physical size and fit.'
        : 'Illustrative bounds only. The picture does not confirm measurement or fit.',
    },
  ]);
  chapter('Cost summary');
  const summaryTop = y;
  panel(42, summaryTop, 511, 126, oat);
  draw('YOUR SHOPPING ESTIMATE', 64, summaryTop - 26, 9, bold, muted);
  draw(
    cash(e.knownTotalMinor, currency),
    64,
    summaryTop - 73,
    fit(cash(e.knownTotalMinor, currency), 467, 34),
    font,
    cocoa,
  );
  y = summaryTop - 96;
  para(totalStatus, 9.5, font, ink, 467, 64);
  y = summaryTop - 144;
  let categoryIndex = 0;
  const categoryTop = y;
  for (const category of [
    'furniture',
    'floor',
    'walls',
    'services',
    'delivery',
    'tax',
    'allowance',
  ] as const) {
    const lines = e.lines.filter((l) => l.category === category);
    if (!lines.length) continue;
    const x = 42 + (categoryIndex % 3) * 174,
      top = categoryTop - Math.floor(categoryIndex / 3) * 103,
      amount = lines.reduce((sum, l) => sum + (l.amountMinor ?? 0), 0),
      unknown = lines.filter((l) => l.amountMinor === null).length;
    panel(x, top, 163, 90);
    draw(categoryName(category), x + 15, top - 23, 11, bold);
    draw(
      cash(amount, currency),
      x + 15,
      top - 48,
      fit(cash(amount, currency), 133, 16),
      font,
      cocoa,
    );
    draw(
      unknown ? `${unknown} still to price` : 'Selected-scope subtotal',
      x + 15,
      top - 68,
      8,
      font,
      muted,
    );
    const barWidth = Math.max(
      0,
      Math.min(133, e.knownTotalMinor ? (amount / e.knownTotalMinor) * 133 : 0),
    );
    page.drawRectangle({
      x: x + 15,
      y: top - 78,
      width: 133,
      height: 3,
      color: oat,
    });
    if (barWidth)
      page.drawRectangle({
        x: x + 15,
        y: top - 78,
        width: barWidth,
        height: 3,
        color: cocoa,
      });
    categoryIndex++;
  }
  y = categoryTop - Math.ceil(categoryIndex / 3) * 103 - 6;
  space(100);
  const reconciliationTop = y;
  panel(42, reconciliationTop, 511, 88);
  draw('HOW THE TOTAL IS BUILT', 57, reconciliationTop - 20, 8, bold, muted);
  for (const [i, item] of [
    ['Priced subtotal', e.pricedSubtotalMinor],
    ['Allowances', e.allowanceMinor],
    ['Added tax', e.taxMinor],
  ].entries()) {
    const x = 57 + i * 165;
    draw(String(item[0]), x, reconciliationTop - 39, 9, font, muted);
    const value = cash(Number(item[1]), currency);
    draw(value, x, reconciliationTop - 58, fit(value, 145, 14), font, cocoa);
  }
  draw(
    'Included in the total above. Tax-inclusive prices are not taxed twice.',
    57,
    reconciliationTop - 76,
    8,
    font,
    muted,
  );
  y = reconciliationTop - 101;
  if (version.pricing.budgetMinor !== null)
    infoCards(
      [
        {
          title: 'PLANNING BUDGET',
          detail: `${cash(version.pricing.budgetMinor, currency)} / ${e.complete ? 'Compare with the selected-scope total; confirm allowances.' : 'Required unpriced costs prevent a verified budget result.'}`,
        },
      ],
      1,
    );
  if (version.pricing.settings.demoScope === 'materials') {
    const productChecks = [
      version.pricing.settings.furniture.some((item) => item.mode === 'buy')
        ? 'Furniture: size, finish & components.'
        : '',
      version.pricing.settings.floor.enabled
        ? 'Flooring: material & pack coverage.'
        : '',
      version.pricing.settings.walls.some((wall) => wall.enabled)
        ? 'Paint: colour, sheen & coats.'
        : '',
    ]
      .filter(Boolean)
      .join(' ');
    const checks: [string, string][] = [
      [
        'Room & quantities',
        'Confirm measurements and fit. Keep retained pieces. Packs/cans are rounded up; do not add waste again.',
      ],
      [
        'Product checks',
        productChecks || 'Review the selected scope before ordering.',
      ],
      [
        'At checkout',
        `${e.unpricedCount ? 'Resolve unpriced items first. ' : ''}Confirm stock, tax, delivery and final store prices. No purchase or booking has been made.`,
      ],
    ];
    const heights = checks.map(([, text]) =>
        Math.max(38, wrap(text, 347, 9).length * 13 + 14),
      ),
      height = 38 + heights.reduce((sum, h) => sum + h, 0);
    space(height);
    const top = y;
    panel(42, top, 511, height);
    draw('BEFORE YOU ORDER', 57, top - 22, 9, bold, muted);
    let at = top - 43;
    for (const [i, [label, text]] of checks.entries()) {
      page.drawCircle({ x: 62, y: at - 3, size: 8, color: oat });
      draw(String(i + 1), 59.5, at - 6, 7, bold, cocoa);
      draw(label, 78, at - 6, 9, bold);
      let textY = at - 6;
      for (const row of wrap(text, 347, 9)) {
        draw(row, 191, textY, 9, font, muted);
        textY -= 13;
      }
      at -= heights[i]!;
    }
    y = top - height - 12;
  } else {
    infoCards(
      [
        {
          title: 'WORK & ORDERING',
          detail:
            'Use the work plan at the end to check instructions, site conditions and booking. This saved plan makes no purchase or booking.',
        },
      ],
      1,
    );
  }

  chapter(
    choices.length ? 'Your selected products' : 'Itemized estimate',
    true,
  );
  if (choices.length)
    para(
      'Itemized estimate / only your chosen products. Comparison alternatives are not included.',
      9,
      font,
      muted,
    );
  const displayLines = [...e.lines].sort((a, b) => {
    const order = [
      'furniture',
      'floor',
      'walls',
      'services',
      'delivery',
      'tax',
      'allowance',
    ];
    return order.indexOf(a.category) - order.indexOf(b.category);
  });
  const calculationDetails: {
    label: string;
    groups: [string, string][];
    line: EstimateLine | null;
  }[] = [];
  for (const [index, line] of displayLines.entries()) {
    check();
    const furniture = line.targets.find((t) => t.kind === 'furniture'),
      number =
        furniture?.kind === 'furniture'
          ? version.room.furniture.findIndex((p) => p.id === furniture.id) + 1
          : 0;
    const choice = choices.find(
      (choice) =>
        choice.key === line.productKey ||
        (!!choice.offerId && line.offerIds.includes(choice.offerId)) ||
        line.targets.some((target) =>
          target.kind === 'furniture'
            ? target.id === choice.key
            : target.kind === 'surface' &&
              `surface:${target.surface}` === choice.key,
        ),
    );
    if (choice) drawnChoices.add(choice.key);
    const label = `${number ? `${number}. ` : ''}${choice?.label ?? line.label}`;
    const amount =
      line.amountMinor === null ? 'UNPRICED' : cash(line.amountMinor, currency);
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
    const priceDetail = [
      choice
        ? choicePriceIncluded(choice, version.pricing, e)
          ? 'Selected product - price included in the cost breakdown.'
          : 'Selected product - price or fit needs review; unresolved cost remains unpriced.'
        : '',
      choice?.quotedPrice && !choicePriceIncluded(choice, version.pricing, e)
        ? `${choice.simulation ? 'Illustrative example' : 'Listed reference'}: ${choice.quotedPrice}. Not included in the subtotal.`
        : '',
      line.category !== 'tax' && offers.length
        ? `Unit rates / pack mix: ${offers
            .map((o) => rate(o, line))
            .filter(Boolean)
            .join('; ')}`
        : '',
      offers.length
        ? `Sources: ${offers.map((o) => `[${sourceNumbers.get(o.id)}] ${o.label}`).join('; ')}`
        : '',
    ]
      .filter(Boolean)
      .join('\n');
    const checks = [
      ...notes
        .filter((note) => !sharedNotes.has(note))
        .map(readableEstimateNote),
      notes.some((note) => sharedNotes.has(note))
        ? `Shared notes: ${notes
            .filter((note) => sharedNotes.has(note))
            .map((note) => `A${sharedNotes.get(note)}`)
            .join(', ')}`
        : '',
    ]
      .filter(Boolean)
      .join('\n');
    calculationDetails.push({
      label: choice?.label ?? line.label,
      line,
      groups: [
        ['Room & purchased quantities', sizeText],
        ['Calculation', rule],
        ['Price & source', priceDetail],
        ['Review notes', checks],
      ].filter(([, text]) => !!text) as [string, string][],
    });
    productItems.push({
      label,
      category: line.category,
      amount,
      quantity: quantityLabel(line.quantity),
      status: `${line.pricing === 'listed' ? 'Listed price' : line.pricing} | ${line.quantityStatus} quantities`,
      choice,
      reference: calculationDetails.length,
    });
    if (index % 8 === 0) await yieldWork();
  }
  if (choices.some((choice) => !drawnChoices.has(choice.key))) {
    for (const choice of choices.filter(
      (choice) => !drawnChoices.has(choice.key),
    )) {
      calculationDetails.push({
        label: choice.label,
        line: null,
        groups: [
          [
            'Price & source',
            `Selected product - price or fit needs review; unresolved cost remains unpriced.${choice.quotedPrice ? ` ${choice.simulation ? 'Illustrative example' : 'Listed reference'}: ${choice.quotedPrice}. Not included in the subtotal.` : ''}`,
          ],
        ],
      });
      productItems.push({
        label: choice.label,
        category:
          choice.key === 'surface:floor'
            ? 'floor'
            : choice.key.startsWith('surface:')
              ? 'walls'
              : 'furniture',
        amount: 'UNPRICED',
        quantity: 'Quantity needs review',
        status: 'Price or fit needs review',
        choice,
        reference: calculationDetails.length,
      });
      await yieldWork();
    }
  }
  for (let i = 0; i < productItems.length;) {
    const first = productItems[i]!,
      second = productItems[i + 1],
      firstHeight = compactProductHeight(first),
      secondHeight = second ? compactProductHeight(second) : null;
    if (firstHeight !== null && secondHeight !== null) {
      const height = Math.max(firstHeight, secondHeight),
        titleLines = Math.max(
          wrap(first.label, 218.5, 11, bold).length,
          wrap(second!.label, 218.5, 11, bold).length,
        );
      space(height);
      const top = y;
      compactProduct(first, 42, top, height, titleLines);
      compactProduct(second!, 304.5, top, height, titleLines);
      y = top - height - 14;
      i += 2;
    } else {
      productCard(first);
      i++;
    }
    await yieldWork();
  }
  chapter('Quantity details');
  para(
    'Whole-unit quantities. Check measurements and product coverage before ordering.',
    9,
    font,
    muted,
  );
  const arrow = (x: number, top: number) => {
    page.drawLine({
      start: { x, y: top },
      end: { x: x + 9, y: top },
      color: cocoa,
      thickness: 0.8,
    });
    page.drawLine({
      start: { x: x + 6, y: top + 3 },
      end: { x: x + 9, y: top },
      color: cocoa,
      thickness: 0.8,
    });
    page.drawLine({
      start: { x: x + 6, y: top - 3 },
      end: { x: x + 9, y: top },
      color: cocoa,
      thickness: 0.8,
    });
  };
  for (const [index, detail] of calculationDetails.entries()) {
    const line = detail.line,
      visual = line ? quantityVisual(line, version.pricing) : null,
      amount =
        line?.amountMinor === null || !line
          ? 'UNPRICED'
          : cash(line.amountMinor, currency),
      label = `${String(index + 1).padStart(2, '0')} / ${detail.label}`;
    if (!line || visual?.kind === 'other') {
      const rows = wrap(label, 308, 10, bold),
        height = Math.max(58, rows.length * 13 + 34);
      space(height);
      const top = y;
      panel(42, top, 511, height);
      let at = top - 21;
      for (const row of rows) {
        draw(row, 64, at, 10, bold);
        at -= 13;
      }
      const count = quantityLabel(line?.quantity ?? null),
        equation =
          visual?.unitPriceMinor !== null &&
          visual?.unitPriceMinor !== undefined
            ? `${count} x ${cash(visual.unitPriceMinor, currency)}`
            : count;
      draw(equation, 64, at - 4, fit(equation, 330, 9), font, muted);
      right(amount, top - 30, fit(amount, 135, 14), font, cocoa);
      y = top - height - 10;
      continue;
    }
    const titleRows = wrap(detail.label, 430, 10, bold),
      facts = [
        ...visual!.facts,
        line.purchased
          ? `Purchased ${estimateQuantityText(line.purchased)}`
          : '',
      ]
        .filter(Boolean)
        .join(' | '),
      factRows = wrap(facts, 467, 8.5),
      height =
        177 +
        (titleRows.length - 1) * 13 +
        Math.max(0, factRows.length - 1) * 12;
    space(height);
    const top = y;
    panel(42, top, 511, height);
    draw(
      `${String(index + 1).padStart(2, '0')} / ${visual!.kind === 'floor' ? 'FLOORING' : 'WALL PAINT'}`,
      64,
      top - 19,
      8,
      bold,
      muted,
    );
    right(visual!.status, top - 19, 8, font, muted);
    let at = top - 37;
    for (const row of titleRows) {
      draw(row, 64, at, 10, bold);
      at -= 13;
    }
    const iconX = 508,
      iconY = top - 32;
    if (visual!.kind === 'paint') {
      const walls = visual!.walls;
      for (const [wall, a, b] of [
        ['north', [iconX - 12, iconY], [iconX + 12, iconY]],
        ['east', [iconX + 12, iconY], [iconX + 12, iconY - 18]],
        ['south', [iconX - 12, iconY - 18], [iconX + 12, iconY - 18]],
        ['west', [iconX - 12, iconY], [iconX - 12, iconY - 18]],
      ] as const)
        page.drawLine({
          start: { x: a[0], y: a[1] },
          end: { x: b[0], y: b[1] },
          color: walls.includes(wall) ? cocoa : lineColor,
          thickness: walls.includes(wall) ? 2.5 : 0.7,
        });
    } else {
      page.drawRectangle({
        x: iconX - 12,
        y: iconY - 18,
        width: 24,
        height: 18,
        borderColor: cocoa,
        borderWidth: 0.8,
        color: oat,
      });
      for (let offset = 1; offset < 4; offset++)
        page.drawLine({
          start: { x: iconX - 12 + offset * 6, y: iconY },
          end: { x: iconX - 12 + offset * 6, y: iconY - 18 },
          color: cocoa,
          thickness: 0.45,
        });
    }
    const tileTop = top - 55 - (titleRows.length - 1) * 13;
    for (const [i, tile] of visual!.tiles.entries()) {
      const x = 64 + i * 161;
      panel(x, tileTop, 145, 62, i === 2 ? oat : paper, 9);
      draw(tile.label.toUpperCase(), x + 11, tileTop - 16, 7.5, bold, muted);
      const value = quantityLabel(tile.quantity);
      draw(
        value,
        x + 11,
        tileTop - 44,
        fit(value, 123, i === 2 ? 20 : 18),
        i === 2 ? bold : font,
        i === 2 ? cocoa : ink,
      );
      if (i < 2) arrow(x + 148, tileTop - 32);
    }
    const count = quantityLabel(line.quantity),
      equation =
        visual!.unitPriceMinor !== null
          ? `${count} x ${cash(visual!.unitPriceMinor, currency)} = ${amount}`
          : `${count} | Recorded total: ${amount}`;
    draw(equation, 64, tileTop - 82, fit(equation, 467, 11), bold, cocoa);
    at = tileTop - 101;
    for (const row of factRows) {
      draw(row, 64, at, 8.5, font, muted);
      at -= 12;
    }
    y = top - height - 12;
    await yieldWork();
  }
  chapter('Products, rates & source evidence');
  const savedDate = new Date(version.savedAt).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }),
    scoped = sourceScope(e.assumptions),
    extraOffers = used.filter((o) => !choices.some((c) => c.offerId === o.id)),
    sourceCount = choices.length + extraOffers.length,
    bases = new Set([
      ...choices.map((c) => {
        const offer = used.find((o) => o.id === c.offerId),
          selected = version.pricing.settings.selectedPrices?.some(
            (p) => p.key === c.key && p.scope === c.scope && p.url === c.url,
          );
        return c.simulation || offer?.source.kind === 'sample'
          ? 'Example'
          : offer?.source.kind === 'manual'
            ? 'Entered'
            : offer
              ? 'Quoted'
              : c.listingPrice || selected
                ? 'Listed'
                : 'Reference';
      }),
      ...extraOffers.map((o) =>
        o.source.kind === 'sample'
          ? 'Example'
          : o.source.kind === 'manual'
            ? 'Entered'
            : 'Quoted',
      ),
    ]),
    basis =
      bases.size === 1 ? [...bases][0]! : bases.size ? 'Mixed' : 'Not recorded',
    top = y;
  for (const [i, [label, value]] of [
    ['SOURCES', `${sourceCount} records`],
    ['PRICE BASIS', basis],
    [
      'STILL TO PRICE',
      e.unpricedCount ? `${e.unpricedCount} items` : 'All priced',
    ],
  ].entries()) {
    const x = 42 + i * 174;
    panel(x, top, 163, 52, i === 2 ? oat : cream, 11);
    draw(label!, x + 13, top - 17, 7.5, bold, muted);
    draw(value!, x + 13, top - 39, fit(value!, 137, 17), font, cocoa);
  }
  y = top - 69;
  const included = [...new Set(e.lines.map((l) => categoryName(l.category)))],
    excluded = scoped.exclusions.length
      ? scoped.exclusions
      : ['Unselected work is outside the scope'],
    scopeHeight = Math.max(
      91,
      36 + Math.max(included.length, excluded.length) * 14,
    ),
    scopeTop = y;
  for (const [i, [heading, items]] of [
    ['INCLUDED', included.length ? included : ['No purchase lines selected']],
    ['OUTSIDE THIS ESTIMATE', excluded],
  ].entries()) {
    const x = 42 + i * 261;
    panel(x, scopeTop, 250, scopeHeight, cream, 12);
    draw(heading as string, x + 15, scopeTop - 21, 8, bold, muted);
    let at = scopeTop - 41;
    for (const item of items as string[]) {
      if (i === 0) {
        page.drawLine({
          start: { x: x + 15, y: at + 2 },
          end: { x: x + 18, y: at - 1 },
          color: cocoa,
          thickness: 1,
        });
        page.drawLine({
          start: { x: x + 18, y: at - 1 },
          end: { x: x + 23, y: at + 5 },
          color: cocoa,
          thickness: 1,
        });
      } else
        page.drawLine({
          start: { x: x + 15, y: at + 2 },
          end: { x: x + 23, y: at + 2 },
          color: muted,
          thickness: 1,
        });
      draw(item, x + 31, at, fit(item, 204, 9), font);
      at -= 14;
    }
  }
  y = scopeTop - scopeHeight - 12;
  const checkTop = y;
  panel(42, checkTop, 511, 42, paper, 10);
  draw(
    'CHECK BEFORE ORDERING / PLANNING ONLY',
    56,
    checkTop - 15,
    8,
    bold,
    cocoa,
  );
  draw(
    'Fit, measurements & coverage  /  Stock, tax & delivery  /  Selected finish & work scope',
    56,
    checkTop - 31,
    8.5,
    font,
    muted,
  );
  y = checkTop - 55;
  para(
    `Saved with estimate ${savedDate}${scoped.oneRoom ? ' / one existing room' : ''}. ${scoped.checks.some((c) => c.title === 'Product & design') ? 'Room rendering stays as designed.' : ''}`,
    8.5,
    font,
    muted,
  );

  const recordCard = (
    title: string,
    fields: [string, string][],
    urls: { label: string; url: string }[] = [],
  ) => {
    const titleRows = wrap(title, 467, 11, bold),
      header = titleRows.length * 15 + 26,
      rows = fields.flatMap(([name, value]) => {
        const labels = wrap(name.toUpperCase(), 93, 7.5, bold),
          values = wrap(value, 360, 9);
        return Array.from(
          { length: Math.max(labels.length, values.length) },
          (_, i) => ({
            name: labels[i] ?? '',
            group: labels[0] ?? '',
            text: values[i] ?? '',
          }),
        );
      }),
      linkHeight = urls.reduce(
        (sum, url) => sum + wrap(url.label, 467, 9, bold).length * 15 + 4,
        0,
      ),
      full = header + rows.length * 13 + linkHeight + 18;
    space(Math.min(full, 560));
    let offset = 0;
    do {
      const capacity = Math.max(
          1,
          Math.floor((y - 66 - header - linkHeight - 18) / 13),
        ),
        fragment = rows.slice(offset, offset + capacity),
        last = offset + fragment.length >= rows.length,
        height = header + fragment.length * 13 + (last ? linkHeight : 0) + 18,
        cardTop = y;
      panel(42, cardTop, 511, height);
      let at = cardTop - 22;
      for (const text of titleRows) {
        draw(text, 64, at, 11, bold);
        at -= 15;
      }
      at = cardTop - header;
      for (const [i, row] of fragment.entries()) {
        const name = row.name || (i === 0 && offset ? row.group : '');
        if (name) draw(name.toUpperCase(), 64, at, 7.5, bold, muted);
        draw(row.text, 171, at, 9, font);
        at -= 13;
      }
      y = at - 3;
      if (last) for (const url of urls) link(url.label, url.url, 64, 467);
      y = cardTop - height - 10;
      offset += fragment.length;
      if (!last) next();
    } while (offset < rows.length);
  };
  const listingCard = (choice: ProductChoice, index: number) => {
    const rows = wrap(choice.label, 305, 10, bold),
      host = new URL(choice.url).hostname,
      selected = version.pricing.settings.selectedPrices?.find(
        (p) =>
          p.key === choice.key &&
          p.scope === choice.scope &&
          p.url === choice.url,
      ),
      price = selected
        ? `${cash(selected.unitPriceMinor, currency)} / ${selected.unit}`
        : choice.listingPrice?.currency === 'USD'
          ? `${cash(choice.listingPrice.priceMinor, currency)} / ${choice.listingPrice.unit}`
          : 'Price needs review',
      linkLabel = 'Store page: ' + host,
      linkRows = wrap(linkLabel, 435, 9, bold).length,
      height = 47 + rows.length * 13 + (linkRows - 1) * 15;
    space(height);
    const cardTop = y;
    panel(42, cardTop, 511, height);
    page.drawCircle({ x: 66, y: cardTop - 21, size: 10, color: oat });
    draw(String(index + 1), 63, cardTop - 24, 8, bold, cocoa);
    let at = cardTop - 19;
    for (const text of rows) {
      draw(text, 91, at, 10, bold);
      at -= 13;
    }
    right(price, cardTop - 23, fit(price, 126, 11), font, cocoa);
    draw(
      `${choice.simulation ? 'Example listing' : choice.listingPrice || selected ? 'Listed reference' : 'Selected reference'} / ${choicePriceIncluded(choice, version.pricing, e) ? 'Included in subtotal' : 'Review price or fit'}`,
      91,
      at + 2,
      8,
      font,
      muted,
    );
    y = at - 13;
    link(linkLabel, choice.url, 91, 435);
    y = cardTop - height - 8;
  };
  for (const [index, choice] of choices.entries()) {
    if (choice.offerId && used.some((o) => o.id === choice.offerId)) continue;
    listingCard(choice, index);
    await yieldWork();
  }
  const routine = calculationDetails.map((detail) =>
      detail.line
        ? listedEvidence(detail.line, version.pricing)
        : { summary: false, walls: [] },
    ),
    wallGroups = routine.flatMap((record, index) =>
      record.summary && record.walls.length
        ? [{ index, walls: record.walls }]
        : [],
    );
  for (const group of wallGroups) {
    const cell = 467 / group.walls.length;
    space(60);
    const at = y;
    panel(42, at, 511, 60, paper, 10);
    draw(
      `PAINT SCOPE / ${String(group.index + 1).padStart(2, '0')} / NET AFTER OPENINGS`,
      64,
      at - 17,
      7.5,
      bold,
      muted,
    );
    for (const [i, wall] of group.walls.entries()) {
      const x = 64 + i * cell;
      draw(wall.wall.toUpperCase(), x, at - 33, 7.5, bold, muted);
      draw(
        `${wall.area} m2 / ${wall.coats} coats`,
        x,
        at - 48,
        fit(`${wall.area} m2 / ${wall.coats} coats`, cell - 8, 9),
        font,
      );
    }
    y = at - 70;
  }
  const retained = calculationDetails.flatMap((detail, index) =>
    routine[index]!.summary ? [] : [{ detail, index }],
  );
  const knownShared = [...sharedNotes].filter(
    ([text]) => sourceNote(text).known,
  );
  if (retained.length && knownShared.length)
    recordCard(
      'Review key',
      knownShared.map(([text, id]) => {
        const n = sourceNote(text);
        return [`A${id} / ${n.title}`, n.detail] as [string, string];
      }),
    );
  for (const [text, id] of sharedNotes)
    if (!sourceNote(text).known)
      recordCard(`A${id} / Review note`, [
        ['Note', readableEstimateNote(text)],
      ]);
  for (const [text, id] of evidence)
    recordCard(`E${id} / Recorded evidence`, [['Evidence', text]]);
  for (const [text, id] of taxEvidence)
    recordCard(`T${id} / Tax evidence`, [['Recorded', text]]);
  for (const [index, text] of scoped.other.entries())
    recordCard(`Scope note ${index + 1}`, [['Scope', text]]);
  for (const { detail, index } of retained) {
    const fields = detail.groups
      .map(
        ([label, text]) =>
          [
            label,
            text
              .split('\n')
              .filter(
                (row) =>
                  row !==
                  'Selected product - price included in the cost breakdown.',
              )
              .join('\n'),
          ] as [string, string],
      )
      .filter(([, text]) => !!text);
    recordCard(
      `Calculation ${String(index + 1).padStart(2, '0')} / ${detail.label}`,
      fields,
    );
    await yieldWork();
  }
  for (const offer of used) {
    const date =
        offer.source.observedAt === null
          ? 'Date not recorded'
          : `${offer.source.kind === 'manual' ? 'Entered' : offer.source.kind === 'sample' ? 'Example timestamp' : 'Observed'} ${new Date(offer.source.observedAt).toISOString()}`,
      line = e.lines.find((l) => l.offerIds.includes(offer.id))!,
      spec =
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
              : offer.kind === 'service'
                ? offer.includedWork
                : '';
    const fields: [string, string][] = [
      [
        'Record',
        `${offer.source.kind === 'sample' ? 'Example' : offer.source.kind === 'manual' ? 'Entered' : 'Sourced'} / ${offer.pricing === 'allowance' ? 'Allowance' : 'Unit price'}`,
      ],
      [
        'Rate',
        rate(offer, line) ||
          ('packs' in offer
            ? offer.packs
                .map(
                  (pack) =>
                    `${pack.volumeMl / 1000} L: ${cash(pack.priceMinor, offer.market.currency)}/can`,
                )
                .join('; ')
            : ''),
      ],
      ['Variant', offer.variant],
      [
        'Store',
        `${offer.supplier} / ${offer.market.city}, ${offer.market.country}, ${offer.market.currency}`,
      ],
      [
        'Tax',
        `${offer.tax.status}${offer.tax.rateBps === null ? ' / rate not recorded' : ` / ${offer.tax.rateBps / 100}%`}${offer.tax.source ? ` / T${taxEvidence.get(offer.tax.source)}` : ''}`,
      ],
      [
        'Delivery',
        offer.deliveryIncluded ? 'Included' : 'Separate / unresolved',
      ],
      [
        'Stock',
        `${offer.availability} / lead time ${offer.leadTime ?? 'not recorded'}`,
      ],
      ['Specifications', spec],
      ['Date', date],
      [
        'Evidence',
        offer.source.evidence
          ? `E${evidence.get(offer.source.evidence)}`
          : 'No further evidence recorded',
      ],
    ];
    if (offer.fx)
      fields.push([
        'USD reference',
        `USD reference equivalent; rate dated ${offer.fx.date}, checked ${new Date(offer.fx.observedAt).toISOString()}. Merchant checkout rates and fees may differ. Original monetary inputs and rate are frozen in the editable project. Quantities convert before line rounding; rounded unit prices may not multiply to the exact total.`,
      ]);
    const urls: { label: string; url: string }[] = [];
    if (offer.source.url)
      urls.push({
        label: `${offer.source.kind === 'sample' ? 'Discovery link only' : 'Supplier source'} [${sourceNumbers.get(offer.id)}]: ${new URL(offer.source.url).hostname}`,
        url: offer.source.url,
      });
    if (offer.fx)
      urls.push({
        label: `Dated USD reference rate: ${offer.fx.date}`,
        url: offer.fx.url,
      });
    recordCard(
      `[${sourceNumbers.get(offer.id)}] ${offer.label}`,
      fields.filter(([, text]) => !!text),
      urls,
    );
    await yieldWork();
  }
  if (version.pricing.settings.demoScope !== 'materials') {
    const plan = roomWorkPlan(version.room, version.pricing, e);
    chapter('What to buy & the work ahead');
    infoCards(
      [
        {
          title: 'YOUR SHOPPING LIST',
          detail:
            'Use the selected product cards and Quantity details. Whole packs/cans and surplus are already included; do not add waste again.',
        },
      ],
      1,
    );
    for (const [i, step] of plan.steps.entries()) {
      const title =
        choices.length && !e.unpricedCount
          ? step.title.replace(/^Choose your /, 'Review your ')
          : step.title;
      let detail = step.detail;
      if (!e.unpricedCount)
        detail = detail.replace(
          /0 unresolved (?:estimate )?lines still need (?:a price or quantity|review)\./g,
          'All selected lines have a price; review quantities and product details.',
        );
      if (
        !used.some((offer) => offer.source.kind === 'sample') &&
        !choices.some((choice) => choice.simulation)
      )
        detail = detail.replace(
          'Sample amounts need supplier confirmation.',
          'Confirm listed prices with the supplier.',
        );
      recordCard(
        `${i + 1} / ${title}`,
        detail
          .split(/(?<=[.!?])\s+(?=[A-Z])/)
          .map((text, index) => [`Check ${index + 1}`, text]),
        step.sources.map((source) => ({
          label: source.label,
          url: source.url,
        })),
      );
      await yieldWork();
    }
  }
  for (const [i, p] of pdf.getPages().entries()) {
    page = p;
    page.drawLine({
      start: { x: 42, y: 52 },
      end: { x: 553, y: 52 },
      color: lineColor,
      thickness: 0.5,
    });
    draw('ROOMEDY  /  A PLAN FOR YOUR ROOM', 42, 35, 7, bold, muted);
    draw(`${i + 1} / ${pdf.getPageCount()}`, 520, 35, 8, font, muted);
  }
  check();
  const bytes = await pdf.save({ useObjectStreams: false });
  check();
  if (bytes.byteLength > maxBytes) throw new DesignExportError('too-large');
  return bytes;
}
