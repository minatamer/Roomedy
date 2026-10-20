import type { Feature } from '@roomedy/contracts/room';
import type { Triple } from './adapter';

export interface OpeningPart {
  name: string;
  kind: 'glass' | 'frame' | 'handle';
  center: Triple;
  size: Triple;
}
/** Closed geometry in local metres, shared by the editor and model exports. */
export function balconyDoorPanels(
  w: number,
  h: number,
  depth: number,
  sliding: boolean,
) {
  const t = Math.min(0.035, w / 6, h / 6),
    width = (w - t * 2) / 2,
    height = h - t * 2,
    rail = Math.min(0.025, width / 6, height / 6);
  return ([0, 1] as const).map((index) => {
    const side = index === 0 ? -1 : 1,
      x = (side * width) / 2,
      z = depth * 0.5 + (sliding && index === 1 ? -0.025 : 0.02);
    const parts: OpeningPart[] = [
      {
        name: `Balcony glass ${index + 1}`,
        kind: 'glass',
        center: [x, 0, z],
        size: [width - rail * 2, height - rail * 2, 0.012],
      },
    ];
    for (const [dx, dy, sw, sh] of [
      [-width / 2 + rail / 2, 0, rail, height],
      [width / 2 - rail / 2, 0, rail, height],
      [0, height / 2 - rail / 2, width - rail * 2, rail],
      [0, -height / 2 + rail / 2, width - rail * 2, rail],
    ])
      parts.push({
        name: `Balcony panel ${index + 1} frame ${parts.length}`,
        kind: 'frame',
        center: [x + dx!, dy!, z],
        size: [sw!, sh!, Math.min(0.035, depth)],
      });
    parts.push({
      name: `Balcony handle ${index + 1}`,
      kind: 'handle',
      center: [x - side * (width / 2 - rail * 1.5), -height * 0.04, z + 0.025],
      size: [Math.min(0.018, width / 12), Math.min(0.18, height / 5), 0.02],
    });
    return { index, parts };
  });
}
export function balconyPanelMotion(
  feature: Extract<Feature, { kind: 'door' }>,
  width: number,
  depth: number,
  index: 0 | 1,
) {
  const t = Math.min(0.035, width / 6, (feature.height.value ?? 2100) / 6000);
  if (feature.mechanism === 'sliding')
    return index === 1
      ? null
      : {
          pivot: [0, 0, 0] as Triple,
          travel: [(width - t * 2) / 2, 0, 0] as Triple,
          turn: 0,
        };
  const side = index === 0 ? -1 : 1;
  return {
    pivot: [side * (width / 2 - t), 0, depth * 0.5 + 0.02] as Triple,
    travel: [0, 0, 0] as Triple,
    turn: (side * (feature.mechanism === 'outward' ? -1 : 1) * Math.PI) / 2,
  };
}
