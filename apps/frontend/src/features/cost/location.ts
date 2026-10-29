import { BoundedBytes } from '@roomedy/contracts/bounded-bytes';

export interface CountryOutline {
  country: string;
  polygons: number[][][][];
}
export type LocationResult =
  | { kind: 'located'; country: string }
  | {
      kind:
        | 'denied'
        | 'timeout'
        | 'unavailable'
        | 'unsupported'
        | 'unresolved'
        | 'cancelled';
    };
export type PositionSource = Pick<Geolocation, 'getCurrentPosition'>;
type Coordinates = Pick<
  GeolocationCoordinates,
  'latitude' | 'longitude' | 'accuracy'
>;

function inRing(x: number, y: number, ring: number[][]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i]!,
      b = ring[j]!;
    if (
      a[1]! > y !== b[1]! > y &&
      x < ((b[0]! - a[0]!) * (y - a[1]!)) / (b[1]! - a[1]!) + a[0]!
    )
      inside = !inside;
  }
  return inside;
}
/** Approximate shopping country, never a delivery address or physical/geopolitical proof. */
export function countryAtPosition(
  position: Coordinates,
  outlines: readonly CountryOutline[],
): string | null {
  const { latitude, longitude, accuracy } = position;
  if (
    ![latitude, longitude, accuracy].every(Number.isFinite) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180 ||
    accuracy < 0 ||
    accuracy > 250_000
  )
    return null;
  const found = outlines.filter(({ polygons }) =>
    polygons.some(
      (rings) =>
        !!rings[0] &&
        inRing(longitude, latitude, rings[0]) &&
        !rings.slice(1).some((hole) => inRing(longitude, latitude, hole)),
    ),
  );
  return found.length === 1 ? found[0]!.country : null;
}

export async function loadCountryOutlines(
  signal: AbortSignal,
): Promise<CountryOutline[]> {
  const response = await fetch('/data/shopping-countries-v1.json', {
    signal: AbortSignal.any([signal, AbortSignal.timeout(10_000)]),
    credentials: 'omit',
    redirect: 'error',
    cache: 'force-cache',
  });
  if (!response.ok || !response.body) {
    await response.body?.cancel().catch(() => undefined);
    throw new Error('country-data');
  }
  const reader = response.body.getReader(),
    bytes = new BoundedBytes(1_048_576, 1024);
  try {
    while (true) {
      signal.throwIfAborted();
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes.append(chunk.value);
    }
    signal.throwIfAborted();
    const data: unknown = JSON.parse(
      new TextDecoder('utf-8', { fatal: true }).decode(bytes.take()),
    );
    if (!Array.isArray(data) || data.length > 300)
      throw new Error('country-data');
    let points = 0;
    for (const item of data) {
      if (
        !item ||
        typeof item !== 'object' ||
        !/^[A-Z]{2}$/.test(item.country) ||
        !Array.isArray(item.polygons) ||
        !item.polygons.length
      )
        throw new Error('country-data');
      for (const polygon of item.polygons) {
        if (!Array.isArray(polygon) || !polygon.length)
          throw new Error('country-data');
        for (const ring of polygon) {
          if (!Array.isArray(ring) || ring.length < 4)
            throw new Error('country-data');
          for (const point of ring) {
            if (
              ++points > 30_000 ||
              !Array.isArray(point) ||
              point.length !== 2 ||
              !point.every(
                (v) => typeof v === 'number' && Number.isFinite(v),
              ) ||
              Math.abs(point[0]) > 180 ||
              Math.abs(point[1]) > 90
            )
              throw new Error('country-data');
          }
        }
      }
    }
    return data as CountryOutline[];
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
    bytes.clear();
  }
}

/** One explicit click, one browser request; only the country leaves this owner. */
export function requestShoppingLocation(
  geolocation: PositionSource | undefined,
  load = loadCountryOutlines,
) {
  const abort = new AbortController();
  const result = new Promise<LocationResult>((resolve) => {
    let settled = false;
    const finish = (value: LocationResult) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    abort.signal.addEventListener(
      'abort',
      () => finish({ kind: 'cancelled' }),
      { once: true },
    );
    if (!geolocation) {
      finish({ kind: 'unsupported' });
      return;
    }
    try {
      geolocation.getCurrentPosition(
        (position) => {
          if (settled || abort.signal.aborted) return;
          void load(abort.signal)
            .then((outlines) => {
              if (abort.signal.aborted) return;
              const country = countryAtPosition(position.coords, outlines);
              finish(
                country ? { kind: 'located', country } : { kind: 'unresolved' },
              );
            })
            .catch(() => finish({ kind: 'unresolved' }));
        },
        (error) =>
          finish({
            kind:
              error.code === 1
                ? 'denied'
                : error.code === 3
                  ? 'timeout'
                  : 'unavailable',
          }),
        { enableHighAccuracy: false, timeout: 12_000, maximumAge: 300_000 },
      );
    } catch {
      finish({ kind: 'unavailable' });
    }
  });
  return { result, cancel: () => abort.abort() };
}
