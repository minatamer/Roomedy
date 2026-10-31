import Image from 'next/image';
import { findCatalogueEntry } from '@roomedy/spatial';
import type { RoomDocument } from '@roomedy/contracts/room';
import { thumbnailUrl } from '../catalogue/catalogue';
import { marketTargets } from './market-research';
import { ChatIcon } from './chat-visuals';
import styles from './workspace.module.css';

export function OptionsPrompt({
  room,
  disabled,
  onFind,
}: {
  room: RoomDocument;
  disabled: boolean;
  onFind: () => void;
}) {
  return (
    <section
      className={styles.optionsPrompt}
      aria-label="Find prices for your room"
    >
      <button
        className={`glass-control ${styles.findOptionsAction}`}
        disabled={disabled}
        onClick={onFind}
      >
        <ChatIcon kind="search" /> Find options for my room{' '}
        <span aria-hidden="true">→</span>
      </button>
      <ul
        className={styles.optionsTargets}
        aria-label="Items to find options for"
      >
        {marketTargets(room).map((target) => {
          const itemTarget = target.brief.target;
          const piece =
            itemTarget.kind === 'furniture'
              ? room.furniture.find((item) => item.id === itemTarget.id)
              : null;
          const entry = piece
            ? findCatalogueEntry(piece.catalogueId, piece.catalogueVersion)
            : null;
          return (
            <li key={target.key}>
              {entry ? (
                <Image
                  src={thumbnailUrl(entry)}
                  width={64}
                  height={48}
                  alt=""
                />
              ) : (
                <ChatIcon
                  kind={
                    target.group === 'Flooring'
                      ? 'floor'
                      : target.group === 'Wall paint'
                        ? 'walls'
                        : 'furniture'
                  }
                />
              )}
              <span>
                <strong>{target.label}</strong>
                <small>{target.group}</small>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
