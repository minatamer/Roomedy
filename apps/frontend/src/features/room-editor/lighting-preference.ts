type PreferenceStore = Pick<Storage, 'getItem' | 'setItem'>;
const KEY = 'roomedy-night-lighting-offered-v1';
const seen = new WeakSet<object>();
/** Only an offered flag; no room data, timing, messages or operation dispatch. */
export function offerNightLighting(
  owner: object,
  hasFixtures: boolean,
  storage?: PreferenceStore,
) {
  if (seen.has(owner)) return false;
  seen.add(owner);
  let offered = false;
  try {
    const store = storage ?? globalThis.localStorage;
    offered = store?.getItem(KEY) === '1';
    store?.setItem(KEY, '1');
  } catch {
    /* Weak ownership prevents repeats when storage is blocked. */
  }
  return !offered && !hasFixtures;
}
