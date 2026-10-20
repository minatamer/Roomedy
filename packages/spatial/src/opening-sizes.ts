import type { Feature } from '@roomedy/contracts/room';

export interface OpeningSizePreset {
  readonly id: string;
  readonly label: string;
  readonly width: number;
  readonly height: number;
}
export const WINDOW_SIZE_PRESETS = Object.freeze(
  [
    { id: 'small', label: 'Small', width: 600, height: 900 },
    { id: 'medium', label: 'Medium', width: 1200, height: 1200 },
    { id: 'wide', label: 'Wide', width: 1800, height: 1200 },
    { id: 'large', label: 'Large', width: 2400, height: 1500 },
  ].map((preset) => Object.freeze(preset)),
);
export const BALCONY_SIZE_PRESETS = Object.freeze(
  [
    { id: 'compact', label: 'Compact', width: 1800, height: 2100 },
    { id: 'standard', label: 'Standard', width: 2400, height: 2100 },
    { id: 'wide', label: 'Wide', width: 3000, height: 2100 },
    { id: 'tall', label: 'Tall', width: 2400, height: 2400 },
  ].map((preset) => Object.freeze(preset)),
);
export function openingSizePresets(
  feature: Feature,
): readonly OpeningSizePreset[] {
  return feature.kind === 'window'
    ? WINDOW_SIZE_PRESETS
    : feature.kind === 'door' && feature.purpose === 'balcony'
      ? BALCONY_SIZE_PRESETS
      : [];
}
/** Presets are planning estimates; untouched axes retain their exact evidence. */
export function applyOpeningSizePreset(
  feature: Feature,
  id: string,
): Feature | null {
  const preset = openingSizePresets(feature).find((value) => value.id === id);
  if (!preset) return null;
  const next = { ...feature };
  for (const axis of ['width', 'height'] as const)
    if (feature[axis].value !== preset[axis])
      next[axis] = {
        value: preset[axis],
        status: 'estimated',
        sourceId: 'visitor-size-preset',
      };
  return next;
}
