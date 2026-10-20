import { featureLabel } from '@roomedy/spatial';
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
import type { MedyControl, MedyControlResult } from '@roomedy/spatial';
import { MedyIcon } from '../assistant/medy-icon';
import { cameraViewPose } from '../room-view/camera';
import { ProjectControls } from './project-controls';
import { PreviewChangeList } from './preview-change-list';
import { CataloguePlacement } from './catalogue-placement';
import { CataloguePlacementHint } from './catalogue-placement-ui';
import styles from './editor.module.css';
import { FrameControls, ViewControls } from './view-controls';
import { furnitureOpening, featureOpening } from '../room-view/articulation';
import { OpeningPreview } from './opening-preview';
import controlsStyles from './view-controls.module.css';
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
  const placement = useMemo(
    () => new CataloguePlacement(controller),
    [controller],
  );
  useEffect(() => () => placement.dispose(), [placement]);
  const adding = useSyncExternalStore(
    placement.subscribe,
    placement.getEntry,
    placement.getEntry,
  );
  const [catalogueCategory, setCatalogueCategory] = useState('all');
  const [cutawayOpenedAt, setCutawayOpenedAt] = useState(() =>
    performance.now(),
  );
  const panelMotion = useSurfaceMotion(
    `${state.workspace?.workspaceId ?? 'opening'}:${state.presentation.panel}:${state.presentation.panel === 'inspector' ? state.presentation.selectedId : ''}:${state.comparison}`,
  );
  const roomView = state.presentation.roomView;
  const [arranging, setArranging] = useState(false);
  const [opening, setOpening] = useState({ context: '', open: false });
  const planToolsMotion = useSurfaceMotion(`${roomView}:${arranging}`);
  // RM-015AC: comparison is temporarily hidden; retain its implementation.
  useEffect(() => {
    if (state.comparison === 'before') controller.setComparison('current');
  }, [controller, state.comparison]);
  const setRoomView = (view: 'plan' | 'cutaway') =>
    controller.setRoomView(view);
  const workspaceId = state.workspace?.workspaceId;
  const medyControl = useRef<(control: MedyControl) => MedyControlResult>(
    () => ({
      ok: false,
      summary: 'The studio is still opening. Try that again in a moment.',
    }),
  );
  const projectControl = useRef<
    | ((
        control: Extract<MedyControl, { type: 'project' }>,
      ) => MedyControlResult)
    | null
  >(null);
  const tourControl = useRef<(() => void) | null>(null);
  const registerProject = useMemo(
    () => (handler: typeof projectControl.current) => {
      projectControl.current = handler;
    },
    [],
  );
  const registerTour = useMemo(
    () => (handler: (() => void) | null) => {
      tourControl.current = handler;
    },
    [],
  );
  const [medyCamera, setMedyCamera] = useState<
    | (Extract<MedyControl, { type: 'camera' }> & {
        sequence: number;
        workspaceId: string;
      })
    | null
  >(null);
  const cameraSerial = useRef(0);
  const cameraAvailability = useRef<'opening' | 'ready' | 'unavailable'>(
    'opening',
  );
  const updateCameraAvailability = useMemo(
    () => (availability: typeof cameraAvailability.current) => {
      cameraAvailability.current = availability;
    },
    [],
  );
  const consumeCamera = useMemo(
    () => (sequence: number) =>
      setMedyCamera((current) =>
        current?.sequence === sequence ? null : current,
      ),
    [],
  );
  const [assistant, setAssistant] = useState<AssistantController | null>(null);
  useEffect(() => {
    let live = true,
      owned: AssistantController | null = null;
    queueMicrotask(() => {
      if (!live || !workspaceId) return;
      owned = new AssistantController(controller, {
        control: (control) => medyControl.current(control),
      });
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
  useEffect(() => {
    medyControl.current = (control) => {
      const current = controller.getSnapshot(),
        room = current.candidate?.room ?? current.workspace?.current;
      if (!room || !controller.checkExpiry())
        return {
          ok: false,
          summary: 'Open a room first, and we can work on it together.',
        };
      const done = (summary: string): MedyControlResult => ({
        ok: true,
        summary,
      });
      const openPanel = (panel: Panel) => {
        placement.cancel();
        setCatalogueCategory('all');
        setReplacementId(null);
        controller.setPanel(panel);
      };
      switch (control.type) {
        case 'view':
          if (control.view === 'cutaway') setCutawayOpenedAt(performance.now());
          setMedyCamera(null);
          controller.setRoomView(control.view);
          return done(
            control.view === 'plan'
              ? 'Here’s your 2D plan.'
              : 'Opening your room in 3D.',
          );
        case 'camera': {
          const view = current.presentation;
          if (
            view.roomView === 'plan' &&
            [
              'zoom-in',
              'zoom-out',
              'fit',
              'left',
              'right',
              'up',
              'down',
            ].includes(control.kind)
          ) {
            if (control.kind === 'fit')
              controller.setView({ zoom: 1, panX: 0, panZ: 0 });
            else if (control.kind === 'zoom-in' || control.kind === 'zoom-out')
              controller.setView({
                zoom: view.zoom + (control.kind === 'zoom-in' ? 0.2 : -0.2),
              });
            else
              controller.setView({
                panX:
                  view.panX +
                  (control.kind === 'left'
                    ? -250
                    : control.kind === 'right'
                      ? 250
                      : 0),
                panZ:
                  view.panZ +
                  (control.kind === 'up'
                    ? -250
                    : control.kind === 'down'
                      ? 250
                      : 0),
              });
            return done(
              control.kind === 'fit'
                ? 'The whole plan is in view.'
                : 'Adjusted your plan view.',
            );
          }
          if (
            current.clientLoadFailure ||
            (view.roomView === 'cutaway' &&
              cameraAvailability.current === 'unavailable')
          )
            return {
              ok: false,
              summary:
                'The 3D view is unavailable here. Ask me to switch to 2D so we can keep working.',
            };
          if (
            ['overview', 'doorway', 'work-area', 'corner'].includes(
              control.kind,
            ) &&
            !cameraViewPose(
              room,
              control.kind as 'overview' | 'doorway' | 'work-area' | 'corner',
            )
          )
            return {
              ok: false,
              summary:
                control.kind === 'work-area'
                  ? 'Add a desk first, then I can show its work-area view.'
                  : 'That viewpoint needs a known room frame and doorway position. We can use Overview meanwhile.',
            };
          if (view.roomView !== 'cutaway') {
            setCutawayOpenedAt(performance.now());
            controller.setRoomView('cutaway');
          }
          setMedyCamera({
            ...control,
            sequence: ++cameraSerial.current,
            workspaceId: current.workspace!.workspaceId,
          });
          return done('Moving the camera to your requested view.');
        }
        case 'arrange':
          if (control.enabled && (!controller.canEdit() || current.candidate))
            return {
              ok: false,
              summary:
                'Apply or cancel the current preview before arranging the room.',
            };
          placement.cancel();
          setArranging(control.enabled);
          return done(
            control.enabled
              ? 'Arrange room is on. You can move pieces directly.'
              : 'Explore view is on.',
          );
        case 'snap':
          controller.setView({ snap: control.enabled });
          return done(`Placement snap is ${control.enabled ? 'on' : 'off'}.`);
        case 'select':
          if (control.id === room.roomId) openPanel('room');
          else controller.select(control.id);
          return done(
            control.id
              ? 'Selected. Its details are ready to edit.'
              : 'Selection cleared.',
          );
        case 'panel':
          openPanel(control.panel);
          return done(
            `Opened ${control.panel === 'inventory' ? 'your furniture' : control.panel === 'checks' ? 'the room checks' : control.panel === 'assistant' ? 'Medy' : `the ${control.panel} panel`}.`,
          );
        case 'tour':
          if (!tourControl.current)
            return {
              ok: false,
              summary:
                'The tour is still getting ready. Try again in a moment.',
            };
          tourControl.current();
          return done('Of course — let me show you around.');
        case 'project':
          return (
            projectControl.current?.(control) ?? {
              ok: false,
              summary:
                'Project controls are still opening. Try again in a moment.',
            }
          );
        default:
          return {
            ok: false,
            summary: 'Use Apply, Cancel or Undo beside this conversation.',
          };
      }
    };
  }, [controller, placement, workspaceId]);
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
  const openingContext = JSON.stringify([
    state.generation,
    workspace.workspaceId,
    workspace.lastCommandSequence,
    room.roomRevision,
    roomView,
    view.panel,
    view.selectedId,
    state.comparison,
    state.pending,
    state.candidate?.identity,
  ]);
  if (opening.context !== openingContext)
    setOpening({ context: openingContext, open: false });
  const openingCapability = item
    ? furnitureOpening(item)
    : feature
      ? featureOpening(feature)
      : null;
  const canPreviewOpening =
    roomView === 'cutaway' &&
    view.panel === 'inspector' &&
    !readOnly &&
    !!openingCapability;
  const openingIsOpen =
    canPreviewOpening && opening.context === openingContext && opening.open;
  const openingPreview =
    canPreviewOpening && openingCapability ? (
      <OpeningPreview
        capability={openingCapability}
        open={openingIsOpen}
        onChange={(open) => setOpening({ context: openingContext, open })}
      />
    ) : undefined;
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
  const open = (panel: Panel, category = 'all') => {
    placement.cancel();
    setCatalogueCategory(category);
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
    { id: 'room', label: 'Room' },
    { id: 'checks', label: `Checks${hard ? ` (${hard})` : ''}` },
    { id: 'assistant', label: 'Medy' },
  ];
  const frameControls = (
    <FrameControls
      view={roomView}
      onView={(next) => {
        if (next === 'cutaway') setCutawayOpenedAt(performance.now());
        setRoomView(next);
      }}
    />
  );
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
          <ProjectControls
            key={workspace.workspaceId}
            controller={controller}
            onNewRoom={onBack}
            registerMedy={registerProject}
          />
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
            ↶ <span className={styles.undoLabel}>Undo</span>
          </button>
        </div>
        <nav className={styles.toolRail} aria-label="Room tools">
          {panels.map((panel) => (
            <button
              key={panel.id}
              hidden={panel.id === 'checks'}
              aria-pressed={view.panel === panel.id}
              onClick={() => open(panel.id)}
            >
              {panel.id === 'assistant' ? (
                <span className={styles.assistantLabel}>
                  <MedyIcon />
                  {panel.label}
                </span>
              ) : (
                panel.label
              )}
            </button>
          ))}
          <AssistantTour
            key={workspace.workspaceId}
            controller={controller}
            autoStart={automaticallyOfferTour(state)}
            hideReplay
            registerMedy={registerTour}
          />
        </nav>
      </header>
      <main id="main-content" className={styles.workspace}>
        <h1 ref={headingRef} tabIndex={-1} className={styles.announcement}>
          Room editor
        </h1>
        <section
          className={styles.canvasColumn}
          aria-label={before ? 'Before room' : 'Current room'}
          data-room-target="canvas"
        >
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
          {state.persistence === 'memory-only' && (
            <div className={styles.lifecycleNotice} role="status">
              Recovery is unavailable. Export to keep this layout.
            </div>
          )}

          <div className={controlsStyles.viewStage}>
            {roomView === 'plan' ? (
              <div className={controlsStyles.stage}>
                <div ref={planToolsMotion} className="motion-surface">
                  <ViewControls
                    controller={controller}
                    arranging={arranging}
                    onArrange={setArranging}
                    readOnly={readOnly || !!adding}
                    rotationLocked={!item || item.locks.rotation}
                    onRotate={rotatePlanSelection}
                    snap={view.snap}
                    onSnap={(snap) => controller.setView({ snap })}
                    onZoom={(direction) =>
                      controller.setView({ zoom: view.zoom + direction * 0.2 })
                    }
                    zoomOutDisabled={view.zoom <= 0.6}
                    zoomInDisabled={view.zoom >= 3}
                    onFit={() =>
                      controller.setView({ zoom: 1, panX: 0, panZ: 0 })
                    }
                  >
                    <div
                      className={`${controlsStyles.tools} ${controlsStyles.directions}`}
                      role="group"
                      aria-label="Pan plan"
                    >
                      {(
                        [
                          ['left', '←', -250, 0],
                          ['right', '→', 250, 0],
                          ['up', '↑', 0, -250],
                          ['down', '↓', 0, 250],
                        ] as const
                      ).map(([label, text, x, z]) => (
                        <button
                          key={label}
                          aria-label={`Pan ${label}`}
                          onClick={() =>
                            controller.setView({
                              panX: view.panX + x,
                              panZ: view.panZ + z,
                            })
                          }
                        >
                          {text}
                        </button>
                      ))}
                    </div>
                  </ViewControls>
                </div>
                <PlanView
                  controller={controller}
                  state={state}
                  placement={placement}
                  arranging={arranging}
                />
              </div>
            ) : (
              <CutawayBoundary
                onFailure={() => controller.clientPartFailed()}
                fallback={
                  <>
                    <p role="status">
                      The cutaway could not load. Continue editing in the plan.
                    </p>
                    <PlanView
                      controller={controller}
                      state={state}
                      arranging={arranging}
                    />
                  </>
                }
              >
                <Suspense
                  fallback={
                    <>
                      <p role="status">Opening the cutaway…</p>
                      <PlanView
                        controller={controller}
                        state={state}
                        arranging={arranging}
                      />
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
                    openingId={openingIsOpen ? view.selectedId : null}
                    onSelect={(id) => controller.select(id)}
                    cameraStateRef={cameraStateRef}
                    openedAt={cutawayOpenedAt}
                    onPlan={() => setRoomView('plan')}
                    controller={controller}
                    readOnly={readOnly || !!adding}
                    placement={placement}
                    onAddDesk={() => open('catalogue', 'desk')}
                    snap={view.snap}
                    arranging={arranging}
                    onArrange={setArranging}
                    medyCamera={
                      medyCamera?.workspaceId === workspaceId
                        ? medyCamera
                        : null
                    }
                    onMedyCamera={consumeCamera}
                    onCameraAvailability={updateCameraAvailability}
                  />
                </Suspense>
              </CutawayBoundary>
            )}
            {frameControls}
          </div>
          <CataloguePlacementHint placement={placement} />
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
              {item?.label ?? (feature ? featureLabel(feature) : 'Selection')} ·
              Edit properties ↗
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
                      (feature ? featureLabel(feature) : undefined) ??
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
                    openingPreview={openingPreview}
                  />
                ) : feature ? (
                  <FeatureInspector
                    controller={controller}
                    feature={feature}
                    openingPreview={openingPreview}
                  />
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
                    key={replacementId ?? `add-${catalogueCategory}`}
                    placement={placement}
                    initialCategory={catalogueCategory}
                    controller={controller}
                    room={room}
                    replacement={
                      room.furniture.find((f) => f.id === replacementId) ?? null
                    }
                    onDone={() => setReplacementId(null)}
                    onReplaceSelected={
                      item ? () => setReplacementId(item.id) : undefined
                    }
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
    </div>
  );
}
