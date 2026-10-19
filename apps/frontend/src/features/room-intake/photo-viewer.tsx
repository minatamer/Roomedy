import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import type { SessionController } from '../session/controller';
import styles from './photo-viewer.module.css';
export interface PhotoView {
  id: string;
  url: string;
  label: string;
}
export function PhotoViewer({
  items,
  selectedId,
  onSelect,
  onClose,
  session,
}: {
  items: readonly PhotoView[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
  session: SessionController;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    closeRef = useRef(onClose),
    live = useRef(false);
  const index = items.findIndex((p) => p.id === selectedId),
    item = items[index];
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    live.current = true;
    const node = dialog.current;
    node?.showModal();
    const own = session.ownResource(() => {
      if (live.current) closeRef.current();
    });
    return () => {
      live.current = false;
      own?.();
      node?.close();
    };
  }, [session]);
  useEffect(() => {
    if (!item) closeRef.current();
  }, [item]);
  if (!item || typeof document === 'undefined') return null;
  const step = (direction: number) =>
    onSelect(items[(index + direction + items.length) % items.length]!.id);
  return createPortal(
    <dialog
      ref={dialog}
      className={styles.viewer}
      aria-labelledby="photo-view-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault();
          step(e.key === 'ArrowLeft' ? -1 : 1);
        }
      }}
    >
      <header>
        <h2 id="photo-view-title">{item.label}</h2>
        <button type="button" onClick={onClose} aria-label="Close photo">
          ✕
        </button>
      </header>
      <div className={styles.image}>
        <Image
          src={item.url}
          width={1280}
          height={960}
          alt={item.label}
          unoptimized
        />
      </div>
      <footer>
        <button
          type="button"
          aria-label="Previous photo"
          onClick={() => step(-1)}
          disabled={items.length < 2}
        >
          ←
        </button>
        <p aria-live="polite">
          {index + 1} / {items.length}
        </p>
        <button
          type="button"
          aria-label="Next photo"
          onClick={() => step(1)}
          disabled={items.length < 2}
        >
          →
        </button>
      </footer>
    </dialog>,
    document.body,
  );
}
