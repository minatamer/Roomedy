import { AssistantController } from '../assistant/controller';
import { Assistant } from '../assistant/assistant';
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
import { hasBaselineChanges } from '../session/state';
import { Brand } from '../landing/brand';
import { createRoomFixture } from '../session/fixtures/rooms';
import { PlanView } from '../plan-view/plan-view';
import { FurnitureInspector, FeatureInspector } from './inspector';
import { CataloguePanel } from './catalogue-panel';
import { RoomPanel } from './room-panel';
import { ChecksPanel } from './checks-panel';
import { failureMessage } from './messages';
import { focusProperties } from './focus';
import styles from './editor.module.css';

const Cutaway = lazy(() => import('../room-view/cutaway'));
class CutawayBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
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
  const [cutawayOpenedAt, setCutawayOpenedAt] = useState(0);
  const [roomView, setRoomView] = useState<'plan' | 'cutaway'>('plan');
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
  }, [state.phase]);
  useEffect(() => {
    if (!state.candidate) return;
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
            ? 'This room session has expired.'
            : 'Open a new room.'}
        </h1>
        <p>Room changes stay in this tab for this preview.</p>
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
    shownRoom = state.candidate?.room ?? room,
    shownChecks = state.candidate?.checks ?? state.checks!;
  const item = shownRoom.furniture.find((f) => f.id === view.selectedId),
    feature = shownRoom.room.features.find((f) => f.id === view.selectedId);
  const hard = shownChecks.issues.filter((i) => i.severity === 'hard').length;
  const unassessed = shownChecks.coverage.filter(
    (c) => c.status === 'unassessed' || c.unassessed > 0,
  ).length;
  const open = (panel: Panel) => {
    setReplacementId(null);
    controller.setPanel(panel);
    focusProperties(controller);
  };
  const leave = () =>
    !hasBaselineChanges(workspace) ||
    window.confirm('Leave this room? Changes in this tab will be lost.');
  const panels: { id: Panel; label: string }[] = [
    { id: 'inventory', label: 'Furniture' },
    { id: 'catalogue', label: 'Add piece' },
    { id: 'room', label: 'Room' },
    { id: 'checks', label: `Checks${hard ? ` (${hard})` : ''}` },
    { id: 'assistant', label: 'Assistant' },
  ];
  return (
    <div className={styles.studio}>
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
        <span className={styles.editorLabel}>
          Your room / {roomView === 'plan' ? '2D plan' : '3D cutaway'}
        </span>
        <div className={styles.headerActions}>
          <button
            aria-disabled={!state.undoLabel}
            onClick={() => {
              if (!state.undoLabel) return;
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
          <button
            onClick={() => {
              if (leave()) onBack();
            }}
          >
            Change room
          </button>
        </div>
      </header>
      <main id="main-content" className={styles.workspace}>
        <nav className={styles.toolRail} aria-label="Room tools">
          {panels.map((panel) => (
            <button
              key={panel.id}
              aria-pressed={view.panel === panel.id}
              onClick={() => open(panel.id)}
            >
              {panel.label}
            </button>
          ))}
        </nav>
        <section
          className={styles.canvasColumn}
          aria-label="Current room"
          data-room-target="canvas"
        >
          <div className={styles.canvasHeading}>
            <div>
              <p className={styles.eyebrow}>
                {state.candidate
                  ? state.candidate.source === 'assistant'
                    ? 'Proposal preview'
                    : 'Palette preview'
                  : 'Current arrangement'}
              </p>
              <h1 ref={headingRef} tabIndex={-1}>
                {condition === 'empty'
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
            className={styles.viewSwitch}
            role="group"
            aria-label="Room view"
          >
            <button
              aria-pressed={roomView === 'plan'}
              onClick={() => setRoomView('plan')}
            >
              2D plan
            </button>
            <button
              aria-pressed={roomView === 'cutaway'}
              onClick={() => {
                setCutawayOpenedAt(performance.now());
                setRoomView('cutaway');
              }}
            >
              3D cutaway
            </button>
          </div>
          {roomView === 'plan' && (
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
                  onClick={() => controller.setView({ panX: view.panX - 250 })}
                >
                  ←
                </button>
                <button
                  aria-label="Pan up"
                  onClick={() => controller.setView({ panZ: view.panZ - 250 })}
                >
                  ↑
                </button>
                <button
                  aria-label="Pan down"
                  onClick={() => controller.setView({ panZ: view.panZ + 250 })}
                >
                  ↓
                </button>
                <button
                  aria-label="Pan right"
                  onClick={() => controller.setView({ panX: view.panX + 250 })}
                >
                  →
                </button>
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
          )}
          {roomView === 'plan' ? (
            <PlanView controller={controller} state={state} />
          ) : (
            <CutawayBoundary
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
                  room={room}
                  candidate={state.candidate?.room}
                  checks={state.candidate?.checks ?? state.checks!}
                  selectedId={view.selectedId}
                  onSelect={(id) => controller.select(id)}
                  cameraStateRef={cameraStateRef}
                  openedAt={cutawayOpenedAt}
                  onPlan={() => setRoomView('plan')}
                />
              </Suspense>
            </CutawayBoundary>
          )}
          {state.candidate && (
            <div
              className={styles.previewActions}
              ref={previewRef}
              data-room-target="preview"
            >
              <div>
                <p>
                  {state.candidate.label ?? 'Palette change'} · Preview only.
                  Your current room is unchanged.
                </p>
                <p className={styles.hint}>
                  {state.candidate.checks.coverage.some(
                    (c) =>
                      c.status === 'unassessed' ||
                      c.unassessed > 0 ||
                      c.status === 'approximate',
                  )
                    ? 'Some checks remain approximate or incomplete.'
                    : 'Review the checks for the recorded inputs.'}
                </p>
                <ul className={styles.changeList}>
                  {state.candidate.room.furniture
                    .filter(
                      (p) =>
                        JSON.stringify(p) !==
                        JSON.stringify(
                          room.furniture.find((before) => before.id === p.id),
                        ),
                    )
                    .slice(0, 8)
                    .map((p) => (
                      <li key={p.id}>
                        {room.furniture.some((before) => before.id === p.id)
                          ? 'Change'
                          : 'Add'}{' '}
                        {p.label} ·{' '}
                        {p.ownership === 'owned' ? 'Owned' : 'Proposed'}
                      </li>
                    ))}
                  {room.furniture
                    .filter(
                      (p) =>
                        !state.candidate!.room.furniture.some(
                          (after) => after.id === p.id,
                        ),
                    )
                    .slice(0, 8)
                    .map((p) => (
                      <li key={p.id}>Remove {p.label} from this plan</li>
                    ))}
                </ul>
              </div>
              <button
                className={styles.primary}
                onClick={() => {
                  const r =
                    state.candidate?.source === 'assistant'
                      ? (assistant?.apply() ?? { ok: false, code: 'stale' })
                      : controller.applyVisitorPreview();
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
                {state.candidate.source === 'assistant'
                  ? 'Apply proposed changes'
                  : 'Apply palette'}
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
          <div className={styles.roomStatus}>
            {view.selectedId && (
              <button
                className={styles.mobileReturn}
                onClick={() => open('inspector')}
              >
                {item?.label ?? feature?.kind ?? 'Selection'} · Edit properties
                ↗
              </button>
            )}
            <button onClick={() => open('checks')}>
              {hard
                ? `${hard} space ${hard === 1 ? 'issue' : 'issues'}`
                : 'No blocking issue in the modeled checks'}
              {unassessed
                ? ` · ${unassessed} incomplete ${unassessed === 1 ? 'check' : 'checks'}`
                : ''}
            </button>
            <p role="status" aria-live="polite">
              {state.message}
            </p>
          </div>
        </section>
        <aside
          className={`${styles.panel} ${view.panel === 'assistant' ? styles.assistantPanel : ''}`}
          data-room-target="properties"
          tabIndex={-1}
          aria-label="Room properties"
        >
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
            (assistant ? (
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
                  {shownRoom.furniture.map((piece) => (
                    <li key={piece.id}>
                      <button
                        onClick={() => {
                          controller.select(piece.id);
                          focusProperties(controller, piece.id);
                        }}
                      >
                        <strong>{piece.label}</strong>
                        <span>
                          {piece.dimensions.width.value ?? '?'} ×{' '}
                          {piece.dimensions.depth.value ?? '?'} mm ·{' '}
                          {piece.ownership === 'owned' ? 'Owned' : 'Proposed'}
                        </span>
                        <span>
                          {piece.preference === 'keep'
                            ? 'Keep'
                            : piece.preference === 'replace'
                              ? 'May replace'
                              : 'Flexible'}
                          {piece.locks.position ? ' · Position locked' : ''}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Add your first piece from the curated catalogue.</p>
              )}
              <button
                className={styles.primary}
                onClick={() => open('catalogue')}
              >
                Add a piece
              </button>
            </>
          )}
          {view.panel === 'inspector' && state.candidate ? (
            <section className={styles.section}>
              <p className={styles.eyebrow}>Preview inspection</p>
              <h2 tabIndex={-1} id={`properties-${view.selectedId}`}>
                {state.candidate.room.furniture.find(
                  (p) => p.id === view.selectedId,
                )?.label ??
                  state.candidate.room.room.features.find(
                    (f) => f.id === view.selectedId,
                  )?.kind ??
                  'Proposed room'}
              </h2>
              <p>
                Current is unchanged. Apply or Cancel beside the room before
                editing these preview values.
              </p>
              {(() => {
                const piece = state.candidate.room.furniture.find(
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
            (state.candidate ? (
              <section className={styles.section}>
                <h2 tabIndex={-1}>Choose a piece</h2>
                <p>Apply or Cancel the preview before adding another piece.</p>
                <button onClick={() => controller.cancelPreview()}>
                  Cancel preview & choose a piece
                </button>
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
            (state.candidate ? (
              <section className={styles.section}>
                <p className={styles.eyebrow}>Preview inspection</p>
                <h2 tabIndex={-1}>Proposed room</h2>
                <p>
                  {shownRoom.room.width.value ?? '?'} ×{' '}
                  {shownRoom.room.depth.value ?? '?'} ×{' '}
                  {shownRoom.room.height.value ?? '?'} mm
                </p>
                <p>
                  Floor: {shownRoom.room.floorFinish}. Walls:{' '}
                  {shownRoom.room.wallFinish}.
                </p>
                <p>
                  Apply or Cancel beside the room before editing these values.
                </p>
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
        </aside>
      </main>
      <footer className={styles.footer}>
        {source === 'sample'
          ? 'Supplied sample measurements'
          : 'Your reviewed room'}{' '}
        · Similar furniture representations{' '}
        <span>Changes stay in this tab for now.</span>
      </footer>
    </div>
  );
}
