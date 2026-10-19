import Image from 'next/image';
import { thumbnailUrl, findCatalogueEntry } from '../catalogue/catalogue';
import { useSurfaceMotion } from './use-surface-motion';
import { AssistantController } from '../assistant/controller';
import { Assistant } from '../assistant/assistant';
import { AssistantTour } from '../assistant/tour';
import { automaticallyOfferTour } from '../assistant/tour-runtime';
import type { CameraPose } from '../room-view/adapter';
import {
  Component,
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import type { ReactNode } from 'react';
import type { RoomCondition } from '../session/entry/entry-state';
import type { SessionController } from '../session/controller';
import type { Panel } from '../session/state';
import { hasBaselineChanges, comparisonFrame } from '../session/state';
import { Brand } from '../landing/brand';
import { createRoomFixture } from '../session/fixtures/rooms';
import { PlanView } from '../plan-view/plan-view';
import { FurnitureInspector, FeatureInspector } from './inspector';
import { CataloguePanel } from './catalogue-panel';
import { RoomPanel } from './room-panel';
import { ChecksPanel } from './checks-panel';
import { failureMessage } from './messages';
import { focusProperties } from './focus';
import { checkRoom } from '@roomedy/spatial';
import { ProjectControls } from './project-controls';
import { PreviewChangeList } from './preview-change-list';
import styles from './editor.module.css';
import { roomSurface, SURFACE_TEXTURES } from '@roomedy/contracts/surfaces';

const Cutaway = lazy(() => import('../room-view/cutaway'));
class CutawayBoundary extends Component<
  { children: ReactNode; fallback: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override componentDidCatch() {
    this.props.onFailure();
  }
  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function Editor({
  controller,
  onBack,
  condition,
  source = 'sample',
}: {
  controller: SessionController;
  onBack: () => void;
  condition: RoomCondition;
  source?: 'sample' | 'own';
}) {
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );
  const [cutawayOpenedAt, setCutawayOpenedAt] = useState(() =>
    performance.now(),
  );
  const panelMotion = useSurfaceMotion(
    `${state.workspace?.workspaceId ?? 'opening'}:${state.presentation.panel}:${state.presentation.panel === 'inspector' ? state.presentation.selectedId : ''}:${state.comparison}`,
  );
  const roomView = state.presentation.roomView;
  // RM-015AC: comparison is temporarily hidden; retain its implementation.
  useEffect(() => {
    if (state.comparison === 'before') controller.setComparison('current');
  }, [controller, state.comparison]);
  const setRoomView = (view: 'plan' | 'cutaway') =>
    controller.setRoomView(view);
  const workspaceId = state.workspace?.workspaceId;
  const [assistant, setAssistant] = useState<AssistantController | null>(null);
  useEffect(() => {
    let live = true,
      owned: AssistantController | null = null;
    queueMicrotask(() => {
      if (!live || !workspaceId) return;
      owned = new AssistantController(controller);
      setAssistant(owned);
    });
    return () => {
      live = false;
      owned?.dispose();
    };
  }, [controller, workspaceId]);

  const cameraStateRef = useMemo(
    () => ({ current: null as CameraPose | null, workspaceId }),
    [workspaceId],
  );
  const [replacementId, setReplacementId] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [state.phase, workspaceId]);
  useEffect(() => {
    if (!state.candidate || state.candidate.source === 'assistant') return;
    const target = previewRef.current;
    target
      ?.querySelector<HTMLButtonElement>('button')
      ?.focus({ preventScroll: true });
    target?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [state.candidate]);
  const workspace = state.workspace;
  if (!workspace)
    return (
      <main id="main-content" className={styles.expired}>
        <Brand />
        <h1 ref={headingRef} tabIndex={-1}>
          {state.phase === 'expired'
            ? 'This room has expired.'
            : 'Open a new room.'}
        </h1>
        {source === 'sample' && (
          <button
            onClick={() =>
              controller.reset(
                createRoomFixture(
                  condition === 'furnished' ? 'sample' : condition,
                ),
              )
            }
          >
            Start a new sample
          </button>
        )}
        <button onClick={onBack}>
          {source === 'own' ? 'Start a new room' : 'Choose another room'}
        </button>
      </main>
    );
  const room = workspace.current,
    view = state.presentation,
    before = state.comparison === 'before',
    readOnly = before || !!state.candidate || state.clientLoadFailure,
    shownRoom = before ? workspace.baseline : (state.candidate?.room ?? room),
    shownChecks = before
      ? checkRoom(shownRoom)
      : (state.candidate?.checks ?? state.checks!),
    inspectionReason = before
      ? 'Before is read-only. Return to Current to edit.'
      : state.clientLoadFailure
        ? 'Export your accepted layout or reload the editor before making more changes.'
        : state.candidate?.source === 'assistant'
          ? 'Current is unchanged. Apply or Cancel this proposal in the assistant before editing.'
          : 'Current is unchanged. Apply or Cancel beside the room before editing these preview values.';
  const item = shownRoom.furniture.find((f) => f.id === view.selectedId),
    feature = shownRoom.room.features.find((f) => f.id === view.selectedId);
  const rotatePlanSelection = (direction: -1 | 1) => {
    const current = controller.getSnapshot();
    if (
      !controller.canEdit() ||
      current.candidate ||
      current.presentation.roomView !== 'plan'
    )
      return;
    const selected = current.workspace?.current.furniture.find(
      (piece) => piece.id === current.presentation.selectedId,
    );
    if (!selected) return;
    const result = controller.dispatch(
      [
        {
          type: 'rotate',
          id: selected.id,
          quarterTurns: ((selected.pose.quarterTurns + direction + 4) % 4) as
            0 | 1 | 2 | 3,
        },
      ],
      'Rotate piece',
    );
    if (!result.ok)
      controller.notify(failureMessage(result, current.workspace?.current));
  };
  const hard = shownChecks.issues.filter((i) => i.severity === 'hard').length;
  const open = (panel: Panel) => {
    setReplacementId(null);
    controller.setPanel(panel);
    focusProperties(controller);
  };
  const leave = () =>
    !hasBaselineChanges(workspace) ||
    window.confirm(
      'Leave this room? Photos and unfinished changes will be lost. Export first to keep a copy.',
    );
  const panels: { id: Panel; label: string }[] = [
    { id: 'inventory', label: 'Furniture' },
    { id: 'catalogue', label: 'Add piece' },
    { id: 'room', label: 'Room' },
    { id: 'checks', label: `Checks${hard ? ` (${hard})` : ''}` },
    { id: 'assistant', label: 'Assistant' },
  ];
  return (
    <div className={styles.studio} data-room-tour-root>
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
        <div className={styles.headerActions}>
          <button
            className="glass-control"
            data-room-target="history"
            aria-disabled={
              !state.undoLabel || before || state.clientLoadFailure
            }
            onClick={() => {
              if (!state.undoLabel || before || state.clientLoadFailure) return;
              const r = assistant ? assistant.undo() : controller.undo();
              if (!r.ok)
                controller.notify(
                  failureMessage(
                    r,
                    controller.getSnapshot().workspace?.current,
                  ),
                );
            }}
            aria-label={
              state.undoLabel ? `Undo: ${state.undoLabel}` : 'Undo last change'
            }
          >
            ↶ <span>Undo</span>
          </button>
          <ProjectControls
            key={workspace.workspaceId}
            controller={controller}
            onNewRoom={onBack}
          />
        </div>
      </header>
      <main id="main-content" className={styles.workspace}>
        <nav className={styles.toolRail} aria-label="Room tools">
          {panels.map((panel) => (
            <button
              key={panel.id}
              hidden={panel.id === 'checks'}
              aria-pressed={view.panel === panel.id}
              onClick={() => open(panel.id)}
            >
              {panel.label}
            </button>
          ))}
          <AssistantTour
            key={workspace.workspaceId}
            controller={controller}
            autoStart={automaticallyOfferTour(state)}
            hideReplay
          />
        </nav>
        <section
          className={styles.canvasColumn}
          aria-label={before ? 'Before room' : 'Current room'}
          data-room-target="canvas"
        >
          <div className={styles.roomToolbar}>
            <div className={styles.canvasHeading}>
              <div>
                <p className={styles.eyebrow}>
                  {before
                    ? 'Before · read-only'
                    : state.candidate
                      ? state.candidate.source === 'assistant'
                        ? 'Proposal preview'
                        : 'Palette preview'
                      : 'Current arrangement'}
                </p>
                <h1 ref={headingRef} tabIndex={-1}>
                  {shownRoom.intent.condition === 'empty'
                    ? 'A little room to begin.'
                    : 'Make this space yours.'}
                </h1>
              </div>
              <span>
                {shownRoom.furniture.length}{' '}
                {shownRoom.furniture.length === 1 ? 'piece' : 'pieces'}
              </span>
            </div>

            <div
              hidden
              className={styles.comparison}
              role="group"
              aria-label="Compare arrangement"
              data-room-target="comparison"
            >
              <button
                aria-pressed={before}
                aria-disabled={!!state.candidate}
                onClick={() => controller.setComparison('before')}
              >
                Before
              </button>
              <button
                aria-pressed={!before}
                aria-disabled={!!state.candidate}
                onClick={() => controller.setComparison('current')}
              >
                Current
              </button>
            </div>
            <div
              className={styles.viewSwitch}
              role="group"
              aria-label="Room view"
            >
              <button
                aria-pressed={roomView === 'plan'}
                onClick={() => setRoomView('plan')}
              >
                2D
              </button>
              <button
                aria-pressed={roomView === 'cutaway'}
                onClick={() => {
                  setCutawayOpenedAt(performance.now());
                  setRoomView('cutaway');
                }}
              >
                3D
              </button>
            </div>
          </div>
          {state.clientLoadFailure && (
            <div className={styles.lifecycleNotice} role="alert">
              <p>
                Some editor tools couldn’t load. Export your layout before
                reloading; photos and unfinished changes won’t be kept.
              </p>
              <button onClick={() => window.location.reload()}>
                Reload editor
              </button>
            </div>
          )}
          {state.expiresSoon && (
            <div className={styles.lifecycleNotice} role="status">
              This room expires in under five minutes. Export to keep your
              layout.
            </div>
          )}

          {roomView === 'plan' ? (
            <div className={styles.planStage}>
              <div className={styles.viewTools} aria-label="Plan view controls">
                <button
                  aria-label="Zoom out"
                  disabled={view.zoom <= 0.6}
                  onClick={() => controller.setView({ zoom: view.zoom - 0.2 })}
                >
                  −
                </button>
                <span>{Math.round(view.zoom * 100)}%</span>
                <button
                  aria-label="Zoom in"
                  disabled={view.zoom >= 3}
                  onClick={() => controller.setView({ zoom: view.zoom + 0.2 })}
                >
                  +
                </button>
                <button
                  onClick={() =>
                    controller.setView({ zoom: 1, panX: 0, panZ: 0 })
                  }
                >
                  Fit room
                </button>
                <div
                  className={styles.panButtons}
                  role="group"
                  aria-label="Pan plan"
                >
                  <button
                    aria-label="Pan left"
                    onClick={() =>
                      controller.setView({ panX: view.panX - 250 })
                    }
                  >
                    ←
                  </button>
                  <button
                    aria-label="Pan up"
                    onClick={() =>
                      controller.setView({ panZ: view.panZ - 250 })
                    }
                  >
                    ↑
                  </button>
                  <button
                    aria-label="Pan down"
                    onClick={() =>
                      controller.setView({ panZ: view.panZ + 250 })
                    }
                  >
                    ↓
                  </button>
                  <button
                    aria-label="Pan right"
                    onClick={() =>
                      controller.setView({ panX: view.panX + 250 })
                    }
                  >
                    →
                  </button>
                </div>
                <div
                  className={styles.rotationButtons}
                  role="group"
                  aria-label="Rotate selected furniture"
                >
                  {([-1, 1] as const).map((direction) => (
                    <button
                      key={direction}
                      aria-label={`Rotate selected piece 90 degrees ${direction === -1 ? 'counterclockwise' : 'clockwise'}`}
                      title={
                        !item
                          ? 'Select a piece to rotate'
                          : item.locks.rotation
                            ? 'Unlock rotation in Advanced settings'
                            : `Rotate 90° ${direction === -1 ? 'counterclockwise' : 'clockwise'}`
                      }
                      disabled={readOnly || !item || item.locks.rotation}
                      onClick={() => rotatePlanSelection(direction)}
                    >
                      {direction === -1 ? '↶' : '↷'} 90°
                    </button>
                  ))}
                </div>
                <label className={styles.snap}>
                  <input
                    type="checkbox"
                    checked={view.snap}
                    onChange={(e) =>
                      controller.setView({ snap: e.target.checked })
                    }
                  />
                  Snap
                </label>
              </div>
              <PlanView controller={controller} state={state} />
            </div>
          ) : (
            <CutawayBoundary
              onFailure={() => controller.clientPartFailed()}
              fallback={
                <>
                  <p role="status">
                    The cutaway could not load. Continue editing in the plan.
                  </p>
                  <PlanView controller={controller} state={state} />
                </>
              }
            >
              <Suspense
                fallback={
                  <>
                    <p role="status">Opening the cutaway…</p>
                    <PlanView controller={controller} state={state} />
                  </>
                }
              >
                <Cutaway
                  key={workspace.workspaceId}
                  room={before ? workspace.baseline : room}
                  cameraFrame={comparisonFrame(workspace)}
                  candidate={state.candidate?.room}
                  checks={shownChecks}
                  selectedId={view.selectedId}
                  onSelect={(id) => controller.select(id)}
                  cameraStateRef={cameraStateRef}
                  openedAt={cutawayOpenedAt}
                  onPlan={() => setRoomView('plan')}
                  controller={controller}
                  readOnly={readOnly}
                  snap={view.snap}
                />
              </Suspense>
            </CutawayBoundary>
          )}
          {state.candidate && state.candidate.source !== 'assistant' && (
            <div
              className={styles.previewActions}
              ref={previewRef}
              data-room-target="preview"
            >
              <div>
                <p>{state.candidate.label ?? 'Palette change'} · Preview</p>
                <PreviewChangeList
                  current={room}
                  proposed={state.candidate.room}
                  className={styles.changeList}
                />
              </div>
              <button
                className={styles.primary}
                onClick={() => {
                  const r = controller.applyVisitorPreview();
                  if (!r.ok)
                    controller.notify(
                      failureMessage(
                        r,
                        controller.getSnapshot().workspace?.current,
                      ),
                    );
                  else
                    requestAnimationFrame(() =>
                      headingRef.current?.focus({ preventScroll: true }),
                    );
                }}
              >
                Apply palette
              </button>
              <button
                onClick={() => {
                  controller.cancelPreview();
                  requestAnimationFrame(() =>
                    headingRef.current?.focus({ preventScroll: true }),
                  );
                }}
              >
                Cancel
              </button>
            </div>
          )}
          {view.selectedId && (
            <button
              className={styles.mobileReturn}
              onClick={() => open('inspector')}
            >
              {item?.label ?? feature?.kind ?? 'Selection'} · Edit properties ↗
            </button>
          )}
          <p
            role="status"
            aria-live="polite"
            className={
              !state.message || state.messageKind === 'confirmation'
                ? styles.announcement
                : styles.roomNotice
            }
          >
            {state.message}
          </p>
        </section>
        <aside
          className={`${styles.panel} ${view.panel === 'assistant' ? styles.assistantPanel : ''}`}
          data-room-target="properties"
          tabIndex={-1}
          aria-label="Room properties"
        >
          <div ref={panelMotion} className="motion-surface">
            <div className="motion-flow">
              <button
                className={styles.mobileReturn}
                onClick={() => {
                  headingRef.current?.focus({ preventScroll: true });
                  headingRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  });
                }}
              >
                ↑ Back to {roomView === 'plan' ? 'plan' : 'room'}
              </button>
              {view.panel === 'assistant' &&
                (readOnly && !state.candidate ? (
                  <section
                    className={`${styles.section} ${styles.readOnlyAssistant}`}
                  >
                    <h2>Roomedy assistant</h2>
                    <p>{inspectionReason}</p>
                    {before && (
                      <button
                        onClick={() => controller.setComparison('current')}
                      >
                        Return to Current
                      </button>
                    )}
                  </section>
                ) : assistant ? (
                  <Assistant controller={assistant} roomState={state} />
                ) : (
                  <p role="status">Opening assistant…</p>
                ))}
              {view.panel === 'inventory' && (
                <>
                  <div className={styles.panelTitle}>
                    <p className={styles.eyebrow}>In your room</p>
                    <h2 tabIndex={-1}>Furniture</h2>
                  </div>
                  {shownRoom.furniture.length ? (
                    <ul className={styles.inventory}>
                      {shownRoom.furniture.map((piece) => {
                        const entry = findCatalogueEntry(
                          piece.catalogueId,
                          piece.catalogueVersion,
                        );
                        return (
                          <li key={piece.id}>
                            <button
                              onClick={() => {
                                controller.select(piece.id);
                                focusProperties(controller, piece.id);
                              }}
                            >
                              {entry && (
                                <Image
                                  src={thumbnailUrl(entry)}
                                  width={96}
                                  height={72}
                                  alt=""
                                  unoptimized
                                />
                              )}
                              <strong>{piece.label}</strong>
                              <span>
                                {piece.dimensions.width.value ?? '?'} ×{' '}
                                {piece.dimensions.depth.value ?? '?'} mm ·{' '}
                                {piece.ownership === 'owned'
                                  ? 'Owned'
                                  : 'Proposed'}
                              </span>
                              <span>
                                {piece.preference === 'keep'
                                  ? 'Keep'
                                  : piece.preference === 'replace'
                                    ? 'May replace'
                                    : 'Flexible'}
                                {piece.locks.position
                                  ? ' · Position locked'
                                  : ''}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p>Add your first piece from the curated catalogue.</p>
                  )}
                  <button
                    className={styles.primary}
                    disabled={readOnly}
                    onClick={() => open('catalogue')}
                  >
                    Add a piece
                  </button>
                </>
              )}
              {view.panel === 'inspector' && readOnly ? (
                <section className={styles.section}>
                  <p className={styles.eyebrow}>
                    {before ? 'Before inspection' : 'Read-only inspection'}
                  </p>
                  <h2 tabIndex={-1} id={`properties-${view.selectedId}`}>
                    {shownRoom.furniture.find((p) => p.id === view.selectedId)
                      ?.label ??
                      shownRoom.room.features.find(
                        (f) => f.id === view.selectedId,
                      )?.kind ??
                      'Room'}
                  </h2>
                  <p>{inspectionReason}</p>
                  {(() => {
                    const piece = shownRoom.furniture.find(
                      (p) => p.id === view.selectedId,
                    );
                    return piece ? (
                      <p>
                        {piece.dimensions.width.value ?? '?'} ×{' '}
                        {piece.dimensions.depth.value ?? '?'} ×{' '}
                        {piece.dimensions.height.value ?? '?'} mm ·{' '}
                        {piece.ownership === 'owned' ? 'Owned' : 'Proposed'} ·
                        Similar representation
                      </p>
                    ) : null;
                  })()}
                  {before && (
                    <button onClick={() => controller.setComparison('current')}>
                      Return to Current
                    </button>
                  )}
                </section>
              ) : (
                view.panel === 'inspector' &&
                (item ? (
                  <FurnitureInspector
                    controller={controller}
                    item={item}
                    onReplace={() => {
                      setReplacementId(item.id);
                      controller.setPanel('catalogue');
                    }}
                  />
                ) : feature ? (
                  <FeatureInspector controller={controller} feature={feature} />
                ) : (
                  <>
                    <h2 tabIndex={-1}>Select a piece</h2>
                    <p>Choose furniture or an opening in the plan.</p>
                    <button onClick={() => open('inventory')}>
                      Show furniture
                    </button>
                  </>
                ))
              )}
              {view.panel === 'catalogue' &&
                (readOnly ? (
                  <section className={styles.section}>
                    <h2 tabIndex={-1}>Choose a piece</h2>
                    <p>{inspectionReason}</p>
                    {before ? (
                      <button
                        onClick={() => controller.setComparison('current')}
                      >
                        Return to Current
                      </button>
                    ) : (
                      state.candidate && (
                        <button onClick={() => controller.cancelPreview()}>
                          Cancel preview & choose a piece
                        </button>
                      )
                    )}
                  </section>
                ) : (
                  <CataloguePanel
                    key={replacementId ?? 'add'}
                    controller={controller}
                    room={room}
                    replacement={
                      room.furniture.find((f) => f.id === replacementId) ?? null
                    }
                    onDone={() => setReplacementId(null)}
                  />
                ))}
              {view.panel === 'room' &&
                (readOnly ? (
                  <section className={styles.section}>
                    <p className={styles.eyebrow}>
                      {before
                        ? 'Before inspection'
                        : state.candidate
                          ? 'Preview inspection'
                          : 'Room inspection'}
                    </p>
                    <h2 tabIndex={-1}>
                      {before ? 'Before room' : 'Room inspection'}
                    </h2>
                    <p>
                      {shownRoom.room.width.value ?? '?'} ×{' '}
                      {shownRoom.room.depth.value ?? '?'} ×{' '}
                      {shownRoom.room.height.value ?? '?'} mm
                    </p>
                    <p>
                      Floor:{' '}
                      {
                        SURFACE_TEXTURES[
                          roomSurface(shownRoom.room, 'floor').texture
                        ]
                      }{' '}
                      · {roomSurface(shownRoom.room, 'floor').color}. Walls:{' '}
                      {
                        SURFACE_TEXTURES[
                          roomSurface(shownRoom.room, 'walls').texture
                        ]
                      }{' '}
                      · {roomSurface(shownRoom.room, 'walls').color}.
                    </p>
                    <p>{inspectionReason}</p>
                    {before && (
                      <button
                        onClick={() => controller.setComparison('current')}
                      >
                        Return to Current
                      </button>
                    )}
                  </section>
                ) : (
                  <RoomPanel controller={controller} room={room} />
                ))}
              {view.panel === 'checks' && (
                <ChecksPanel
                  controller={controller}
                  room={shownRoom}
                  checks={shownChecks}
                />
              )}
            </div>
          </div>
        </aside>
      </main>
      <footer className={styles.footer}>
        <span>
          {state.persistence === 'memory-only'
            ? 'Recovery is unavailable. Export to keep this layout.'
            : state.persistence === 'saved'
              ? `Saved in this tab until ${new Date(state.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
              : 'Saving layout…'}
        </span>
      </footer>
    </div>
  );
}
