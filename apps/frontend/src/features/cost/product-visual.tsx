import Image from 'next/image';
import { useState } from 'react';
import type { RoomDocument } from '@roomedy/contracts/room';
import { safeProductImage } from '@roomedy/contracts/sourcing';
import {
  FINISH_COLORS,
  roomSurface,
  SURFACE_TEXTURES,
  WALLS,
} from '@roomedy/contracts/surfaces';
import { findCatalogueEntry } from '@roomedy/spatial';
import { thumbnailUrl } from '../catalogue/catalogue';
import { ChatIcon } from './chat-visuals';
import { ExternalLink } from './external-link';
import styles from './workspace.module.css';

export type ProductReference = {
  label: string;
  color: string;
  texture?: string;
  thumbnail?: string;
};
/** A room illustration is a design reference, never a replacement merchant photo. */
export function productReference(
  room: RoomDocument,
  key: string,
): ProductReference {
  const piece = room.furniture.find((item) => item.id === key);
  if (piece) {
    const entry = findCatalogueEntry(piece.catalogueId, piece.catalogueVersion);
    return {
      label: piece.label,
      color: piece.materials?.bodyColor ?? FINISH_COLORS[piece.finish],
      ...(entry ? { thumbnail: thumbnailUrl(entry) } : {}),
    };
  }
  const surface =
    key === 'surface:floor'
      ? 'floor'
      : WALLS.find((wall) => key === `surface:${wall}`);
  if (surface) {
    const finish = roomSurface(room.room, surface);
    return {
      label: `${surface === 'floor' ? 'Floor' : 'Wall'} · ${SURFACE_TEXTURES[finish.texture]}`,
      color: finish.color,
      texture: finish.texture,
    };
  }
  return { label: 'Room product', color: '#d9c5a6' };
}
export function ProductVisual({
  imageUrl,
  url,
  label,
  simulation,
  reference,
}: {
  imageUrl?: string | null | undefined;
  url: string;
  label: string;
  simulation: boolean;
  reference?: ProductReference | undefined;
}) {
  const [failed, setFailed] = useState(false);
  const src = safeProductImage(imageUrl);
  const fallback = !src || failed;
  return (
    <ExternalLink
      url={url}
      className={`${styles.productImage} ${fallback ? styles.referenceImage : ''}`}
    >
      {!fallback ? (
        <Image
          src={src}
          alt={`${label} · ${simulation ? 'illustrative product photo' : 'source product photo'}`}
          unoptimized
          width={640}
          height={440}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <>
          <div
            className={styles.productReference}
            data-texture={reference?.texture}
            style={{ backgroundColor: reference?.color ?? '#d9c5a6' }}
          >
            {reference?.thumbnail ? (
              <Image
                src={reference.thumbnail}
                alt={`${reference.label} · design reference`}
                unoptimized
                width={240}
                height={180}
              />
            ) : reference?.texture ? (
              <span
                role="img"
                aria-label={`${reference.label} · ${reference.color} design reference`}
              />
            ) : (
              <ChatIcon kind="furniture" />
            )}
          </div>
          <small className={styles.referenceCaption}>Design reference</small>
        </>
      )}
    </ExternalLink>
  );
}
