import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import styles from './inspector-tabs.module.css';

export function InspectorTabs({
  label,
  sections,
  resetKey = 0,
}: {
  label: string;
  resetKey?: number;
  sections: readonly { id: string; label: string; content: ReactNode }[];
}) {
  const id = useId();
  const [active, setActive] = useState(sections[0]!.id);
  return (
    <>
      <div
        role="tablist"
        aria-label={label}
        className={styles.tabs}
        onKeyDown={(event) => {
          if (
            (event.target as HTMLElement).closest('[role="tablist"]') !==
            event.currentTarget
          )
            return;
          const index = sections.findIndex((section) => section.id === active);
          const next =
            event.key === 'Home'
              ? 0
              : event.key === 'End'
                ? sections.length - 1
                : event.key === 'ArrowRight'
                  ? (index + 1) % sections.length
                  : event.key === 'ArrowLeft'
                    ? (index + sections.length - 1) % sections.length
                    : null;
          if (next === null) return;
          event.preventDefault();
          const key = sections[next]!.id;
          setActive(key);
          document.getElementById(`${id}-tab-${key}`)?.focus();
        }}
      >
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            role="tab"
            id={`${id}-tab-${section.id}`}
            aria-controls={`${id}-panel-${section.id}`}
            aria-selected={active === section.id}
            tabIndex={active === section.id ? 0 : -1}
            onClick={() => setActive(section.id)}
          >
            {section.label}
          </button>
        ))}
      </div>
      {sections.map((section) => (
        <div
          key={`${section.id}/${resetKey}`}
          role="tabpanel"
          data-inspector-panel
          id={`${id}-panel-${section.id}`}
          aria-labelledby={`${id}-tab-${section.id}`}
          hidden={active !== section.id}
          className={styles.panel}
        >
          {section.content}
        </div>
      ))}
    </>
  );
}

/** Reveal the section containing incomplete input before a transaction can be saved. */
export function focusInvalidInspector(root: HTMLElement | null): boolean {
  const invalid = root?.querySelector<HTMLElement>(
    '[data-inspector-invalid="true"], input[aria-invalid="true"], select[aria-invalid="true"], input:invalid, select:invalid',
  );
  if (!invalid) return false;
  const section = invalid.closest<HTMLElement>('[data-inspector-panel]');
  const tab = section?.getAttribute('aria-labelledby');
  if (tab) document.getElementById(tab)?.click();
  for (
    let parent = invalid.parentElement;
    parent && parent !== root;
    parent = parent.parentElement
  )
    if (parent instanceof HTMLDetailsElement) parent.open = true;
  requestAnimationFrame(() => {
    const field = invalid.matches('input,select,button')
      ? invalid
      : (invalid.querySelector<HTMLElement>(
          'input[aria-invalid="true"], input:invalid, select[aria-invalid="true"], select:invalid',
        ) ?? invalid.querySelector<HTMLElement>('input, select, button'));
    field?.focus();
  });
  return true;
}
