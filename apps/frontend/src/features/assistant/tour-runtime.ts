import type { SessionSnapshot } from '../session/state';
import {
  sameTourBox,
  tourPlacement,
  tourSpotlight,
  tourTargetVisible,
  TOUR_DEADLINE_MS,
  TOUR_SETTLE_MS,
} from './tour-layout';
import type { TourBox, TourRect, TourViewport } from './tour-layout';
export function automaticallyOfferTour(
  state: Pick<
    SessionSnapshot,
    'phase' | 'workspace' | 'recovered' | 'imported' | 'clientLoadFailure'
  >,
) {
  return (
    state.phase === 'editor' &&
    !!state.workspace &&
    !state.recovered &&
    !state.imported &&
    !state.clientLoadFailure
  );
}
export type TourReading = {
  target: TourRect | null;
  view: TourViewport;
  cardHeight: number;
  moving: boolean;
};
export type TourLayout = {
  hole: TourBox | null;
  card: TourBox;
  view: TourViewport;
  unavailable: boolean;
};
/** One bounded readiness owner; it sleeps after arrival and cannot revive after disposal. */
export function watchTourTarget(port: {
  now: () => number;
  request: (fn: () => void) => number;
  cancel: (id: number) => void;
  read: () => TourReading;
  hide: () => void;
  show: (layout: TourLayout) => void;
}) {
  let live = true,
    version = 0,
    frame = 0,
    began = port.now(),
    stableSince = began;
  let previous: TourReading | null = null;
  const box = (r: TourRect): TourBox => ({
    left: r.left,
    top: r.top,
    width: r.right - r.left,
    height: r.bottom - r.top,
  });
  const measure = (stamp: number) => {
    if (!live || stamp !== version) return;
    frame = 0;
    const next = port.read(),
      time = port.now();
    const same =
      previous &&
      previous.target &&
      next.target &&
      sameTourBox(box(previous.target), box(next.target)) &&
      sameTourBox(previous.view, next.view) &&
      Math.abs(previous.cardHeight - next.cardHeight) < 0.5;
    if (!same || next.moving) stableSince = time;
    previous = next;
    const ready =
      next.target &&
      !next.moving &&
      tourTargetVisible(next.target, next.view) &&
      time - stableSince >= TOUR_SETTLE_MS;
    if (ready || time - began >= TOUR_DEADLINE_MS) {
      port.show({
        hole: ready ? tourSpotlight(next.target!, next.view) : null,
        card: tourPlacement(
          ready ? next.target : null,
          next.view,
          next.cardHeight,
        ),
        view: next.view,
        unavailable: !ready,
      });
    } else frame = port.request(() => measure(stamp));
  };
  const refresh = () => {
    if (!live) return;
    if (frame) port.cancel(frame);
    const stamp = ++version;
    began = stableSince = port.now();
    previous = null;
    port.hide();
    frame = port.request(() => measure(stamp));
  };
  refresh();
  return {
    refresh,
    dispose: () => {
      live = false;
      if (frame) port.cancel(frame);
    },
  };
}
