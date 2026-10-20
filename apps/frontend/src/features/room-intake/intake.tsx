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
import styles from './intake.module.css';
import { draftFromPhotos, recognitionAvailability } from './recognition-client';
import { CaptureGuide } from './capture-guide';
import { PhotoViewer } from './photo-viewer';
import { EXAMPLE_PHOTOS, loadExamplePhotos } from './example-photos';
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
    [owned, setOwned] = useState(state.draft.room.intent.condition !== 'empty');
  const [reviewVisited, setReviewVisited] = useState(state.stage === 'review');
  if (!reviewVisited && state.stage === 'review') setReviewVisited(true);
  const motion = useSurfaceMotion(state.stage);
  const exampleAbort = useRef<AbortController | null>(null);
  const [examplesBusy, setExamplesBusy] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false),
    [viewing, setViewing] = useState<{
      source: 'example' | 'photo';
      id: string;
    } | null>(null);
  const photoTrigger = useRef<HTMLButtonElement | null>(null);
  const openPhoto = (
    source: 'example' | 'photo',
    id: string,
    trigger: HTMLButtonElement,
  ) => {
    photoTrigger.current = trigger;
    setViewing({ source, id });
  };
  const closePhoto = () => {
    setViewing(null);
    requestAnimationFrame(() => {
      if (photoTrigger.current?.isConnected)
        photoTrigger.current.focus({ preventScroll: true });
    });
  };
  const viewerItems =
    viewing?.source === 'example'
      ? EXAMPLE_PHOTOS.map((p) => ({ id: p.path, url: p.path, label: p.label }))
      : state.photos.flatMap((p, i) =>
          p.previewUrl
            ? [{ id: p.id, url: p.previewUrl, label: `Room photo ${i + 1}` }]
            : [],
        );
  useEffect(
    () => () => {
      exampleAbort.current?.abort();
    },
    [controller],
  );
  const addExamples = async () => {
    if (exampleAbort.current || availability?.mode !== 'fake') return;
    const abort = new AbortController();
    exampleAbort.current = abort;
    const release = controller.session.ownResource(() => abort.abort());
    if (!release) {
      exampleAbort.current = null;
      controller.notify(
        'Photo preparation is busy. Try again when the current task finishes.',
      );
      return;
    }
    setExamplesBusy(true);
    try {
      const photos = await loadExamplePhotos(abort.signal);
      if (abort.signal.aborted) return;
      photos.forEach((photo, i) =>
        controller.addPhotos([photo], EXAMPLE_PHOTOS[i]!.purpose),
      );
    } catch {
      if (!abort.signal.aborted)
        controller.notify(
          'The example photos could not load. Choose your photos or try again.',
        );
    } finally {
      if (!abort.signal.aborted) setExamplesBusy(false);
      release();
      if (exampleAbort.current === abort) exampleAbort.current = null;
    }
  };
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
    controller.addPhotos(Array.from(list), 'auto');
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
        <button
          className="glass-control"
          onClick={() => {
            if (leave()) onBack();
          }}
        >
          ← Room choices
        </button>
      </header>
      <main id="main-content" className={styles.main}>
        <div ref={motion} className="motion-surface">
          <div className={`motion-flow ${styles.flow}`}>
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
                    ? 'Review the example sketch.'
                    : 'Review your rough sketch.'}
              </h1>
            </div>
            {state.stage === 'photos' ? (
              <div
                className={styles.photoLayout}
                data-examples={availability?.mode === 'fake'}
              >
                <div className={styles.photoMain}>
                  <section
                    className={styles.upload}
                    aria-label="Local room photos"
                  >
                    <div className={styles.uploadHeading}>
                      <h2>
                        {state.photos.length
                          ? 'Your room photos.'
                          : 'A few photos. A new perspective.'}
                      </h2>
                      {state.photos.length > 0 && (
                        <button
                          type="button"
                          className={styles.guideToggle}
                          onClick={() => setGuideOpen((v) => !v)}
                        >
                          {guideOpen ? 'Show photos' : 'Photo guide'}
                        </button>
                      )}
                    </div>
                    <div className={styles.captureArea}>
                      {!state.photos.length || guideOpen ? (
                        <CaptureGuide />
                      ) : (
                        <ul
                          className={styles.photos}
                          tabIndex={0}
                          aria-label="Selected room photos"
                        >
                          {state.photos.map((photo, index) => (
                            <li
                              key={photo.id}
                              data-photo-id={photo.id}
                              {...(process.env.NODE_ENV === 'development'
                                ? {
                                    'data-decode-ms': Math.round(
                                      photo.decodeMs,
                                    ),
                                    'data-prepare-ms': Math.round(
                                      photo.prepareMs,
                                    ),
                                    'data-normalized-bytes':
                                      photo.normalizedBytes,
                                  }
                                : {})}
                            >
                              <div className={styles.photoPreview}>
                                {photo.previewUrl ? (
                                  <button
                                    type="button"
                                    className={styles.photoOpen}
                                    aria-label={`View photo ${index + 1}`}
                                    onClick={(e) =>
                                      openPhoto(
                                        'photo',
                                        photo.id,
                                        e.currentTarget,
                                      )
                                    }
                                  >
                                    <Image
                                      src={photo.previewUrl}
                                      width={640}
                                      height={480}
                                      alt={`Local preview of photo ${index + 1}`}
                                      unoptimized
                                    />
                                    <span aria-hidden="true">View ↗</span>
                                  </button>
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
                              {photo.message && (
                                <p role="alert" className={styles.error}>
                                  {photo.message}
                                </p>
                              )}
                              <div className={styles.actions}>
                                <button
                                  onClick={() =>
                                    controller.photos.remove(photo.id)
                                  }
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
                    </div>
                    <div className={styles.photoHelp}>
                      <p className={styles.hint}>
                        Still JPEG, PNG or WebP · Up to 6 photos, 8 MiB each /
                        24 MiB total · Up to 16 MP and 8000 px per side. Export
                        HEIC as JPEG first.
                      </p>
                    </div>
                    <div className={styles.photoFields}>
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
                      {state.photos.length > 0 && (
                        <button
                          className="button primary"
                          disabled={
                            !availability?.capabilities.recognition ||
                            state.recognition !== 'idle' ||
                            state.photos.some((p) => p.status !== 'ready')
                          }
                          aria-describedby={
                            availability?.mode === 'live'
                              ? 'photo-transfer'
                              : undefined
                          }
                          aria-busy={state.recognition !== 'idle'}
                          onClick={() => void draftFromPhotos(controller)}
                        >
                          Continue <span aria-hidden="true">↗</span>
                        </button>
                      )}
                    </div>
                    {availability?.mode === 'live' &&
                      state.photos.length > 0 && (
                        <p id="photo-transfer" className={styles.hint}>
                          Drafting sends prepared photos to the AI provider.
                          Metadata is removed; image details remain visible.
                        </p>
                      )}
                    {state.recognition !== 'idle' && (
                      <div className={styles.drafting} role="status">
                        <span aria-hidden="true" />
                        {state.recognition === 'preparing'
                          ? 'Preparing photos…'
                          : 'Drafting sketch…'}
                        <button onClick={() => controller.cancelDraft()}>
                          Cancel drafting
                        </button>
                      </div>
                    )}
                    {availability !== undefined &&
                      !availability?.capabilities.recognition && (
                        <p className={styles.hint}>
                          Photo drafting is unavailable. Return to Room choices
                          to build manually.
                        </p>
                      )}
                    {reviewVisited && (
                      <button onClick={() => controller.startReview()}>
                        Return to sketch
                      </button>
                    )}
                    {state.message && (
                      <p role="alert" className={styles.error}>
                        {state.message}
                      </p>
                    )}
                  </section>
                </div>
                {availability?.mode === 'fake' && (
                  <div className={styles.startActions}>
                    <section
                      className={styles.examples}
                      aria-label="Example room photos"
                    >
                      <p className={styles.eyebrow}>A ROOM TO EXPLORE</p>
                      <h2>Start with these photos.</h2>
                      <div
                        className={styles.exampleImages}
                        tabIndex={0}
                        aria-label="Example photo gallery"
                      >
                        {EXAMPLE_PHOTOS.map((example, index) => (
                          <figure key={example.path}>
                            <button
                              type="button"
                              className={styles.photoOpen}
                              aria-label={`View ${example.label.toLowerCase()}`}
                              onClick={(e) =>
                                openPhoto(
                                  'example',
                                  example.path,
                                  e.currentTarget,
                                )
                              }
                            >
                              <Image
                                src={example.path}
                                loading={index === 0 ? 'eager' : 'lazy'}
                                width={1280}
                                height={960}
                                alt={example.label}
                                unoptimized
                              />
                              <span aria-hidden="true">View ↗</span>
                            </button>
                            <figcaption>{example.label}</figcaption>
                          </figure>
                        ))}
                      </div>
                      <button
                        disabled={
                          examplesBusy ||
                          state.recognition !== 'idle' ||
                          state.photos.length > 4
                        }
                        aria-busy={examplesBusy}
                        onClick={() => void addExamples()}
                      >
                        {examplesBusy
                          ? 'Preparing examples…'
                          : 'Use example photos'}
                      </button>
                    </section>
                  </div>
                )}
              </div>
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
                          onChange={(e) => setOwned(e.target.value === 'owned')}
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
      {viewing && (
        <PhotoViewer
          items={viewerItems}
          selectedId={viewing.id}
          onSelect={(id) => setViewing({ ...viewing, id })}
          onClose={closePhoto}
          session={controller.session}
        />
      )}
    </div>
  );
}
