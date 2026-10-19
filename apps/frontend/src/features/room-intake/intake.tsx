import { useSurfaceMotion } from '../room-editor/use-surface-motion';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import { CATALOGUE } from '@roomedy/spatial';
import { thumbnailUrl } from '../catalogue/catalogue';
import { Brand } from '../landing/brand';
import { nextQuestion } from './draft';
import { RoughSketch } from './rough-sketch';
import { ReviewPanel } from './review-panel';
import type { ReviewController } from './review-controller';
import type { PhotoPurpose } from './photo-store';
import styles from './intake.module.css';
import { draftFromPhotos, recognitionAvailability } from './recognition-client';
import type { PublicConfig } from '@roomedy/contracts/api';

export function Intake({
  controller,
  onBack,
}: {
  controller: ReviewController;
  onBack: () => void;
}) {
  const state = useSyncExternalStore(
      controller.subscribe,
      controller.getSnapshot,
      controller.getSnapshot,
    ),
    [purpose, setPurpose] = useState<PhotoPurpose>('room'),
    [owned, setOwned] = useState(state.draft.room.intent.condition !== 'empty');
  const motion = useSurfaceMotion(state.stage);
  const [availability, setAvailability] = useState<
    PublicConfig | null | undefined
  >(undefined);
  useEffect(() => {
    const abort = new AbortController();
    void recognitionAvailability(abort.signal).then((config) => {
      if (!abort.signal.aborted) setAvailability(config);
    });
    return () => abort.abort();
  }, []);
  const panel = useRef<HTMLDivElement>(null),
    heading = useRef<HTMLHeadingElement>(null),
    question = nextQuestion(state.draft, state.selectedId);
  const hard = state.checks.issues.filter((i) => i.severity === 'hard').length,
    incomplete = state.checks.coverage.filter(
      (c) => c.status === 'unassessed' || c.unassessed > 0,
    ).length;
  const approximate = [
    state.draft.room.room.width,
    state.draft.room.room.depth,
  ].some((m) => m.status !== 'confirmed');
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [state.stage]);
  const leave = () => {
    if (state.photos.length || state.draft.revision > 0) {
      if (
        !window.confirm(
          'Leave this room? Selected photos and review changes in this tab will be lost.',
        )
      )
        return false;
    }
    return true;
  };
  const select = (id: string) => {
    controller.select(id);
  };
  const focusPanel = () =>
    requestAnimationFrame(() => {
      const target = panel.current?.querySelector<HTMLElement>('h2');
      target?.focus({ preventScroll: true });
      target?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  const files = (list: FileList | null) => {
    if (!list) return;
    if (list.length > 6) {
      controller.notify('Choose up to six photos at a time.');
      return;
    }
    controller.addPhotos(Array.from(list), purpose);
  };
  return (
    <div className={styles.intake}>
      <header className={styles.header}>
        <div
          onClickCapture={(e) => {
            if (!leave()) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
        >
          <Brand />
        </div>
        <span>Bring your room together</span>
        <button
          onClick={() => {
            if (leave()) onBack();
          }}
        >
          Change room
        </button>
      </header>
      <main id="main-content" className={styles.main}>
        <div ref={motion} className="motion-surface">
          <div className="motion-flow">
            <div className={styles.title}>
              <p className={styles.eyebrow}>
                {state.stage === 'photos'
                  ? 'Your room, your starting point'
                  : 'Review before the studio'}
              </p>
              <h1 ref={heading} tabIndex={-1}>
                {state.stage === 'photos'
                  ? 'Bring the room into view.'
                  : state.simulated
                    ? 'Review the sample sketch.'
                    : 'Review your rough sketch.'}
              </h1>
            </div>
            {state.stage === 'photos' ? (
              <>
                <section
                  className={styles.upload}
                  aria-label="Local room photos"
                >
                  <div>
                    <h2>Photos, if you have them.</h2>
                    <p>
                      Show corners, doors, windows and fixed features. Furniture
                      details help identify pieces, but cannot establish the
                      room’s scale.
                    </p>
                  </div>
                  <label>
                    Photo kind
                    <select
                      value={purpose}
                      onChange={(e) =>
                        setPurpose(e.target.value as PhotoPurpose)
                      }
                    >
                      <option value="room">Room views</option>
                      <option value="furniture">Furniture details</option>
                    </select>
                  </label>
                  <label className={styles.fileButton}>
                    Choose photos
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={(e) => {
                        files(e.target.files);
                        e.target.value = '';
                      }}
                    />
                  </label>
                  <p className={styles.hint}>
                    Still JPEG, PNG or WebP · Up to 6 photos, 8 MiB each / 24
                    MiB total · Up to 16 MP and 8000 px per side. Export HEIC as
                    JPEG first.
                  </p>
                  {state.message && (
                    <p role="alert" className={styles.error}>
                      {state.message}
                    </p>
                  )}
                </section>
                {state.photos.length > 0 && (
                  <ul className={styles.photos}>
                    {state.photos.map((photo, index) => (
                      <li
                        key={photo.id}
                        data-photo-id={photo.id}
                        {...(process.env.NODE_ENV === 'development'
                          ? {
                              'data-decode-ms': Math.round(photo.decodeMs),
                              'data-prepare-ms': Math.round(photo.prepareMs),
                              'data-normalized-bytes': photo.normalizedBytes,
                            }
                          : {})}
                      >
                        <div className={styles.photoPreview}>
                          {photo.previewUrl ? (
                            <Image
                              src={photo.previewUrl}
                              width={640}
                              height={480}
                              alt={`Local preview of photo ${index + 1}`}
                              unoptimized
                            />
                          ) : (
                            <p
                              className={
                                photo.status === 'queued' ||
                                photo.status === 'processing'
                                  ? styles.processing
                                  : undefined
                              }
                            >
                              {photo.status === 'failed'
                                ? 'Could not open photo'
                                : photo.status === 'queued'
                                  ? 'Waiting to prepare…'
                                  : 'Preparing photo…'}
                            </p>
                          )}
                        </div>
                        <label>
                          Photo {index + 1} type
                          <select
                            value={photo.purpose}
                            onChange={(e) =>
                              controller.photos.purpose(
                                photo.id,
                                e.target.value as PhotoPurpose,
                              )
                            }
                          >
                            <option value="room">Room view</option>
                            <option value="furniture">Furniture detail</option>
                          </select>
                        </label>
                        {photo.message && (
                          <p role="alert" className={styles.error}>
                            {photo.message}
                          </p>
                        )}
                        <div className={styles.actions}>
                          <button
                            onClick={() => controller.photos.remove(photo.id)}
                          >
                            Remove photo {index + 1}
                          </button>
                          <button
                            disabled={index === 0}
                            aria-label={`Move photo ${index + 1} earlier`}
                            onClick={() =>
                              controller.photos.reorder(photo.id, -1)
                            }
                          >
                            ↑
                          </button>
                          <button
                            disabled={index === state.photos.length - 1}
                            aria-label={`Move photo ${index + 1} later`}
                            onClick={() =>
                              controller.photos.reorder(photo.id, 1)
                            }
                          >
                            ↓
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {state.photos.length > 0 && (
                  <p className={styles.hint}>
                    Add a replacement before removing a photo. Measurements stay
                    in the sketch.
                  </p>
                )}
                <div className={styles.startActions}>
                  <div>
                    <p id="photo-transfer">
                      {availability === undefined
                        ? 'Checking photo drafting…'
                        : availability?.capabilities.recognition
                          ? availability.mode === 'fake'
                            ? 'Opening the sample sketch sends prepared photos to Roomedy.'
                            : 'Drafting sends prepared photos to the AI provider. Metadata is removed; image details remain visible.'
                          : 'Photo drafting is unavailable. Your selected photos stay local.'}
                    </p>
                    <button
                      className={styles.primary}
                      disabled={
                        !availability?.capabilities.recognition ||
                        state.recognition !== 'idle' ||
                        !state.photos.length ||
                        state.photos.some((p) => p.status !== 'ready')
                      }
                      aria-describedby="photo-transfer"
                      aria-busy={state.recognition !== 'idle'}
                      onClick={() => void draftFromPhotos(controller)}
                    >
                      {availability?.mode === 'fake'
                        ? 'Open sample sketch'
                        : 'Draft my room'}
                    </button>
                    {state.recognition !== 'idle' && (
                      <div className={styles.drafting} role="status">
                        <span aria-hidden="true" />{' '}
                        {state.recognition === 'preparing'
                          ? 'Preparing photos…'
                          : 'Drafting sketch…'}{' '}
                        <button onClick={() => controller.cancelDraft()}>
                          Cancel drafting
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    className={styles.primary}
                    onClick={() => {
                      controller.startReview();
                    }}
                  >
                    Set up the rough sketch manually ↗
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className={styles.reviewTools}>
                  <button onClick={() => controller.showPhotos()}>
                    ← Photos
                  </button>
                  <button
                    aria-disabled={!state.undo}
                    onClick={() => {
                      if (state.undo) controller.undo();
                    }}
                  >
                    ↶ Undo review change
                  </button>
                  <button
                    onClick={() => {
                      controller.select(state.draft.room.roomId);
                      focusPanel();
                    }}
                  >
                    Room measurements
                  </button>
                </div>
                <div className={styles.reviewLayout}>
                  <section
                    className={styles.sketchColumn}
                    aria-label="Rough 2D review"
                  >
                    {question && (
                      <div className={styles.question}>
                        <p>{question.text}</p>
                        <button
                          onClick={() => {
                            controller.select(question.id);
                            requestAnimationFrame(() => {
                              const wrapper =
                                panel.current?.querySelector<HTMLElement>(
                                  `[data-review-field="${question.field}"]`,
                                );
                              const input =
                                wrapper?.querySelector<HTMLElement>(
                                  'input, select',
                                ) ?? wrapper;
                              input?.focus();
                              input?.scrollIntoView({
                                behavior: 'smooth',
                                block: 'center',
                              });
                            });
                          }}
                        >
                          Review this
                        </button>
                      </div>
                    )}
                    <RoughSketch
                      draft={state.draft}
                      selectedId={state.selectedId}
                      question={question}
                      onSelect={select}
                    />
                    <button
                      className={styles.mobileProperties}
                      onClick={focusPanel}
                    >
                      Edit selected properties ↗
                    </button>
                    <div
                      className={styles.inventory}
                      role="group"
                      aria-label="Sketch inventory"
                    >
                      {[
                        ...state.draft.room.furniture.map((p) => ({
                          id: p.id,
                          label: p.label,
                        })),
                        ...state.draft.room.room.features.map((f) => ({
                          id: f.id,
                          label: `${f.kind} · ${f.wall === 'unknown' ? 'wall unknown' : f.wall}`,
                        })),
                      ].map((item) => (
                        <button
                          key={item.id}
                          aria-pressed={state.selectedId === item.id}
                          onClick={() => {
                            select(item.id);
                            focusPanel();
                          }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                    <section className={styles.catalogueSection}>
                      <div>
                        <h2>
                          {owned
                            ? 'Add an existing piece'
                            : 'Choose an essential'}
                        </h2>
                        <label>
                          Add as
                          <select
                            value={owned ? 'owned' : 'proposed'}
                            onChange={(e) =>
                              setOwned(e.target.value === 'owned')
                            }
                          >
                            <option value="owned">Existing furniture</option>
                            <option value="proposed">Planned essential</option>
                          </select>
                        </label>
                      </div>
                      {owned || state.draft.frameReviewed ? (
                        <div className={styles.catalogue}>
                          {CATALOGUE.map((entry) => (
                            <button
                              key={entry.id}
                              onClick={() => {
                                controller.addPiece(entry.id, owned);
                                focusPanel();
                              }}
                            >
                              <Image
                                src={thumbnailUrl(entry)}
                                width={150}
                                height={110}
                                alt=""
                                unoptimized
                              />
                              <strong>{entry.label}</strong>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className={styles.hint}>
                          Review the rectangular room shape before choosing
                          planned essentials.
                        </p>
                      )}
                    </section>
                  </section>
                  <aside ref={panel} className={styles.panel}>
                    <button
                      className={styles.mobileProperties}
                      onClick={() => {
                        heading.current?.focus({ preventScroll: true });
                        heading.current?.scrollIntoView({
                          behavior: 'smooth',
                          block: 'start',
                        });
                      }}
                    >
                      ↑ Back to sketch
                    </button>
                    <ReviewPanel
                      state={state}
                      controller={controller}
                      onFocusSelected={focusPanel}
                    />
                  </aside>
                </div>
                <div className={styles.acceptBar}>
                  <div>
                    <p>
                      {hard
                        ? `${hard} space ${hard === 1 ? 'issue' : 'issues'}`
                        : 'No blocking issue in the modeled checks'}{' '}
                      · {incomplete} incomplete{' '}
                      {incomplete === 1 ? 'check' : 'checks'}
                    </p>
                    {!state.draft.frameReviewed && (
                      <p className={styles.hint}>
                        Review the room shape to continue.
                      </p>
                    )}
                    {state.photos.length > 0 && (
                      <p className={styles.hint}>
                        Photo previews are cleared when you open the studio.
                      </p>
                    )}
                  </div>
                  <button
                    className={styles.primary}
                    disabled={
                      state.draft.shape !== 'rectangle' ||
                      !state.draft.frameReviewed
                    }
                    onClick={() => controller.accept()}
                  >
                    {approximate
                      ? 'Open approximate room'
                      : 'Accept room & open studio'}{' '}
                    ↗
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
