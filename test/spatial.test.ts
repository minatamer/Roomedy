import { describe, expect, it } from 'vitest';
import { POLICY } from '@roomedy/contracts/policy';
import { checkFactsSchema, roomDocumentSchema } from '@roomedy/contracts/room';
import {
  checkRoom,
  corners,
  footprint,
  intersection,
  localFront,
  wallBand,
} from '@roomedy/spatial';
import {
  commandRoom,
  door,
  known,
  observed,
  piece,
  unknown,
  windowFeature,
} from './fixtures/command-room.js';
import { createRoomFixture } from '../apps/frontend/src/features/session/fixtures/rooms.js';
import { SAMPLE_EXPECTATIONS } from './fixtures/spatial-expectations.js';

describe('independent millimetre geometry', () => {
  it('agrees with the independently authored sample corners and disclosed 540000-square-mm conflict', () => {
    const sample = createRoomFixture();
    for (const item of sample.furniture)
      expect(corners(footprint(item)!)).toEqual(
        SAMPLE_EXPECTATIONS.corners[
          item.id as keyof typeof SAMPLE_EXPECTATIONS.corners
        ],
      );
    expect(
      checkRoom(sample).issues.filter((issue) => issue.severity === 'hard'),
    ).toEqual([]);
    expect(
      checkRoom(createRoomFixture('conflict')).issues.find(
        (issue) => issue.rule === 'solid',
      ),
    ).toMatchObject({
      severity: 'hard',
      objectIds: ['bed_1', 'desk_1'],
      areaMm2: SAMPLE_EXPECTATIONS.conflict.areaMm2,
    });
  });
  it.each([
    [
      0,
      [
        [1400, 1700],
        [2600, 1700],
        [2600, 2300],
        [1400, 2300],
      ],
      [0, 1],
    ],
    [
      1,
      [
        [1700, 1400],
        [2300, 1400],
        [2300, 2600],
        [1700, 2600],
      ],
      [-1, 0],
    ],
    [
      2,
      [
        [1400, 1700],
        [2600, 1700],
        [2600, 2300],
        [1400, 2300],
      ],
      [0, -1],
    ],
    [
      3,
      [
        [1700, 1400],
        [2300, 1400],
        [2300, 2600],
        [1700, 2600],
      ],
      [1, 0],
    ],
  ] as const)(
    'uses the authored corners/front for quarter-turn %i',
    (turns, expected, front) => {
      const item = piece('desk', 2000, 2000, { quarterTurns: turns });
      expect(corners(footprint(item)!)).toEqual(expected);
      expect(
        localFront(turns).every((value, axis) => value === front[axis]),
      ).toBe(true);
    },
  );

  it.each([0, 1, 2, 3] as const)(
    'represents odd-sized exact contact at turn %i without an epsilon',
    (turns) => {
      const odd = turns % 2 === 0;
      const room = commandRoom([
        piece('odd', odd ? 750.5 : 500.5, odd ? 500.5 : 750.5, {
          width: 1501,
          depth: 1001,
          quarterTurns: turns,
        }),
      ]);
      room.room.width = known(odd ? 1501 : 1001);
      room.room.depth = known(odd ? 1001 : 1501);
      expect(
        roomDocumentSchema.parse(JSON.parse(JSON.stringify(room))),
      ).toEqual(room);
      expect(
        checkRoom(room).issues.filter((i) => i.rule === 'containment'),
      ).toEqual([]);
      room.furniture[0]!.pose.centerX -= 0.5;
      expect(
        checkRoom(room).issues.find((i) => i.rule === 'containment'),
      ).toMatchObject({ severity: 'hard', deficitMm: 0.5 });
      room.furniture[0]!.pose.centerX = 0.25;
      expect(roomDocumentSchema.safeParse(room).success).toBe(false);
    },
  );

  it.each([
    [10, undefined],
    [11, undefined],
    [9, { minX: 9, maxX: 10, minZ: 0, maxZ: 10 }],
  ])('classifies contact/gap/one-mm crossing at x=%i', (x, expected) => {
    expect(
      intersection(
        { minX: 0, maxX: 10, minZ: 0, maxZ: 10 },
        { minX: x, maxX: x + 10, minZ: 0, maxZ: 10 },
      ),
    ).toEqual(expected);
  });

  it.each([
    ['north', { minX: 1000, maxX: 1900, minZ: 0, maxZ: 900 }],
    ['east', { minX: 3100, maxX: 4000, minZ: 1000, maxZ: 1900 }],
    ['south', { minX: 1000, maxX: 1900, minZ: 4100, maxZ: 5000 }],
    ['west', { minX: 0, maxX: 900, minZ: 1000, maxZ: 1900 }],
  ] as const)(
    'places the %s wall band in the common frame',
    (wall, expected) => {
      const room = commandRoom();
      room.room.width = known(4000);
      room.room.depth = known(5000);
      expect(wallBand(room, { ...door(), wall }, 900)).toEqual(expected);
    },
  );
});

describe('supported mechanism and height facts', () => {
  it.each(['left', 'right'] as const)(
    'discloses the conservative %s-hinge false rejection and a covered control',
    (hinge) => {
      const feature = { ...door(), hinge };
      const outsideSector = piece(
        'corner',
        hinge === 'left' ? 1850 : 1050,
        850,
        { width: 100, depth: 100 },
      );
      // Nearest corner to either hinge is (800,800) away: outside radius 900.
      expect(800 ** 2 + 800 ** 2).toBeGreaterThan(900 ** 2);
      const room = commandRoom([outsideSector], [feature]);
      expect(
        checkRoom(room).issues.find((i) => i.rule === 'door-envelope'),
      ).toMatchObject({
        severity: 'hard',
        areaMm2: 10000,
        limitation: 'conservative-door-envelope',
      });
      room.furniture = [
        piece('near_hinge', hinge === 'left' ? 1050 : 1850, 50, {
          width: 100,
          depth: 100,
        }),
      ];
      expect(100 ** 2 + 100 ** 2).toBeLessThan(900 ** 2);
      expect(
        checkRoom(room).issues.find((i) => i.rule === 'door-envelope'),
      ).toMatchObject({ severity: 'hard', areaMm2: 10000 });
    },
  );

  it.each(['outward', 'sliding'] as const)(
    'uses the finite approach zone for a %s door',
    (mechanism) => {
      const room = commandRoom(
        [piece('blocker', 1450, 650, { width: 200, depth: 200 })],
        [{ ...door(), mechanism }],
      );
      expect(
        checkRoom(room).issues.find((i) => i.rule === 'door-envelope'),
      ).toMatchObject({ severity: 'hard', areaMm2: 10000 });
      room.furniture[0]!.pose.centerZ = 700;
      expect(
        checkRoom(room).issues.filter((i) => i.rule === 'door-envelope'),
      ).toEqual([]);
      room.furniture[0]!.pose.centerZ = 699;
      expect(
        checkRoom(room).issues.find((i) => i.rule === 'door-envelope'),
      ).toMatchObject({ areaMm2: 200 });
    },
  );

  it('does not use unknown door height to downgrade a known floor envelope, but an unknown mechanism is unassessed', () => {
    const feature = door();
    feature.height = unknown();
    const room = commandRoom(
      [piece('blocker', 1450, 850, { width: 200, depth: 200 })],
      [feature],
    );
    expect(
      checkRoom(room).issues.find((i) => i.rule === 'door-envelope'),
    ).toMatchObject({ confidence: 'confirmed', severity: 'hard' });
    feature.mechanism = 'unknown';
    feature.mechanismProvenance = { status: 'unknown', sourceId: null };
    expect(
      checkRoom(room).issues.find((i) => i.rule === 'door-envelope'),
    ).toMatchObject({ severity: 'unassessed', confidence: 'unassessed' });
    feature.mechanism = 'inward';
    feature.mechanismProvenance = observed();
    feature.hinge = 'unknown';
    feature.hingeProvenance = { status: 'unknown', sourceId: null };
    expect(
      checkRoom(room).coverage.find((item) => item.rule === 'door-envelope'),
    ).toMatchObject({ status: 'unassessed', confidence: 'unassessed' });
  });

  it('keeps out-of-wall and above-ceiling feature facts structurally valid and explicitly blocked', () => {
    const feature = door();
    feature.offset = known(9500);
    feature.height = known(3001);
    const room = commandRoom([], [feature]);
    expect(roomDocumentSchema.safeParse(room).success).toBe(true);
    const facts = checkRoom(room);
    expect(
      facts.issues.find((issue) => issue.rule === 'containment'),
    ).toMatchObject({
      severity: 'hard',
      objectIds: ['door_1'],
      deficitMm: 400,
    });
    expect(facts.issues.find((issue) => issue.rule === 'height')).toMatchObject(
      { severity: 'hard', objectIds: ['door_1'], deficitMm: 1 },
    );
  });

  it('distinguishes hinged and sliding access at the exact clearance edge', () => {
    const wardrobe = piece('wardrobe', 2000, 2000, {
      width: 1200,
      depth: 600,
      height: 2100,
      catalogueId: 'wardrobe-hinged',
    });
    const room = commandRoom([
      wardrobe,
      piece('blocker', 2000, 3000, { width: 200, depth: 200 }),
    ]);
    expect(
      checkRoom(room).issues.find(
        (i) =>
          i.rule === 'front-access' &&
          i.objectIds.includes('wardrobe') &&
          i.objectIds.includes('blocker'),
      ),
    ).toMatchObject({ severity: 'hard', areaMm2: 40000 });
    wardrobe.catalogueId = 'wardrobe-sliding';
    expect(
      checkRoom(room).issues.filter(
        (i) => i.rule === 'front-access' && i.severity === 'hard',
      ),
    ).toEqual([]);
    room.furniture[1]!.pose.centerZ = 2999;
    expect(
      checkRoom(room).issues.find(
        (i) => i.rule === 'front-access' && i.severity === 'hard',
      ),
    ).toMatchObject({ areaMm2: 200 });
  });

  it('places chair pull-out behind its front and never invents a tuck-under exception', () => {
    const chair = piece('chair', 2000, 2000, {
      width: 550,
      depth: 550,
      height: 900,
      catalogueId: 'procedural-chair',
    });
    const room = commandRoom([
      chair,
      piece('blocker', 2000, 1200, { width: 200, depth: 200 }),
    ]);
    expect(
      checkRoom(room).issues.find(
        (i) => i.rule === 'front-access' && i.severity === 'hard',
      ),
    ).toMatchObject({ areaMm2: 40000 });
    room.furniture = [
      piece('desk'),
      {
        ...chair,
        pose: { ...chair.pose, centerZ: 2400, quarterTurns: 2 },
        dimensions: { ...chair.dimensions, height: unknown() },
      },
    ];
    expect(
      checkRoom(room).issues.find((i) => i.rule === 'solid'),
    ).toMatchObject({
      severity: 'hard',
      areaMm2: 96250,
      limitation: 'no-tuck-under',
    });
    room.furniture[1]!.pose.centerZ = 2700;
    expect(
      checkRoom(room).issues.filter(
        (i) => i.rule === 'front-access' && i.objectIds.includes('desk'),
      ),
    ).toEqual([]);
  });

  it('checks tall furniture against a fixed/inward window and preserves unknown sill coverage', () => {
    const feature = windowFeature();
    const room = commandRoom(
      [piece('cabinet', 1500, 150, { width: 200, depth: 200, height: 1200 })],
      [feature],
    );
    expect(
      checkRoom(room).issues.find((i) => i.rule === 'window'),
    ).toMatchObject({ severity: 'warning', areaMm2: 10000 });
    feature.mechanism = 'inward';
    expect(
      checkRoom(room).issues.find((i) => i.rule === 'window'),
    ).toMatchObject({ severity: 'hard', areaMm2: 40000 });
    feature.sill = unknown();
    expect(
      checkRoom(room).issues.find((i) => i.rule === 'window'),
    ).toMatchObject({ severity: 'unassessed' });
    feature.sill = known(1200);
    expect(checkRoom(room).issues.filter((i) => i.rule === 'window')).toEqual(
      [],
    );
  });

  it('checks obstacle vertical reach and exact ceiling contact independently', () => {
    const item = piece('cabinet', 1500, 200, {
      width: 200,
      depth: 200,
      height: 900,
    });
    const room = commandRoom(
      [item],
      [
        {
          id: 'obstacle',
          kind: 'obstacle',
          wall: 'north',
          wallProvenance: observed(),
          offset: known(1000),
          width: known(1000),
          height: known(500),
          sill: known(1100),
          projection: known(300),
        },
      ],
    );
    expect(checkRoom(room).issues.filter((i) => i.rule === 'obstacle')).toEqual(
      [],
    );
    item.dimensions.height = known(1300);
    expect(
      checkRoom(room).issues.find((i) => i.rule === 'obstacle'),
    ).toMatchObject({ severity: 'hard', areaMm2: 40000 });
    item.dimensions.height = known(3000);
    expect(checkRoom(room).issues.filter((i) => i.rule === 'height')).toEqual(
      [],
    );
    item.dimensions.height = known(3001);
    expect(
      checkRoom(room).issues.find((i) => i.rule === 'height'),
    ).toMatchObject({ severity: 'hard', deficitMm: 1 });
    room.room.height = unknown();
    expect(
      checkRoom(room).issues.find((i) => i.rule === 'height'),
    ).toMatchObject({ severity: 'unassessed' });
  });
});

describe('evidence, identity and finite coverage', () => {
  it('reports successful, approximate, planned, unknown and inapplicable assessments explicitly', () => {
    const room = commandRoom([piece('a'), piece('b', 6000)]);
    const coverage = () =>
      checkRoom(room).coverage.find((item) => item.rule === 'solid');
    expect(coverage()).toMatchObject({
      status: 'passed',
      confidence: 'confirmed',
      assessments: 1,
      unassessed: 0,
    });
    expect(
      checkRoom(room).coverage.find((item) => item.rule === 'door-envelope'),
    ).toMatchObject({ status: 'not-applicable', assessments: 0 });
    room.furniture[0]!.pose.provenance = {
      status: 'estimated',
      sourceId: 'photo_1',
    };
    expect(coverage()).toMatchObject({
      status: 'approximate',
      confidence: 'approximate',
      unassessed: 0,
    });
    room.furniture[0]!.pose.provenance = {
      status: 'planned',
      sourceId: 'visitor-plan',
    };
    expect(coverage()).toMatchObject({
      status: 'planned',
      confidence: 'planned',
    });
    room.furniture[0]!.pose.provenance = { status: 'unknown', sourceId: null };
    expect(coverage()).toMatchObject({
      status: 'unassessed',
      confidence: 'unassessed',
      unassessed: 1,
    });
    room.furniture[1]!.pose.centerX = 2500;
    expect(coverage()).toMatchObject({
      status: 'blocked',
      confidence: 'unassessed',
    });
    const checks = checkRoom(room);
    expect(checks.coverage).toHaveLength(9);
    expect(new Set(checks.coverage.map((item) => item.rule)).size).toBe(9);
    expect(
      checkFactsSchema.safeParse({
        ...checks,
        coverage: [...checks.coverage.slice(1), checks.coverage[1]],
      }).success,
    ).toBe(false);
  });

  it('does not turn estimated, planned or unknown positions into observed confirmation', () => {
    const room = commandRoom([piece('a'), piece('b', 2500)]);
    const pose = room.furniture[0]!.pose;
    pose.provenance = { status: 'estimated', sourceId: 'photo_1' };
    expect(
      checkRoom(room).issues.find((i) => i.rule === 'solid'),
    ).toMatchObject({ confidence: 'approximate' });
    pose.provenance = { status: 'planned', sourceId: 'visitor-plan' };
    expect(
      checkRoom(room).issues.find((i) => i.rule === 'solid'),
    ).toMatchObject({ confidence: 'planned' });
    pose.provenance = { status: 'unknown', sourceId: null };
    expect(
      checkRoom(room).issues.find((i) => i.rule === 'solid'),
    ).toMatchObject({ confidence: 'unassessed', severity: 'hard' });
    room.furniture[1]!.pose.centerX = 6000;
    expect(
      checkRoom(room).issues.some(
        (i) => i.rule === 'solid' && i.severity === 'unassessed',
      ),
    ).toBe(true);
  });

  it('uses categorical and room dependencies and never reports unsupported connectivity as passed', () => {
    const feature = door();
    feature.wallProvenance = { status: 'estimated', sourceId: 'photo_1' };
    const room = commandRoom(
      [piece('blocker', 1450, 850, { width: 200, depth: 200 })],
      [feature],
    );
    expect(
      checkRoom(room).issues.find((i) => i.rule === 'door-envelope'),
    ).toMatchObject({ confidence: 'approximate' });
    room.room.features = [];
    room.furniture = [
      piece('wardrobe', 2000, 9500, {
        catalogueId: 'wardrobe-hinged',
        height: 2100,
      }),
    ];
    room.room.depth = {
      value: 10000,
      status: 'estimated',
      sourceId: 'photo_1',
    };
    const checks = checkRoom(room);
    expect(
      checks.issues.find(
        (i) => i.rule === 'front-access' && i.severity === 'hard',
      ),
    ).toMatchObject({ confidence: 'approximate' });
    expect(checks.assessed).toBe(false);
    expect(
      checks.issues.find((i) => i.rule === 'entry-connectivity'),
    ).toMatchObject({ severity: 'unassessed', limitation: 'not-implemented' });
  });

  it('keeps issue identity stable under object permutations and bounds near-limit diagnostic work', () => {
    const room = commandRoom([piece('b', 2500), piece('a')]);
    const normalize = (issues: ReturnType<typeof checkRoom>['issues']) =>
      issues.map((issue) => ({
        ...issue,
        requiredInputs: [...issue.requiredInputs].sort(),
      }));
    const before = normalize(checkRoom(room).issues);
    room.furniture.reverse();
    expect(normalize(checkRoom(room).issues)).toEqual(before);
    const id = (prefix: string, n: number) => `${prefix}${n}`.padEnd(80, 'x');
    room.furniture = Array.from({ length: POLICY.furniture }, (_, i) =>
      piece(id('item', i)),
    );
    room.room.features = Array.from({ length: POLICY.features }, (_, i) => ({
      ...door(id('door', i)),
      offset: known(1600),
      width: known(900),
    }));
    expect(roomDocumentSchema.safeParse(room).success).toBe(true);
    const maximum = checkRoom(room);
    expect(checkFactsSchema.safeParse(maximum).success).toBe(true);
    expect(maximum.issues.length).toBeLessThanOrEqual(POLICY.issueFacts);
    expect(new Set(maximum.issues.map((i) => i.id)).size).toBe(
      maximum.issues.length,
    );
    for (const item of room.furniture)
      item.pose.provenance = { status: 'unknown', sourceId: null };
    room.room.features = room.room.features.map((feature) => ({
      ...feature,
      offset: known(0),
      width: known(10000),
    }));
    const uncertainMaximum = checkRoom(room);
    expect(checkFactsSchema.safeParse(uncertainMaximum).success).toBe(true);
    expect(uncertainMaximum.issues.length).toBeGreaterThan(3000);
    expect(uncertainMaximum.issues.length).toBeLessThanOrEqual(
      POLICY.issueFacts,
    );
    expect(uncertainMaximum.coverage).toHaveLength(9);
  });
});
