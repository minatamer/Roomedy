import { useState } from 'react';
import type { Feature } from '@roomedy/contracts/room';
import {
  openingMaterialsSchema,
  openingMaterialTargets,
} from '@roomedy/contracts/furniture-materials';
import type { OpeningMaterials } from '@roomedy/contracts/furniture-materials';
import { ColourPicker, PatternPicker } from './colour-picker';
import styles from './editor.module.css';

export function OpeningMaterialControls({
  feature,
  onCommit,
}: {
  feature: Feature;
  onCommit: (materials: OpeningMaterials) => string | null;
}) {
  if (feature.kind === 'obstacle') return null;
  return (
    <details className={styles.advanced}>
      <summary>Colours & patterns</summary>
      <OpeningForm
        key={JSON.stringify([feature.id, feature.materials])}
        feature={feature}
        onCommit={onCommit}
      />
    </details>
  );
}
function OpeningForm({
  feature,
  onCommit,
}: {
  feature: Exclude<Feature, { kind: 'obstacle' }>;
  onCommit: (materials: OpeningMaterials) => string | null;
}) {
  const [patch, setPatch] = useState<OpeningMaterials>({}),
    [error, setError] = useState('');
  const chosen = openingMaterialTargets({ ...feature.materials, ...patch });
  const update = (next: OpeningMaterials) => {
    setPatch((p) => ({ ...p, ...next }));
    setError('');
  };
  return (
    <form
      noValidate
      className={styles.section}
      onSubmit={(e) => {
        e.preventDefault();
        const result = openingMaterialsSchema.safeParse(patch);
        if (result.success) setError(onCommit(result.data) ?? '');
      }}
    >
      {feature.kind === 'door' && feature.purpose !== 'balcony' && (
        <>
          <ColourPicker
            label="Door colour"
            value={chosen.color}
            onChange={(color) => update({ color })}
          />
          <PatternPicker
            label="Door pattern"
            value={chosen.texture}
            onChange={(texture) => update({ texture })}
          />
        </>
      )}
      <ColourPicker
        label="Frame colour"
        value={chosen.frameColor}
        onChange={(frameColor) => update({ frameColor })}
      />
      <PatternPicker
        label="Frame pattern"
        value={chosen.frameTexture}
        onChange={(frameTexture) => update({ frameTexture })}
      />
      <button
        type="submit"
        className={styles.primary}
        disabled={!openingMaterialsSchema.safeParse(patch).success}
      >
        Apply appearance
      </button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
