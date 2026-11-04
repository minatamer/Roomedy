import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { PDFFont, PDFPage, PDFImage } from 'pdf-lib';
import type { RoomDocument } from '@roomedy/contracts/room';
import { roomSurface, SURFACE_TEXTURES } from '@roomedy/contracts/surfaces';
import { POLICY } from '@roomedy/contracts/policy';
import { furnitureMaterialTargets } from '@roomedy/contracts/furniture-materials';
import { findCatalogueEntry } from '@roomedy/spatial';
import { DesignExportError } from './facts';

export interface DesignPictures {
  overview: Uint8Array;
  plan: Uint8Array;
  ceilingPlan?: Uint8Array;
  views?: { image: Uint8Array; label: string }[];
}
export interface DocumentSection {
  title: string;
  page: PDFPage;
}
const paper = rgb(0.957, 0.937, 0.898),
  ink = rgb(0.263, 0.208, 0.165),
  muted = rgb(0.43, 0.35, 0.27),
  brown = rgb(0.47, 0.33, 0.24);
const mark = 'M5 27V6h12c6 0 10 4 10 10v11H5Z M15 27V17h12';
export function designPictureBytes(pictures: DesignPictures) {
  return (
    pictures.overview.byteLength +
    pictures.plan.byteLength +
    (pictures.ceilingPlan?.byteLength ?? 0) +
    (pictures.views ?? []).reduce((n, p) => n + p.image.byteLength, 0)
  );
}
/** Shared design front matter; final contents are bound to actual page identities. */
export async function appendDesignPages(
  pdf: PDFDocument,
  room: RoomDocument,
  pictures: DesignPictures,
  meta: { label: string; savedAt?: number; financial: boolean },
  fonts: { font: PDFFont; bold: PDFFont; titleFont: PDFFont },
  check: () => void,
  maxPages: number = POLICY.estimateExportPages,
) {
  if (
    (pictures.views?.length ?? 0) > 3 ||
    designPictureBytes(pictures) > POLICY.designExportPdfBytes
  )
    throw new DesignExportError('too-large');
  const { font, bold, titleFont } = fonts,
    sections: DocumentSection[] = [],
    images = new Map<Uint8Array, PDFImage>();
  const clean = (s: string) =>
    s
      .replace(/[\u2010-\u2015]/g, '-')
      .replace(/²/g, '2')
      .replace(/[‘’]/g, "'");
  const text = (
    p: PDFPage,
    s: string,
    x: number,
    y: number,
    size = 10,
    face = font,
    color = ink,
  ) => {
    try {
      p.drawText(clean(s), { x, y, size, font: face, color });
    } catch {
      throw new DesignExportError('unsupported-text');
    }
  };
  const centred = (
    p: PDFPage,
    s: string,
    y: number,
    size: number,
    face = font,
  ) => {
    while (face.widthOfTextAtSize(clean(s), size) > 511 && size > 8)
      size -= 0.5;
    if (face.widthOfTextAtSize(clean(s), size) > 511)
      throw new DesignExportError('too-large');
    text(
      p,
      s,
      (595.28 - face.widthOfTextAtSize(clean(s), size)) / 2,
      y,
      size,
      face,
    );
  };
  const page = (title?: string) => {
    check();
    if (pdf.getPageCount() >= maxPages)
      throw new DesignExportError('too-large');
    const p = pdf.addPage([595.28, 841.89]);
    p.drawRectangle({
      x: 0,
      y: 0,
      width: 595.28,
      height: 841.89,
      color: paper,
    });
    if (title) {
      p.drawSvgPath(mark, {
        x: 38,
        y: 815,
        scale: 0.6,
        borderColor: ink,
        borderWidth: 3.5,
      });
      text(p, 'roomedy.', 65, 799, 14, bold, brown);
      text(p, 'YOUR ROOM / YOUR PLAN', 420, 803, 7, bold, muted);
      text(p, title, 42, 746, 28, titleFont, brown);
    }
    return p;
  };
  const image = async (
    p: PDFPage,
    bytes: Uint8Array,
    x: number,
    top: number,
    width: number,
    height: number,
  ) => {
    check();
    let jpg = images.get(bytes);
    if (!jpg) {
      jpg = await pdf.embedJpg(bytes);
      images.set(bytes, jpg);
    }
    check();
    const scale = Math.min(width / jpg.width, height / jpg.height);
    p.drawImage(jpg, {
      x: x + (width - jpg.width * scale) / 2,
      y: top - height + (height - jpg.height * scale) / 2,
      width: jpg.width * scale,
      height: jpg.height * scale,
    });
  };
  const cover = page();
  cover.drawSvgPath(mark, {
    x: 249,
    y: 650,
    scale: 3,
    borderColor: ink,
    borderWidth: 3.5,
  });
  centred(cover, 'roomedy.', 510, 52, bold);
  centred(cover, 'Your room, made real.', 444, 34, titleFont);
  centred(
    cover,
    meta.financial ? 'ROOM DESIGN & SHOPPING PLAN' : 'ROOM DESIGN PORTFOLIO',
    383,
    9,
    bold,
  );
  centred(cover, meta.label, 133, 10);
  if (meta.savedAt !== undefined)
    centred(
      cover,
      new Date(meta.savedAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      }),
      112,
      9,
    );
  const contents = page('Contents');
  text(
    contents,
    'Explore the design, then the details that bring it together.',
    42,
    714,
    10,
    font,
    muted,
  );
  let p = page('The room, reimagined');
  sections.push({ title: 'Your room in 3D', page: p });
  await image(p, pictures.overview, 16, 709, 563, 561);
  text(p, 'A complete view of your saved arrangement.', 42, 118, 11, bold);
  text(
    p,
    `${room.furniture.length} pieces / ${room.intent.style.replace(/-/g, ' ')} / your chosen finishes`,
    42,
    96,
    9,
    font,
    muted,
  );
  p = page('A different perspective');
  const views = pictures.views ?? [];
  await image(p, views[0]?.image ?? pictures.overview, 16, 711, 563, 286);
  text(p, views[0]?.label ?? 'Room perspective', 42, 410, 9, bold, muted);
  await image(p, views[1]?.image ?? pictures.overview, 16, 388, 563, 286);
  text(
    p,
    views[1]?.label ?? 'The opposite perspective',
    42,
    86,
    9,
    bold,
    muted,
  );
  p = page('Your floor plan');
  sections.push({ title: 'Floor plan', page: p });
  await image(p, pictures.plan, 27, 707, 541, 583);
  text(
    p,
    'The same furniture, materials and orientation as your editor.',
    42,
    100,
    9,
    font,
    muted,
  );
  const axes = (['width', 'depth', 'height'] as const).flatMap((axis) =>
    room.room[axis].value === null
      ? []
      : [`${axis}: ${room.room[axis].value! / 1000} m`],
  );
  if (axes.length) text(p, axes.join(' / '), 42, 80, 9, bold);
  if (pictures.ceilingPlan) {
    p = page('Your ceiling plan');
    sections.push({ title: 'Ceiling & lighting plan', page: p });
    await image(p, pictures.ceilingPlan, 27, 707, 541, 583);
    text(
      p,
      'Lighting positions above the floor layout.',
      42,
      100,
      9,
      font,
      muted,
    );
  }
  p = page('Finishes & furniture');
  sections.push({ title: 'Finishes & furniture', page: p });
  await image(p, views[2]?.image ?? pictures.overview, 16, 711, 563, 338);
  text(p, views[2]?.label ?? 'Furniture detail', 42, 356, 10, bold);
  const floor = roomSurface(room.room, 'floor');
  const palette: { label: string; color: string; texture: string }[] = [
    {
      label: 'Floor',
      color: floor.color,
      texture: SURFACE_TEXTURES[floor.texture],
    },
  ];
  const walls = new Map<
    string,
    { names: string[]; color: string; texture: string }
  >();
  for (const wall of ['north', 'east', 'south', 'west'] as const) {
    const finish = roomSurface(room.room, wall),
      key = `${finish.color}:${finish.texture}`,
      previous = walls.get(key);
    if (previous) previous.names.push(wall);
    else
      walls.set(key, {
        names: [wall],
        color: finish.color,
        texture: SURFACE_TEXTURES[finish.texture],
      });
  }
  for (const wall of walls.values())
    palette.push({
      label:
        wall.names.length === 4
          ? 'All walls'
          : wall.names.map((n) => n[0]!.toUpperCase() + n.slice(1)).join(' / '),
      color: wall.color,
      texture: wall.texture,
    });
  for (const piece of room.furniture) {
    const category =
        findCatalogueEntry(piece.catalogueId, piece.catalogueVersion)
          ?.category ?? 'storage',
      targets = furnitureMaterialTargets(piece, category);
    const swatches =
      category === 'bed'
        ? [
            { label: 'Bed frame', ...targets.frame },
            { label: 'Bed cover', ...targets.blanket },
          ]
        : category === 'desk'
          ? [{ label: 'Desk', ...targets.frame }]
          : category === 'chair'
            ? [{ label: 'Chair fabric', ...targets.soft }]
            : [];
    for (const swatch of swatches)
      if (!palette.some((p) => p.color === swatch.color))
        palette.push({
          label: swatch.label,
          color: swatch.color,
          texture: swatch.surface,
        });
  }
  for (const [i, finish] of palette.slice(0, 6).entries()) {
    const hex = finish.color.replace('#', ''),
      x = 42 + (i % 3) * 174,
      y = 318 - Math.floor(i / 3) * 103;
    p.drawRectangle({
      x,
      y: y - 46,
      width: 155,
      height: 46,
      color: rgb(
        parseInt(hex.slice(0, 2), 16) / 255,
        parseInt(hex.slice(2, 4), 16) / 255,
        parseInt(hex.slice(4, 6), 16) / 255,
      ),
    });
    text(p, finish.label, x, y - 62, 9, bold);
    text(p, `${finish.texture} / ${finish.color}`, x, y - 78, 8, font, muted);
  }
  const finishContents = () => {
    check();
    if (sections.length > 11) throw new DesignExportError('too-large');
    const pages = pdf.getPages();
    for (const [i, entry] of sections.entries()) {
      const start = pages.indexOf(entry.page) + 1,
        next = sections[i + 1],
        end = next ? pages.indexOf(next.page) : pages.length,
        y = 657 - i * 48;
      text(contents, String(i + 1).padStart(2, '0'), 42, y, 10, bold, brown);
      text(contents, entry.title, 79, y, 13);
      const number = start === end ? String(start) : `${start}-${end}`;
      text(
        contents,
        number,
        553 - bold.widthOfTextAtSize(number, 11),
        y,
        11,
        bold,
        brown,
      );
      contents.drawLine({
        start: { x: 79, y: y - 16 },
        end: { x: 553, y: y - 16 },
        color: rgb(0.82, 0.76, 0.67),
        thickness: 0.45,
      });
      contents.node.addAnnot(
        pdf.context.register(
          pdf.context.obj({
            Type: 'Annot',
            Subtype: 'Link',
            Rect: [42, y - 12, 553, y + 18],
            Border: [0, 0, 0],
            A: { S: 'GoTo', D: [entry.page.ref, 'Fit'] },
          }),
        ),
      );
    }
  };
  return { sections, finishContents };
}

export function finishDocumentPages(
  pdf: PDFDocument,
  font: PDFFont,
  bold: PDFFont,
) {
  for (const [index, p] of pdf.getPages().entries()) {
    if (index === 0) continue;
    p.drawLine({
      start: { x: 42, y: 52 },
      end: { x: 553, y: 52 },
      color: rgb(0.82, 0.76, 0.67),
      thickness: 0.5,
    });
    p.drawText('ROOMEDY / YOUR ROOM, MADE REAL.', {
      x: 42,
      y: 35,
      size: 7,
      font: bold,
      color: muted,
    });
    const number = `${index + 1} / ${pdf.getPageCount()}`;
    p.drawText(number, {
      x: 553 - font.widthOfTextAtSize(number, 8),
      y: 35,
      size: 8,
      font,
      color: muted,
    });
  }
}
export async function designPortfolioPdf(
  room: RoomDocument,
  pictures: DesignPictures,
  check: () => void,
) {
  const pdf = await PDFDocument.create();
  pdf.setTitle('Roomedy - your room, made real');
  pdf.setAuthor('Roomedy');
  const font = await pdf.embedFont(StandardFonts.Helvetica),
    bold = await pdf.embedFont(StandardFonts.HelveticaBold),
    titleFont = await pdf.embedFont(StandardFonts.TimesRomanItalic);
  const result = await appendDesignPages(
    pdf,
    room,
    pictures,
    { label: 'Your room design', financial: false },
    { font, bold, titleFont },
    check,
    POLICY.designExportPages,
  );
  result.finishContents();
  finishDocumentPages(pdf, font, bold);
  check();
  const bytes = await pdf.save({ useObjectStreams: false });
  check();
  if (bytes.byteLength > POLICY.designExportPdfBytes)
    throw new DesignExportError('too-large');
  return bytes;
}
