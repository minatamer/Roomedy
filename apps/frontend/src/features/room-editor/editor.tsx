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
    view = state.presentation;
  const item = room.furniture.find((f) => f.id === view.selectedId),
    feature = room.room.features.find((f) => f.id === view.selectedId);
  const hard = state.checks!.issues.filter((i) => i.severity === 'hard').length;
  const unassessed = state.checks!.coverage.filter(
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
              const r = controller.undo();
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
        <section className={styles.canvasColumn} aria-label="Current room">
          <div className={styles.canvasHeading}>
            <div>
              <p className={styles.eyebrow}>
                {state.candidate ? 'Palette preview' : 'Current arrangement'}
              </p>
              <h1 ref={headingRef} tabIndex={-1}>
                {condition === 'empty'
                  ? 'A little room to begin.'
                  : 'Make this space yours.'}
              </h1>
            </div>
            <span>
              {room.furniture.length}{' '}
              {room.furniture.length === 1 ? 'piece' : 'pieces'}
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
            <div className={styles.previewActions} ref={previewRef}>
              <p>Preview only. Your current room is unchanged.</p>
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
          className={styles.panel}
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
          {view.panel === 'inventory' && (
            <>
              <div className={styles.panelTitle}>
                <p className={styles.eyebrow}>In your room</p>
                <h2 tabIndex={-1}>Furniture</h2>
              </div>
              {room.furniture.length ? (
                <ul className={styles.inventory}>
                  {room.furniture.map((piece) => (
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
          {view.panel === 'inspector' &&
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
            ))}
          {view.panel === 'catalogue' && (
            <CataloguePanel
              key={replacementId ?? 'add'}
              controller={controller}
              room={room}
              replacement={
                room.furniture.find((f) => f.id === replacementId) ?? null
              }
              onDone={() => setReplacementId(null)}
            />
          )}
          {view.panel === 'room' && (
            <RoomPanel controller={controller} room={room} />
          )}
          {view.panel === 'checks' && (
            <ChecksPanel
              controller={controller}
              room={room}
              checks={state.checks!}
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
