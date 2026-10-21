import { useSurfaceMotion } from '../room-editor/use-surface-motion';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import { Brand } from '../landing/brand';
import type { ReviewController } from './review-controller';
import styles from './intake.module.css';
import { draftFromPhotos, recognitionAvailability } from './recognition-client';
import { CaptureGuide } from './capture-guide';
import { PhotoViewer } from './photo-viewer';
import { PhotoProcessing } from './processing';
import { EXAMPLE_PHOTOS, loadExamplePhotos } from './example-photos';
import type { PublicConfig } from '@roomedy/contracts/api';
import { PUBLIC_LIMITS } from '@roomedy/contracts/policy';

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
  );
  const processing = state.recognition !== 'idle';
  const motion = useSurfaceMotion(processing ? 'processing' : 'photos');
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
    if (exampleAbort.current) return;
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
      controller.addPhotos(photos, 'auto');
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
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!processing) {
      heading.current?.focus({ preventScroll: true });
      heading.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [processing]);
  const leave = () => {
    if (state.photos.length || state.draft.revision > 0) {
      if (
        !window.confirm(
          'Leave this room? Selected photos in this tab will be lost.',
        )
      )
        return false;
    }
    return true;
  };
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
            {state.recognition !== 'idle' ? (
              <PhotoProcessing
                phase={state.recognition}
                photos={state.photos}
                onCancel={() => controller.cancelDraft()}
              />
            ) : (
              <>
                <div className={styles.title}>
                  <p className={styles.eyebrow}>
                    Your room, your starting point
                  </p>
                  <h1 ref={heading} tabIndex={-1}>
                    Bring the room into view.
                  </h1>
                </div>
                <div className={styles.photoLayout}>
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
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className={styles.photoHelp}>
                        <p className={styles.hint}>
                          Still JPEG, PNG or WebP · Up to 6 photos, 8 MiB each /
                          24 MiB total · Up to 16 MP and 8000 px per side.
                          Export HEIC as JPEG first.
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
                            onClick={() =>
                              void draftFromPhotos(controller, fetch, {
                                openStudio: true,
                                previewProcessing:
                                  availability?.mode === 'fake',
                              })
                            }
                          >
                            Continue <span aria-hidden="true">↗</span>
                          </button>
                        )}
                      </div>
                      {availability?.mode === 'live' &&
                        state.photos.length > 0 && (
                          <p id="photo-transfer" className={styles.hint}>
                            Continue sends prepared photos to the AI provider.
                            Metadata is removed; image details remain visible.
                          </p>
                        )}
                      {availability !== undefined &&
                        !availability?.capabilities.recognition && (
                          <p className={styles.hint}>
                            Photo processing is unavailable. Return to Room
                            choices to build manually.
                          </p>
                        )}
                      {state.message && (
                        <p role="alert" className={styles.error}>
                          {state.message}
                        </p>
                      )}
                    </section>
                  </div>
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
                            </button>
                            <figcaption>{example.label}</figcaption>
                          </figure>
                        ))}
                      </div>
                      <button
                        disabled={
                          examplesBusy ||
                          state.recognition !== 'idle' ||
                          state.photos.length + EXAMPLE_PHOTOS.length >
                            PUBLIC_LIMITS.photos
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
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      {viewing && !processing && (
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
