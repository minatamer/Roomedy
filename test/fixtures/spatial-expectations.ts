/** Hand-derived independently of any spatial function; RM-003 must consume these facts. */
export const SAMPLE_EXPECTATIONS = {
  room: { width: 4200, depth: 4800 },
  // ordered northwest, northeast, southeast, southwest world corners, integer mm
  corners: {
    bed_1: [
      [200, 550],
      [1800, 550],
      [1800, 2650],
      [200, 2650],
    ],
    desk_1: [
      [2600, 700],
      [3800, 700],
      [3800, 1300],
      [2600, 1300],
    ],
    chair_1: [
      [2865, 1385],
      [3535, 1385],
      [3535, 2015],
      [2865, 2015],
    ],
    wardrobe_1: [
      [3550, 2600],
      [4150, 2600],
      [4150, 3800],
      [3550, 3800],
    ],
    storage_1: [
      [2025, 3500],
      [2375, 3500],
      [2375, 4300],
      [2025, 4300],
    ],
  },
  openings: {
    door_entrance: { wall: 'south', start: 200, end: 1100 },
    window_work: { wall: 'north', start: 2500, end: 3700 },
  },
  conflict: {
    objects: ['bed_1', 'desk_1'],
    width: 900,
    depth: 600,
    areaMm2: 540000,
  },
  // local front +Z rotates clockwise in the plan; R3F's Y rotation is negative.
  frontAtTurns: [
    [0, 1],
    [-1, 0],
    [0, -1],
    [1, 0],
  ],
} as const;
