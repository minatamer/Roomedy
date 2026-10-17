import type { CatalogueEntry } from '@roomedy/contracts/catalogue';
import { checkFactsSchema } from '@roomedy/contracts/room';
import type {
  CheckFacts,
  Furniture,
  RoomDocument,
} from '@roomedy/contracts/room';
import type {
  Region,
  SpatialIssue,
  RuleCoverage,
} from '@roomedy/contracts/issues';
import { POLICY } from '@roomedy/contracts/policy';
import {
  area,
  footprint,
  frontBand,
  intersection,
  outsideRegions,
  wallBand,
} from './coordinates.js';
import { CATALOGUE } from './catalogue.js';

type Evidence = { status: string; value?: number | null };
type Rule = SpatialIssue['rule'];
const RULES: readonly Rule[] = [
  'containment',
  'solid',
  'door-envelope',
  'front-access',
  'height',
  'window',
  'obstacle',
  'entry-connectivity',
  'catalogue-supported',
];
const confidence = (values: readonly Evidence[]): SpatialIssue['confidence'] =>
  values.some((v) => v.status === 'unknown' || v.value === null)
    ? 'unassessed'
    : values.some((v) => !['confirmed', 'planned'].includes(v.status))
      ? 'approximate'
      : values.some((v) => v.status === 'planned')
        ? 'planned'
        : 'confirmed';
function fact(
  rule: Rule,
  code: SpatialIssue['code'],
  ids: string[],
  region: Region | null,
  severity: SpatialIssue['severity'],
  values: readonly Evidence[],
  inputs: string[],
  limitation: SpatialIssue['limitation'] = null,
  suffix = '',
): SpatialIssue {
  const objectIds = [...ids].sort();
  return {
    id: `${rule}:${objectIds.join(':')}${suffix ? ':' + suffix : ''}`,
    rule,
    code,
    objectIds,
    severity,
    region,
    deficitMm: region
      ? Math.min(region.maxX - region.minX, region.maxZ - region.minZ)
      : null,
    areaMm2: region ? area(region) : null,
    confidence: severity === 'unassessed' ? 'unassessed' : confidence(values),
    requiredInputs: [...new Set(inputs)].sort(),
    limitation,
  };
}
const sizeInputs = (f: Furniture) => [
  `${f.id}:width`,
  `${f.id}:depth`,
  `${f.id}:pose`,
];
const sizeValues = (f: Furniture): Evidence[] => [
  f.dimensions.width,
  f.dimensions.depth,
  f.pose.provenance,
];
const UNKNOWN: Evidence = { status: 'unknown' };

/** Finite conservative floor-contact rules. Recorded assessments include successful and unknown cases. */
export function checkRoom(
  room: RoomDocument,
  catalogue: readonly CatalogueEntry[] = CATALOGUE,
): CheckFacts {
  const issues: SpatialIssue[] = [];
  const stats = new Map(
    RULES.map((rule) => [
      rule,
      {
        rule,
        assessments: 0,
        unassessed: 0,
        confidence: 'confirmed' as SpatialIssue['confidence'],
        hard: false,
        warning: false,
      },
    ]),
  );
  const record = (rule: Rule, values: readonly Evidence[]) => {
    const stat = stats.get(rule)!,
      value = confidence(values);
    stat.assessments++;
    if (value === 'unassessed') {
      stat.unassessed++;
      stat.confidence = 'unassessed';
    } else if (stat.confidence !== 'unassessed' && value === 'approximate')
      stat.confidence = 'approximate';
    else if (stat.confidence === 'confirmed' && value === 'planned')
      stat.confidence = 'planned';
    return value;
  };
  const add = (value: SpatialIssue) => {
    issues.push(value);
    const stat = stats.get(value.rule)!;
    if (value.severity === 'hard') stat.hard = true;
    if (value.severity === 'warning') stat.warning = true;
  };
  const unknown = (
    rule: Rule,
    ids: string[],
    inputs: string[],
    suffix = '',
    limitation: SpatialIssue['limitation'] = 'unknown-input',
  ) =>
    add(
      fact(
        rule,
        'unassessed',
        ids,
        null,
        'unassessed',
        [UNKNOWN],
        inputs,
        limitation,
        suffix,
      ),
    );
  const w = room.room.width.value,
    d = room.room.depth.value;
  const roomValues = [room.room.width, room.room.depth],
    roomInputs = ['room:width', 'room:depth'];
  const records = new Map(
    catalogue
      .filter((e) => e.version === room.catalogueVersion)
      .map((e) => [e.id, e]),
  );
  const boxes = new Map(room.furniture.map((f) => [f.id, footprint(f)]));
  for (const f of room.furniture) {
    const rect = boxes.get(f.id),
      values = [...sizeValues(f), ...roomValues],
      inputs = [...sizeInputs(f), ...roomInputs];
    if (!rect || w === null || d === null) {
      record('containment', [UNKNOWN]);
      unknown('containment', [f.id], inputs);
    } else {
      const state = record('containment', values),
        outside = outsideRegions(rect, w, d);
      for (const part of outside) {
        const value = fact(
          'containment',
          'outside-room',
          [f.id],
          part.region,
          'hard',
          values,
          inputs,
          null,
          part.side,
        );
        value.deficitMm = part.deficit;
        add(value);
      }
      if (state === 'unassessed' && !outside.length)
        unknown('containment', [f.id], inputs);
    }
    const height = f.dimensions.height.value,
      ceiling = room.room.height.value,
      hValues = [f.dimensions.height, room.room.height],
      hInputs = [`${f.id}:height`, 'room:height'];
    record('height', hValues);
    if (height === null || ceiling === null) unknown('height', [f.id], hInputs);
    else if (height > ceiling) {
      const value = fact(
        'height',
        'height',
        [f.id],
        rect ?? null,
        'hard',
        hValues,
        hInputs,
      );
      value.deficitMm = height - ceiling;
      add(value);
    }
    const entry = records.get(f.catalogueId);
    record('catalogue-supported', entry ? [] : [UNKNOWN]);
    if (!entry) unknown('catalogue-supported', [f.id], [`${f.id}:catalogue`]);
    if (!entry || !rect || entry.accessMm === 0) {
      if (!entry || entry.accessMm > 0) {
        record('front-access', [UNKNOWN]);
        unknown('front-access', [f.id], sizeInputs(f));
      }
      continue;
    }
    const turns =
      entry.accessMechanism === 'chair-pullout'
        ? (f.pose.quarterTurns + 2) % 4
        : f.pose.quarterTurns;
    const access = frontBand(rect, turns, entry.accessMm),
      severity = entry.accessMechanism === 'none' ? 'warning' : 'hard';
    if (w === null || d === null) {
      record('front-access', [UNKNOWN]);
      unknown('front-access', [f.id], inputs, 'boundary');
    } else {
      const state = record('front-access', values),
        outside = outsideRegions(access, w, d);
      for (const part of outside)
        add(
          fact(
            'front-access',
            'access',
            [f.id],
            part.region,
            severity,
            values,
            inputs,
            'configured-access',
            part.side,
          ),
        );
      if (state === 'unassessed' && !outside.length)
        unknown('front-access', [f.id], inputs, 'boundary');
    }
    for (const other of room.furniture) {
      if (other.id === f.id) continue;
      const pairValues = [...sizeValues(f), ...sizeValues(other)],
        pairInputs = [...sizeInputs(f), ...sizeInputs(other)],
        otherRect = boxes.get(other.id),
        otherEntry = records.get(other.catalogueId);
      const state = record('front-access', pairValues);
      if (!otherRect) {
        unknown('front-access', [f.id, other.id], pairInputs, f.id);
        continue;
      }
      // The facing chair occupies a desk use area, but never exempts a solid overlap.
      if (
        entry.category === 'desk' &&
        otherEntry?.category === 'chair' &&
        other.pose.quarterTurns === (f.pose.quarterTurns + 2) % 4 &&
        state !== 'unassessed'
      )
        continue;
      const overlap = intersection(access, otherRect);
      if (overlap)
        add(
          fact(
            'front-access',
            'access',
            [f.id, other.id],
            overlap,
            severity,
            pairValues,
            pairInputs,
            'configured-access',
            f.id,
          ),
        );
      else if (state === 'unassessed')
        unknown('front-access', [f.id, other.id], pairInputs, f.id);
    }
  }
  for (let i = 0; i < room.furniture.length; i++)
    for (let j = i + 1; j < room.furniture.length; j++) {
      const a = room.furniture[i]!,
        b = room.furniture[j]!,
        ra = boxes.get(a.id),
        rb = boxes.get(b.id),
        values = [...sizeValues(a), ...sizeValues(b)],
        inputs = [...sizeInputs(a), ...sizeInputs(b)];
      const state = record('solid', values);
      if (!ra || !rb) {
        unknown('solid', [a.id, b.id], inputs);
        continue;
      }
      const overlap = intersection(ra, rb);
      if (overlap)
        add(
          fact(
            'solid',
            'overlap',
            [a.id, b.id],
            overlap,
            'hard',
            values,
            inputs,
            'no-tuck-under',
          ),
        );
      else if (state === 'unassessed') unknown('solid', [a.id, b.id], inputs);
    }
  for (const feature of room.room.features) {
    const locationValues: Evidence[] = [
        feature.offset,
        feature.width,
        feature.wallProvenance,
      ],
      locationInputs = [
        `${feature.id}:offset`,
        `${feature.id}:width`,
        `${feature.id}:wall`,
      ];
    const placement = wallBand(room, feature, 1),
      pValues = [...locationValues, ...roomValues],
      pInputs = [...locationInputs, ...roomInputs];
    const placementState = record('containment', pValues);
    if (!placement || w === null || d === null)
      unknown('containment', [feature.id], pInputs);
    else {
      const outside = outsideRegions(placement, w, d);
      for (const part of outside) {
        const value = fact(
          'containment',
          'outside-room',
          [feature.id],
          part.region,
          'hard',
          pValues,
          pInputs,
          null,
          part.side,
        );
        value.deficitMm = part.deficit;
        add(value);
      }
      if (placementState === 'unassessed' && !outside.length)
        unknown('containment', [feature.id], pInputs);
    }
    const verticalValues = [feature.sill, feature.height, room.room.height],
      verticalInputs = [
        `${feature.id}:sill`,
        `${feature.id}:height`,
        'room:height',
      ];
    record('height', verticalValues);
    if (
      feature.sill.value === null ||
      feature.height.value === null ||
      room.room.height.value === null
    )
      unknown('height', [feature.id], verticalInputs);
    else if (
      feature.sill.value + feature.height.value >
      room.room.height.value
    ) {
      const value = fact(
        'height',
        'height',
        [feature.id],
        placement ?? null,
        'hard',
        verticalValues,
        verticalInputs,
      );
      value.deficitMm =
        feature.sill.value + feature.height.value - room.room.height.value;
      add(value);
    }
    const rule: Rule =
      feature.kind === 'door'
        ? 'door-envelope'
        : feature.kind === 'window'
          ? 'window'
          : 'obstacle';
    const mechanismValues: Evidence[] =
      feature.kind === 'obstacle'
        ? [feature.projection]
        : [
            feature.mechanismProvenance,
            ...(feature.kind === 'door' && feature.mechanism === 'inward'
              ? [feature.hingeProvenance]
              : []),
          ];
    const mechanismInputs =
      feature.kind === 'obstacle'
        ? [`${feature.id}:projection`]
        : [
            `${feature.id}:mechanism`,
            ...(feature.kind === 'door' && feature.mechanism === 'inward'
              ? [`${feature.id}:hinge`]
              : []),
          ];
    const reach =
      feature.kind === 'door'
        ? feature.mechanism === 'inward'
          ? feature.width.value
          : POLICY.doorApproachMm
        : feature.kind === 'obstacle'
          ? feature.projection.value
          : feature.mechanism === 'inward'
            ? feature.width.value
            : POLICY.windowBandMm;
    const band = reach === null ? undefined : wallBand(room, feature, reach);
    const positionRoomValues =
      feature.wall === 'east'
        ? [room.room.width]
        : feature.wall === 'south'
          ? [room.room.depth]
          : [];
    const positionRoomInputs =
      feature.wall === 'east'
        ? ['room:width']
        : feature.wall === 'south'
          ? ['room:depth']
          : [];
    const baseValues = [
        ...locationValues,
        ...mechanismValues,
        ...positionRoomValues,
      ],
      baseInputs = [
        ...locationInputs,
        ...mechanismInputs,
        ...positionRoomInputs,
      ];
    const unknownMechanism =
      (feature.kind !== 'obstacle' && feature.mechanism === 'unknown') ||
      (feature.kind === 'door' &&
        feature.mechanism === 'inward' &&
        feature.hinge === 'unknown');
    if (!band || unknownMechanism) {
      record(rule, [UNKNOWN]);
      unknown(rule, [feature.id], baseInputs);
      continue;
    }
    // An opening with no furniture still receives an actual supported-envelope assessment.
    if (!room.furniture.length) record(rule, baseValues);
    for (const f of room.furniture) {
      const rect = boxes.get(f.id),
        values = [...baseValues, ...sizeValues(f)],
        inputs = [...baseInputs, ...sizeInputs(f)];
      if (!rect) {
        record(rule, [UNKNOWN]);
        unknown(rule, [feature.id, f.id], inputs);
        continue;
      }
      const overlap = intersection(band, rect);
      if (feature.kind === 'door') {
        const state = record(rule, values);
        if (overlap)
          add(
            fact(
              rule,
              'door-swing',
              [feature.id, f.id],
              overlap,
              'hard',
              values,
              inputs,
              'conservative-door-envelope',
            ),
          );
        else if (state === 'unassessed')
          unknown(rule, [feature.id, f.id], inputs);
      } else {
        const height = f.dimensions.height.value,
          sill = feature.sill.value,
          vertical = [...values, f.dimensions.height, feature.sill],
          dependent = [...inputs, `${f.id}:height`, `${feature.id}:sill`];
        // Vertical facts are only needed when the footprint reaches the modeled wall band.
        const state = record(rule, overlap ? vertical : values);
        if (overlap && (height === null || sill === null))
          unknown(rule, [feature.id, f.id], dependent);
        else if (overlap && height! > sill!)
          add(
            fact(
              rule,
              feature.kind === 'window' ? 'window' : 'obstacle',
              [feature.id, f.id],
              overlap,
              feature.kind === 'window' && feature.mechanism !== 'inward'
                ? 'warning'
                : 'hard',
              vertical,
              dependent,
              feature.kind === 'window' ? 'configured-access' : null,
            ),
          );
        else if (state === 'unassessed')
          unknown(rule, [feature.id, f.id], overlap ? dependent : inputs);
      }
    }
  }
  record('entry-connectivity', [UNKNOWN]);
  unknown(
    'entry-connectivity',
    [room.roomId],
    ['bounded-entry-path-algorithm'],
    '',
    'not-implemented',
  );
  const coverage: RuleCoverage[] = RULES.map((rule) => {
    const item = stats.get(rule)!,
      state: RuleCoverage['status'] = !item.assessments
        ? 'not-applicable'
        : item.hard
          ? 'blocked'
          : item.unassessed
            ? 'unassessed'
            : item.warning
              ? 'warning'
              : item.confidence === 'approximate'
                ? 'approximate'
                : item.confidence === 'planned'
                  ? 'planned'
                  : 'passed';
    return {
      rule,
      status: state,
      confidence: item.assessments ? item.confidence : 'unassessed',
      assessments: item.assessments,
      unassessed: item.unassessed,
    };
  });
  issues.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return checkFactsSchema.parse({
    roomId: room.roomId,
    roomRevision: room.roomRevision,
    rulesVersion: room.rulesVersion,
    assessed: coverage.every((item) => !item.unassessed),
    coverage,
    issues,
  });
}
