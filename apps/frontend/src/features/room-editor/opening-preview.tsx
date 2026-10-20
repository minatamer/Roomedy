import type { OpeningCapability } from '../room-view/articulation';
import styles from './editor.module.css';

export function OpeningPreview({
  capability,
  open,
  onChange,
}: {
  capability: OpeningCapability;
  open: boolean;
  onChange: (open: boolean) => void;
}) {
  return (
    <div className={styles.section}>
      <h3>3D preview</h3>
      <button aria-pressed={open} onClick={() => onChange(!open)}>
        {open ? capability.closeLabel : capability.openLabel}
      </button>
    </div>
  );
}
