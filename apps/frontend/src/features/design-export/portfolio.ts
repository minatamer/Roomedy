import { POLICY } from '@roomedy/contracts/policy';
import type { Project } from '@roomedy/contracts/project';
import type { RoomDocument } from '@roomedy/contracts/room';
import { roomSurface, SURFACE_TEXTURES } from '@roomedy/contracts/surfaces';
import type { SurfaceTarget } from '@roomedy/contracts/surfaces';
import {
  footprint,
  findCatalogueEntry,
  furnitureByElevation,
  projectedLabelVisible,
} from '@roomedy/spatial';
import { FINISH_PALETTE } from '../catalogue/finishes';
import { featureBox, displayRoom } from '../room-view/adapter';
import { DesignExportError, measurement, portfolioFacts } from './facts';
import type { RoomPicture } from './capture';
type Context = CanvasRenderingContext2D;
const palette = {
  oat: '#f4efe5',
  paper: '#fffaf2',
  ink: '#43352a',
  walnut: '#78553d',
  clay: '#a96748',
  muted: '#6c5845',
  line: '#ddd2c1',
};
export interface PortfolioPort {
  canvas?: () => HTMLCanvasElement;
  encode?: (canvas: HTMLCanvasElement) => Promise<Uint8Array>;
  check?: () => void;
  progress?: (text: string) => void;
  simpleShapes?: boolean;
}
function text(
  c: Context,
  value: string,
  x: number,
  y: number,
  size = 12,
  color = palette.ink,
  font = 'Arial',
  style = '',
) {
  c.font = `${style} ${size}px ${font}`;
  c.fillStyle = color;
  c.fillText(value, x, y);
}
function wrap(
  c: Context,
  value: string,
  x: number,
  y: number,
  width: number,
  size = 12,
  line = 19,
  max = 5,
  color = palette.muted,
) {
  c.font = `${size}px Arial`;
  let row = '',
    at = 0;
  for (const word of value.split(/\s+/)) {
    const next = row ? `${row} ${word}` : word;
    if (c.measureText(next).width > width && row) {
      text(c, row, x, y + at * line, size, color);
      at++;
      row = word;
      if (at >= max) return;
    } else row = next;
  }
  if (row && at < max) text(c, row, x, y + at * line, size, color);
}
function short(c: Context, value: string, width: number) {
  let output = value;
  while (output.length && c.measureText(output + '…').width > width)
    output = output.slice(0, -1);
  return output === value ? value : output + '…';
}
function brand(c: Context, x: number, y: number, size = 22) {
  c.save();
  c.strokeStyle = palette.ink;
  c.lineWidth = 2.2;
  c.strokeRect(x, y - 15, 16, 16);
  c.beginPath();
  c.moveTo(x + 7, y + 1);
  c.lineTo(x + 7, y - 6);
  c.lineTo(x + 16, y - 6);
  c.stroke();
  text(c, 'roomedy', x + 26, y + 1, size, palette.ink, 'Arial', 'bold');
  c.font = `bold ${size}px Arial`;
  text(
    c,
    '.',
    x + 26 + c.measureText('roomedy').width,
    y + 1,
    size,
    palette.clay,
    'Arial',
    'bold',
  );
  c.restore();
}
function rule(c: Context, y: number) {
  c.strokeStyle = palette.line;
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(52, y);
  c.lineTo(1048, y);
  c.stroke();
}
function photo(
  c: Context,
  p: RoomPicture,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const image = p.image,
    scale = Math.min(width / image.width, height / image.height),
    w = image.width * scale,
    h = image.height * scale;
  c.drawImage(image, x + (width - w) / 2, y + (height - h) / 2, w, h);
}
function finishName(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
function swatch(
  c: Context,
  room: RoomDocument,
  target: SurfaceTarget,
  x: number,
  y: number,
  label: string,
  width = 140,
) {
  const finish = roomSurface(room.room, target);
  const evidence = room.room.surfaces?.[target];
  c.fillStyle = finish.color;
  c.beginPath();
  c.roundRect(x, y, width, 42, 8);
  c.fill();
  c.strokeStyle = palette.line;
  c.lineWidth = 1;
  c.stroke();
  text(c, label, x, y + 62, 10, palette.muted);
  text(
    c,
    `${evidence?.texture.status === 'estimated' ? '~' : ''}${SURFACE_TEXTURES[finish.texture]} · ${evidence?.color.status === 'estimated' ? '~' : ''}${finish.color}`,
    x,
    y + 80,
    11,
  );
}
export function drawPortfolioPlan(c: Context, project: Project) {
  const room = project.current,
    b = displayRoom(room),
    width = b.width * 1000,
    depth = b.depth * 1000,
    boxes = room.furniture.map((p) => footprint(p)),
    minX = Math.min(
      0,
      ...boxes.map((b, i) => b?.minX ?? room.furniture[i]!.pose.centerX - 100),
    ),
    minZ = Math.min(
      0,
      ...boxes.map((b, i) => b?.minZ ?? room.furniture[i]!.pose.centerZ - 100),
    ),
    maxX = Math.max(
      width,
      ...boxes.map((b, i) => b?.maxX ?? room.furniture[i]!.pose.centerX + 100),
    ),
    maxZ = Math.max(
      depth,
      ...boxes.map((b, i) => b?.maxZ ?? room.furniture[i]!.pose.centerZ + 100),
    );
  const scale = Math.min(500 / (maxX - minX), 475 / (maxZ - minZ)),
    ox = 85 + (500 - (maxX - minX) * scale) / 2 - minX * scale,
    oy = 205 + (475 - (maxZ - minZ) * scale) / 2 - minZ * scale;
  c.fillStyle = roomSurface(room.room, 'floor').color;
  c.fillRect(ox, oy, width * scale, depth * scale);
  c.lineWidth = 3;
  for (const [wall, x1, y1, x2, y2] of [
    ['north', 0, 0, width, 0],
    ['east', width, 0, width, depth],
    ['south', 0, depth, width, depth],
    ['west', 0, 0, 0, depth],
  ] as const) {
    c.strokeStyle = roomSurface(room.room, wall).color;
    c.beginPath();
    c.moveTo(ox + x1 * scale, oy + y1 * scale);
    c.lineTo(ox + x2 * scale, oy + y2 * scale);
    c.stroke();
  }
  text(
    c,
    measurement(room.room.width),
    ox + (width * scale) / 2 - 30,
    oy - 16,
    12,
    palette.muted,
  );
  c.save();
  c.translate(ox - 17, oy + (depth * scale) / 2 + 30);
  c.rotate(-Math.PI / 2);
  text(c, measurement(room.room.depth), 0, 0, 12, palette.muted);
  c.restore();
  room.room.features.forEach((f) => {
    const box = featureBox(room, f);
    if (!box) return;
    if (f.kind === 'obstacle') {
      c.fillStyle = '#a79985';
      c.fillRect(
        ox + (box.center[0] - box.size[0] / 2) * 1000 * scale,
        oy + (box.center[2] - box.size[2] / 2) * 1000 * scale,
        box.size[0] * 1000 * scale,
        box.size[2] * 1000 * scale,
      );
      return;
    }
    const horizontal = f.wall === 'north' || f.wall === 'south',
      x = ox + box.center[0] * 1000 * scale,
      y = oy + box.center[2] * 1000 * scale,
      w = box.size[0] * 1000 * scale,
      h = box.size[2] * 1000 * scale;
    c.strokeStyle = palette.paper;
    c.lineWidth = 8;
    c.beginPath();
    c.moveTo(horizontal ? x - w / 2 : x, horizontal ? y : y - h / 2);
    c.lineTo(horizontal ? x + w / 2 : x, horizontal ? y : y + h / 2);
    c.stroke();
    c.strokeStyle = f.kind === 'window' ? '#92a9a7' : palette.walnut;
    c.lineWidth = 4;
    c.stroke();
  });
  furnitureByElevation(room).forEach((piece) => {
    const i = room.furniture.indexOf(piece);
    const b = boxes[i];
    if (!b) {
      const x = ox + piece.pose.centerX * scale,
        y = oy + piece.pose.centerZ * scale;
      text(c, `${i + 1}?`, x, y, 12, palette.clay);
      return;
    }
    const x = ox + b.minX * scale,
      y = oy + b.minZ * scale,
      w = (b.maxX - b.minX) * scale,
      h = (b.maxZ - b.minZ) * scale;
    c.fillStyle =
      findCatalogueEntry(piece.catalogueId, piece.catalogueVersion)
        ?.category === 'tv'
        ? '#282b2a'
        : FINISH_PALETTE[piece.finish];
    c.fillRect(x, y, w, h);
    c.strokeStyle = '#77573f';
    c.lineWidth = 1.1;
    c.strokeRect(x, y, w, h);
    c.font = '11px Arial';
    const label =
      w > 70 && h > 25
        ? short(c, `${i + 1}. ${piece.label}`, w - 12)
        : `${i + 1}`;
    const measure = c.measureText(label);
    const labelX = projectedLabelVisible(room, piece)
      ? x + w / 2
      : x + w + measure.width / 2 + 8;
    c.fillStyle = palette.paper;
    c.fillRect(
      labelX - measure.width / 2 - 4,
      y + h / 2 - 10,
      measure.width + 8,
      16,
    );
    text(c, label, labelX - measure.width / 2, y + h / 2 + 2, 11);
  });
}
async function encode(canvas: HTMLCanvasElement) {
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (value) =>
        value ? resolve(value) : reject(new DesignExportError('failed')),
      'image/jpeg',
      0.95,
    ),
  );
  return new Uint8Array(await blob.arrayBuffer());
}
/** The same plan geometry/labels as the portfolio, cropped to a standalone generated picture. */
export async function captureEstimatePlan(project: Project, check: () => void) {
  check();
  const canvas = document.createElement('canvas');
  canvas.width = 1140;
  canvas.height = 1080;
  try {
    const context = canvas.getContext('2d');
    if (!context) throw new DesignExportError('graphics');
    context.fillStyle = palette.oat;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.scale(2, 2);
    context.translate(-40, -165);
    drawPortfolioPlan(context, project);
    check();
    const bytes = await encode(canvas);
    check();
    return bytes;
  } finally {
    canvas.width = canvas.height = 1;
  }
}
/** Bounded editorial presentation pages. Text is intentionally rasterized at print resolution. */
export async function createPortfolioPages(
  project: Project,
  pictures: RoomPicture[],
  port: PortfolioPort = {},
) {
  if (
    pictures.length !== 3 ||
    pictures.some((p) => !(p.image.width > 0 && p.image.height > 0))
  )
    throw new DesignExportError('graphics');
  const facts = portfolioFacts(project),
    pages: Uint8Array[] = [];
  let bytes = 0;
  for (let page = 0; page < facts.pages; page++) {
    port.check?.();
    port.progress?.(`Designing page ${page + 1} of ${facts.pages}…`);
    const canvas = (port.canvas ?? (() => document.createElement('canvas')))();
    canvas.width = POLICY.designExportPageWidth;
    canvas.height = POLICY.designExportPageHeight;
    const c = canvas.getContext('2d');
    if (!c) throw new DesignExportError('graphics');
    try {
      c.scale(canvas.width / 1100, canvas.height / 778);
      c.fillStyle = palette.oat;
      c.fillRect(0, 0, 1100, 778);
      brand(c, 52, 48);
      text(c, 'ROOM DESIGN PORTFOLIO', 865, 45, 9, palette.muted);
      rule(c, 724);
      text(
        c,
        'A fresh perspective on the space you call home.',
        52,
        748,
        10,
        palette.muted,
      );
      text(
        c,
        `${String(page + 1).padStart(2, '0')} / ${String(facts.pages).padStart(2, '0')}`,
        1006,
        748,
        10,
        palette.muted,
      );
      if (page === 0) {
        text(c, 'YOUR ROOM. REIMAGINED.', 52, 130, 10, palette.walnut);
        text(c, 'Make room', 52, 206, 60);
        text(
          c,
          'for your life.',
          52,
          275,
          60,
          palette.walnut,
          'Georgia',
          'italic',
        );
        wrap(c, facts.summary, 55, 322, 290, 13, 21, 4);
        text(c, facts.style.toUpperCase(), 55, 430, 10, palette.clay);
        photo(c, pictures[0]!, 430, 105, 618, 500);
        rule(c, 617);
        text(c, facts.area, 52, 665, facts.area.length > 18 ? 19 : 31);
        text(c, 'ROOM AREA', 54, 687, 9, palette.muted);
        text(c, `${facts.room.furniture.length} pieces`, 330, 665, 31);
        text(c, 'IN YOUR ARRANGEMENT', 332, 687, 9, palette.muted);
        text(
          c,
          facts.dimensions,
          655,
          665,
          facts.dimensions.length > 28 ? 18 : 24,
        );
        text(c, 'WIDTH × DEPTH', 657, 687, 9, palette.muted);
      } else if (page === 1) {
        text(c, 'A CHANGE OF PERSPECTIVE', 52, 113, 10, palette.walnut);
        text(c, 'See it from another angle.', 52, 169, 42);
        text(
          c,
          'The same room. A different feeling of space.',
          54,
          200,
          16,
          palette.walnut,
          'Georgia',
          'italic',
        );
        photo(c, pictures[1]!, 52, 244, 485, 340);
        photo(c, pictures[2]!, 563, 244, 485, 340);
        text(c, '01 / ' + pictures[1]!.label, 52, 618, 13);
        text(c, '02 / ' + pictures[2]!.label, 563, 618, 13);
        wrap(
          c,
          pictures[1]!.label === 'From the doorway'
            ? 'An eye-level view from the entrance into your current arrangement.'
            : 'A second view of the same furniture, proportions and finishes.',
          52,
          646,
          465,
          12,
          18,
          2,
        );
        wrap(
          c,
          pictures[2]!.label === 'From the opposite corner'
            ? 'The corner opposite the entrance offers another look across the room.'
            : 'A wider look at the relationship between the furniture and the room.',
          563,
          646,
          465,
          12,
          18,
          2,
        );
      } else if (page === 2) {
        text(c, 'THE PLAN', 52, 113, 10, palette.walnut);
        text(c, 'Every piece, in place.', 52, 166, 42);
        drawPortfolioPlan(c, project);
        text(
          c,
          'Space with intention.',
          660,
          255,
          28,
          palette.walnut,
          'Georgia',
          'italic',
        );
        wrap(c, facts.summary, 660, 294, 362, 13, 21, 3);
        wrap(
          c,
          facts.moved || facts.added
            ? `${facts.moved} existing ${facts.moved === 1 ? 'piece repositioned' : 'pieces repositioned'}${facts.added ? `; ${facts.added} ${facts.added === 1 ? 'piece added' : 'pieces added'}` : ''} from the starting arrangement.`
            : 'The plan records the furniture positions shown in the room views.',
          660,
          370,
          362,
          12,
          19,
          3,
        );
        wrap(
          c,
          'Numbers in the plan correspond to the furniture details. Dimensions marked ~ are estimates.',
          660,
          445,
          362,
          11,
          18,
          3,
        );
        if (
          facts.missingSize ||
          facts.room.room.width.value === null ||
          facts.room.room.depth.value === null ||
          port.simpleShapes
        )
          wrap(
            c,
            `${facts.missingSize || facts.room.room.width.value === null || facts.room.room.depth.value === null ? 'Missing footprints use a ? marker; missing room dimensions use an approximate display outline. ' : ''}${port.simpleShapes ? 'Some furniture uses simplified geometry.' : ''}`,
            660,
            509,
            362,
            11,
            18,
            3,
          );
        swatch(c, facts.room, 'floor', 660, 590, 'FLOOR', 160);
        swatch(c, facts.room, 'walls', 852, 590, 'WALLS', 160);
      } else {
        const pieces = facts.inventory[page - 3]!;
        text(c, 'FINISHES & FURNITURE', 52, 113, 10, palette.walnut);
        text(
          c,
          page === 3 ? 'The details make it yours.' : 'A place for everything.',
          52,
          168,
          42,
        );
        swatch(c, facts.room, 'floor', 52, 200, 'FLOOR', 210);
        swatch(c, facts.room, 'walls', 300, 200, 'WALLS', 210);
        text(c, facts.style, 588, 231, 26, palette.walnut, 'Georgia', 'italic');
        wrap(
          c,
          'A record of the pieces, finishes and measured proportions in this arrangement.',
          588,
          260,
          410,
          12,
          18,
          2,
        );
        rule(c, 312);
        const columns = pieces.length > 8 ? 2 : 1,
          rows = Math.ceil(pieces.length / columns),
          rowHeight = Math.min(58, 360 / Math.max(1, rows));
        pieces.forEach((piece, i) => {
          const col = columns === 1 ? 0 : Math.floor(i / rows),
            row = columns === 1 ? i : i % rows,
            x = 52 + col * 514,
            y = 342 + row * rowHeight,
            w = columns === 1 ? 996 : 482;
          c.font = '14px Arial';
          text(
            c,
            short(c, `${(page - 3) * 16 + i + 1}. ${piece.label}`, w - 145),
            x,
            y,
            14,
          );
          text(
            c,
            `${piece.ownership === 'owned' ? 'Owned' : 'Proposed'} · ${finishName(piece.finish)}`,
            x + w - 140,
            y,
            10,
            palette.muted,
          );
          text(
            c,
            `${measurement(piece.dimensions.width)} × ${measurement(piece.dimensions.depth)} × ${measurement(piece.dimensions.height)}`,
            x,
            y + 20,
            11,
            palette.muted,
          );
          c.strokeStyle = palette.line;
          c.beginPath();
          c.moveTo(x, y + 31);
          c.lineTo(x + w, y + 31);
          c.stroke();
        });
      }
      port.check?.();
      const data = await (port.encode ?? encode)(canvas);
      bytes += data.byteLength;
      if (bytes > POLICY.designExportPdfBytes)
        throw new DesignExportError('too-large');
      pages.push(data);
    } finally {
      canvas.width = canvas.height = 1;
    }
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }
  return pages;
}
