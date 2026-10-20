import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import type { SessionController } from '../session/controller';
import { startScrollJourney } from '../navigation/scroll-journey';
import {
  sameTourBox,
  tourPanels,
  tourPlacement,
  tourSpotlight,
  tourTargetVisible,
  TOUR_FADE_MS,
} from './tour-layout';
import type { TourViewport } from './tour-layout';
import { watchTourTarget } from './tour-runtime';
import type { TourLayout } from './tour-runtime';
import styles from './tour.module.css';
const steps = [
  {
    target: 'canvas',
    title: 'Make room for your ideas.',
    text: 'Move and rotate furniture in 2D or 3D. Select a piece to change its details; switch views whenever you need another perspective.',
  },
  {
    target: 'assistant',
    title: 'Design it together.',
    text: 'Meet Medy. Ask for a useful change, like moving your work area closer to the window, changing a size or finding a calmer palette.',
  },
  {
    target: 'history',
    title: 'Keep the changes you love.',
    text: 'Review an assistant proposal, then Apply or Cancel. Undo reverses your last accepted change.',
  },
] as const;
const viewport = (): TourViewport => ({
  left: window.visualViewport?.offsetLeft ?? 0,
  top: window.visualViewport?.offsetTop ?? 0,
  width: window.visualViewport?.width ?? document.documentElement.clientWidth,
  height:
    window.visualViewport?.height ?? document.documentElement.clientHeight,
});
const targetFor = (index: number) =>
  document.querySelector<HTMLElement>(
    `[data-room-target="${steps[index]!.target}"]`,
  );
/** Reuse the finite cubic journey for nested scroll regions and the document together. */
function scrollToTarget(target: HTMLElement) {
  const rect = target.getBoundingClientRect(),
    jobs: { from: number; to: number; write: (top: number) => void }[] = [];
  let top = rect.top,
    depth = 0;
  for (
    let parent = target.parentElement;
    parent && parent !== document.body && depth++ < 16;
    parent = parent.parentElement
  ) {
    if (
      !/(auto|scroll)/.test(getComputedStyle(parent).overflowY) ||
      parent.scrollHeight <= parent.clientHeight
    )
      continue;
    const node = parent,
      bounds = node.getBoundingClientRect(),
      from = node.scrollTop,
      to = Math.max(
        0,
        Math.min(
          node.scrollHeight - node.clientHeight,
          from + top + rect.height / 2 - bounds.top - node.clientHeight / 2,
        ),
      );
    jobs.push({
      from,
      to,
      write: (value) => node.scrollTo({ top: value, behavior: 'instant' }),
    });
    top -= to - from;
  }
  const view = viewport(),
    from = window.scrollY,
    to = Math.max(
      0,
      Math.min(
        document.documentElement.scrollHeight -
          document.documentElement.clientHeight,
        from + top + rect.height / 2 - view.top - view.height / 2,
      ),
    );
  jobs.push({
    from,
    to,
    write: (value) => window.scrollTo({ top: value, behavior: 'instant' }),
  });
  const distance = Math.max(...jobs.map((job) => Math.abs(job.to - job.from)));
  if (distance < 1) return () => {};
  return startScrollJourney(0, distance, {
    now: () => performance.now(),
    request: (fn) => requestAnimationFrame(fn),
    cancel: (id) => cancelAnimationFrame(id),
    write: (value) =>
      jobs.forEach((job) =>
        job.write(job.from + ((job.to - job.from) * value) / distance),
      ),
    done: () => {},
  });
}
export function AssistantTour({
  controller,
  autoStart,
  hideReplay = false,
  registerMedy,
}: {
  controller: SessionController;
  autoStart: boolean;
  hideReplay?: boolean;
  registerMedy?: (start: (() => void) | null) => void;
}) {
  const [mounted, setMounted] = useState(false),
    [open, setOpen] = useState(autoStart),
    [index, setIndex] = useState<number | null>(null),
    [pending, setPending] = useState<number | null>(null),
    [layout, setLayout] = useState<TourLayout | null>(null),
    [leaving, setLeaving] = useState(false),
    [view, setView] = useState<TourViewport>({
      left: 0,
      top: 0,
      width: 390,
      height: 844,
    });
  const replay = useRef<HTMLButtonElement>(null),
    card = useRef<HTMLElement>(null),
    measuring = useRef<HTMLElement>(null),
    timer = useRef(0),
    closing = useRef(false),
    stopScroll = useRef(() => {}),
    opener = useRef<HTMLElement | null>(null),
    displayed = useRef<TourLayout | null>(null);
  useEffect(() => {
    registerMedy?.(() => {
      opener.current =
        document.querySelector<HTMLTextAreaElement>('#roomedy-message') ??
        (document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null);
      closing.current = false;
      setIndex(null);
      setPending(0);
      setLayout(null);
      setLeaving(false);
      setView(viewport());
      setOpen(true);
    });
    return () => registerMedy?.(null);
  }, [registerMedy]);
  useLayoutEffect(() => {
    displayed.current = layout;
  }, [layout]);
  useEffect(() => {
    let live = true;
    queueMicrotask(() => {
      if (live) {
        setMounted(true);
        setView(viewport());
      }
    });
    return () => {
      live = false;
      window.clearTimeout(timer.current);
      stopScroll.current();
    };
  }, []);
  const close = useCallback(() => {
    closing.current = true;
    stopScroll.current();
    window.clearTimeout(timer.current);
    setLeaving(true);
    timer.current = window.setTimeout(() => {
      setOpen(false);
      setLayout(null);
      setPending(null);
      setLeaving(false);
    }, TOUR_FADE_MS);
  }, []);
  useEffect(() => {
    if (!mounted || !open) return;
    const replayButton = replay.current,
      root = replayButton?.closest<HTMLElement>('[data-room-tour-root]'),
      wasInert = root?.inert ?? false;
    if (root) root.inert = true;
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
      if (event.key === 'Tab') {
        const buttons = [
            ...(card.current?.querySelectorAll<HTMLButtonElement>(
              'button:not(:disabled)',
            ) ?? []),
          ],
          first = buttons[0],
          last = buttons.at(-1);
        if (
          !card.current?.contains(document.activeElement) ||
          (event.shiftKey && document.activeElement === first) ||
          (!event.shiftKey && document.activeElement === last)
        ) {
          event.preventDefault();
          (event.shiftKey ? last : first)?.focus({ preventScroll: true });
        }
      }
    };
    document.addEventListener('keydown', keyboard);
    return () => {
      document.removeEventListener('keydown', keyboard);
      if (root) root.inert = wasInert;
      const target = opener.current?.isConnected
        ? opener.current
        : replayButton?.hidden
          ? root?.querySelector<HTMLElement>('h1[tabindex]')
          : replayButton;
      target?.focus({ preventScroll: true });
    };
  }, [mounted, open, close]);
  const visible = open && (index === null || !!layout);
  useEffect(() => {
    if (!mounted || !visible || leaving) return;
    const frame = requestAnimationFrame(() =>
      card.current
        ?.querySelector<HTMLButtonElement>('[data-tour-forward]')
        ?.focus({ preventScroll: true }),
    );
    return () => cancelAnimationFrame(frame);
  }, [mounted, visible, index, leaving]);
  useLayoutEffect(() => {
    if (!mounted || !open || pending === null) return;
    const node = targetFor(pending),
      rect = node?.getBoundingClientRect(),
      currentView = viewport(),
      nextCard = tourPlacement(
        rect ?? null,
        currentView,
        measuring.current?.offsetHeight ?? 280,
      );
    if (
      layout?.hole &&
      rect &&
      tourTargetVisible(rect, currentView) &&
      sameTourBox(layout.hole, tourSpotlight(rect, currentView)) &&
      sameTourBox(layout.card, nextCard)
    ) {
      setIndex(pending);
      setPending(null);
      return;
    }
    setLeaving(true);
    timer.current = window.setTimeout(() => {
      setLayout(null);
      setIndex(pending);
      setPending(null);
      setLeaving(false);
    }, TOUR_FADE_MS);
    return () => window.clearTimeout(timer.current);
  }, [mounted, open, pending, layout]);
  useEffect(() => {
    if (!mounted || !open || index === null || pending !== null) return;
    if (index === 1) controller.setPanel('assistant');
    let alive = true,
      scrolled = false;
    const root = replay.current?.closest<HTMLElement>('[data-room-tour-root]');
    const watcher = watchTourTarget({
      now: () => performance.now(),
      request: (fn) => requestAnimationFrame(fn),
      cancel: (id) => cancelAnimationFrame(id),
      hide: () => {
        if (!alive || closing.current) return;
        const shown = displayed.current,
          rect = targetFor(index)?.getBoundingClientRect(),
          currentView = viewport();
        if (
          shown?.hole &&
          rect &&
          tourTargetVisible(rect, currentView) &&
          sameTourBox(shown.hole, tourSpotlight(rect, currentView)) &&
          sameTourBox(
            shown.card,
            tourPlacement(
              rect,
              currentView,
              measuring.current?.offsetHeight ?? 280,
            ),
          )
        )
          return;
        setLayout(null);
      },
      show: (next) => {
        if (alive && !closing.current) setLayout(next);
      },
      read: () => {
        const node = targetFor(index),
          currentView = viewport();
        if (node && !scrolled) {
          scrolled = true;
          stopScroll.current = scrollToTarget(node);
        }
        let moving = false,
          depth = 0;
        for (
          let ancestor = node;
          ancestor && depth++ < 16;
          ancestor = ancestor.parentElement
        )
          moving ||= ancestor
            .getAnimations()
            .some((animation) => animation.playState === 'running');
        return {
          target: node?.getBoundingClientRect() ?? null,
          view: currentView,
          cardHeight: measuring.current?.offsetHeight ?? 280,
          moving,
        };
      },
    });
    const refresh = () => watcher.refresh();
    const insideGuide = (event: Event) =>
      event.target instanceof Element &&
      !!event.target.closest('[data-room-tour-layer]');
    const pageScroll = (event: Event) => {
      if (!insideGuide(event)) refresh();
    };
    const resized = () => {
      stopScroll.current();
      scrolled = false;
      setView(viewport());
      refresh();
    };
    const interrupt = (event: Event) => {
      if (insideGuide(event)) return;
      stopScroll.current();
      refresh();
    };
    const hidden = () => {
      if (document.hidden) stopScroll.current();
      else resized();
    };
    const resize = new ResizeObserver(refresh);
    if (root) {
      resize.observe(root);
      for (const node of root.querySelectorAll('[data-room-target]'))
        resize.observe(node);
    }
    if (measuring.current) resize.observe(measuring.current);
    const mutations = new MutationObserver(refresh);
    if (root) mutations.observe(root, { subtree: true, childList: true });
    window.addEventListener('scroll', pageScroll, true);
    window.addEventListener('resize', resized);
    window.addEventListener('wheel', interrupt, { passive: true });
    window.addEventListener('touchstart', interrupt, { passive: true });
    window.visualViewport?.addEventListener('resize', resized);
    window.visualViewport?.addEventListener('scroll', refresh);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      alive = false;
      watcher.dispose();
      stopScroll.current();
      resize.disconnect();
      mutations.disconnect();
      window.removeEventListener('scroll', pageScroll, true);
      window.removeEventListener('resize', resized);
      window.removeEventListener('wheel', interrupt);
      window.removeEventListener('touchstart', interrupt);
      window.visualViewport?.removeEventListener('resize', resized);
      window.visualViewport?.removeEventListener('scroll', refresh);
      document.removeEventListener('visibilitychange', hidden);
    };
  }, [controller, mounted, open, index, pending]);
  // The welcome tracks the actual visible viewport without gating its entrance.
  useEffect(() => {
    if (!mounted || !open || index !== null) return;
    const update = () => setView(viewport());
    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);
    window.visualViewport?.addEventListener('scroll', update);
    return () => {
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('scroll', update);
    };
  }, [mounted, open, index]);
  const content = (selected: number, hidden = false) => (
    <section
      ref={hidden ? measuring : card}
      className={`${styles.card} ${hidden ? styles.measuring : ''}`}
      style={
        hidden
          ? {
              width: Math.min(348, view.width - 32),
              maxHeight: Math.max(1, view.height - 32),
            }
          : {
              left: layout?.card.left,
              top: layout?.card.top,
              width: layout?.card.width,
              maxHeight: Math.max(1, (layout?.view.height ?? view.height) - 32),
            }
      }
      inert={hidden || leaving}
      aria-hidden={hidden || undefined}
      role={hidden ? undefined : 'dialog'}
      aria-modal={hidden ? undefined : true}
      aria-labelledby={hidden ? undefined : 'room-tour-title'}
      aria-describedby={hidden ? undefined : 'room-tour-description'}
      data-tour-card={hidden ? undefined : steps[selected]!.target}
    >
      <small>
        Your room, with Roomedy · {selected + 1} of {steps.length}
      </small>
      <div className={styles.progress} aria-hidden="true">
        {steps.map((step, i) => (
          <span key={step.target} data-current={i <= selected} />
        ))}
      </div>
      <h2 id={hidden ? undefined : 'room-tour-title'}>
        {steps[selected]!.title}
      </h2>
      <p id={hidden ? undefined : 'room-tour-description'}>
        {!hidden && layout?.unavailable
          ? 'This part is outside the current view. You can continue or leave the tour.'
          : steps[selected]!.text}
      </p>
      <div className={styles.actions}>
        <button
          type="button"
          disabled={selected === 0 || leaving || pending !== null}
          onClick={() => setPending(selected - 1)}
        >
          Back
        </button>
        <button type="button" className={styles.skip} onClick={close}>
          Skip tour
        </button>
        <button
          type="button"
          data-tour-forward
          disabled={leaving || pending !== null}
          onClick={() =>
            selected === steps.length - 1 ? close() : setPending(selected + 1)
          }
        >
          {selected === steps.length - 1 ? 'Done' : 'Next →'}
        </button>
      </div>
    </section>
  );
  return (
    <>
      <button
        type="button"
        ref={replay}
        hidden={hideReplay}
        data-tour-replay
        onClick={() => {
          opener.current =
            document.activeElement instanceof HTMLElement
              ? document.activeElement
              : null;
          closing.current = false;
          setIndex(null);
          setPending(null);
          setLayout(null);
          setLeaving(false);
          setView(viewport());
          setOpen(true);
        }}
      >
        Quick tour
      </button>
      {mounted &&
        open &&
        createPortal(
          <div className={styles.layer} data-room-tour-layer>
            {index !== null && content(pending ?? index, true)}
            {index === null ? (
              <div
                className={styles.presentation}
                data-tour-presentation="welcome"
                data-leaving={leaving}
              >
                {tourPanels(null, view).map((panel, i) => (
                  <div
                    key={i}
                    className={styles.scrim}
                    style={panel}
                    aria-hidden="true"
                  />
                ))}
                <section
                  ref={card}
                  className={styles.card}
                  style={{
                    left: view.left + view.width / 2,
                    top: view.top + view.height / 2,
                    transform: 'translate(-50%, -50%)',
                    width: Math.min(348, view.width - 32),
                    maxHeight: Math.max(1, view.height - 32),
                  }}
                  inert={leaving}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="room-tour-title"
                  aria-describedby="room-tour-description"
                  data-tour-welcome
                >
                  <small>A little orientation</small>
                  <h2 id="room-tour-title">Welcome to your room.</h2>
                  <p id="room-tour-description">
                    A quick look at editing your space, working with the
                    assistant and reviewing your changes.
                  </p>
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.skip}
                      onClick={close}
                    >
                      Skip tour
                    </button>
                    <button
                      type="button"
                      data-tour-forward
                      disabled={leaving}
                      onClick={() => setPending(0)}
                    >
                      Start tour →
                    </button>
                  </div>
                </section>
              </div>
            ) : (
              layout && (
                <div
                  className={styles.presentation}
                  data-tour-presentation={index}
                  data-leaving={leaving}
                >
                  {tourPanels(layout.hole, layout.view).map((panel, i) => (
                    <div
                      key={i}
                      className={styles.scrim}
                      style={panel}
                      aria-hidden="true"
                    />
                  ))}
                  {layout.hole && (
                    <div
                      className={styles.highlight}
                      style={layout.hole}
                      aria-hidden="true"
                      data-tour-spotlight={steps[index]!.target}
                    />
                  )}
                  {content(index)}
                </div>
              )
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
