import { CATALOGUE } from '@roomedy/spatial';
import { LIGHT_PRESETS } from '@roomedy/contracts/furniture-materials';

/** Both provider paths receive the current manual catalogue, never a second list of pieces. */
export const editorCatalogue = CATALOGUE.map(
  ({
    id,
    label,
    category,
    size,
    finishes,
    placement,
    defaultElevationMm,
    accessMechanism,
    accessMm,
  }) => ({
    id,
    label,
    category,
    size,
    finishes,
    placement: placement ?? 'floor',
    defaultElevationMm: defaultElevationMm ?? 0,
    accessMechanism,
    accessMm,
  }),
);

export const editorCapabilities = {
  lighting: {
    presets: LIGHT_PRESETS,
    brightness: '0–100%',
    examples: [
      'Set the Floor lamp light to warm red',
      'Set the lights brightness to 50%',
      'Turn the lights off',
      'Add a ceiling pendant light',
    ],
    views:
      'Day/Night in 3D; Floor/Ceiling in 2D; interior ceiling follows wall colour. Light emission is independent of fixture finish. Preview then Apply.',
  },
  mirrors: {
    reflection:
      'Mirrors reflect the actual room in 3D. One visible front-facing mirror has a live reflection at a time; others use a glossy fallback. Reflected content depends on the viewing angle.',
    controls:
      'Use supplied catalogue placement and mounting heights with normal preview/Apply. A standing pivot is model hardware, not an adjustable tilt control. Mirrored-door wardrobes have one mirrored hinged leaf.',
  },
};
