const KEY = 'roomedy-tour-offered-v1';
type PreferenceStore = Pick<Storage, 'getItem' | 'setItem'>;
/** Non-sensitive UI preference only, never part of a room/project/AI request. */
export function tourWasOffered(storage?: PreferenceStore) {
  try {
    return (storage ?? globalThis.localStorage)?.getItem(KEY) === '1';
  } catch {
    return false;
  }
}
export function rememberTourOffer(storage?: PreferenceStore) {
  try {
    (storage ?? globalThis.localStorage)?.setItem(KEY, '1');
  } catch {
    /* Session ownership still prevents repeats when storage is unavailable. */
  }
}
