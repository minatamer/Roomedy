import { useState } from 'react';
import type { Feature } from '@roomedy/contracts/room';
import {
  openingMaterialsSchema,
  openingMaterialTargets,
} from '@roomedy/contracts/furniture-materials';
import type { OpeningMaterials } from '@roomedy/contracts/furniture-materials';
import { ColourPicker, PatternPicker } from './colour-picker';
import layout from './appearance-controls.module.css';

export function OpeningMaterialControls({
  feature,
  onCommit,
}: {
  feature: Feature;
  onCommit: (materials: OpeningMaterials) => string | null;
}) {
  if (feature.kind === 'obstacle') return null;
  return (
    <details className={layout.disclosure}>
      <summary>Appearance</summary>
      <OpeningForm key={feature.id} feature={feature} onCommit={onCommit} />
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
  const signature = JSON.stringify(feature.materials);
  const [base, setBase] = useState(signature);
  if (base !== signature) {
    setBase(signature);
    setPatch({});
  }
  const chosen = openingMaterialTargets({ ...feature.materials, ...patch });
  const update = (next: OpeningMaterials) => {
    const draft = { ...patch, ...next };
    setPatch(draft);
    const parsed = openingMaterialsSchema.safeParse(draft);
    setError(parsed.success ? (onCommit(parsed.data) ?? '') : '');
  };
  return (
    <form
      noValidate
      className={layout.stack}
      data-inspector-invalid={
        (Object.keys(patch).length > 0 &&
          !openingMaterialsSchema.safeParse(patch).success) ||
        !!error ||
        undefined
      }
      onSubmit={(e) => {
        e.preventDefault();
        const result = openingMaterialsSchema.safeParse(patch);
        if (result.success) setError(onCommit(result.data) ?? '');
      }}
    >
      {feature.kind === 'door' && feature.purpose !== 'balcony' && (
        <section className={layout.group} aria-label="Door appearance">
          <h3>Door</h3>
          <ColourPicker
            displayLabel="Colour"
            label="Door colour"
            value={chosen.color}
            onChange={(color) => update({ color })}
          />
          <PatternPicker
            displayLabel="Pattern"
            collapsible
            label="Door pattern"
            value={chosen.texture}
            onChange={(texture) => update({ texture })}
          />
        </section>
      )}
      <section className={layout.group} aria-label="Frame appearance">
        <h3>Frame</h3>
        <ColourPicker
          displayLabel="Colour"
          label="Frame colour"
          value={chosen.frameColor}
          onChange={(frameColor) => update({ frameColor })}
        />
        <PatternPicker
          displayLabel="Pattern"
          collapsible
          label="Frame pattern"
          value={chosen.frameTexture}
          onChange={(frameTexture) => update({ frameTexture })}
        />
      </section>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
