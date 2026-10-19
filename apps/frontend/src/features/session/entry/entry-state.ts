export type EntrySource = 'manual' | 'photos';
export type RoomCondition = 'empty' | 'partial' | 'furnished';
export type EntryIntent = { source: EntrySource; condition: RoomCondition };
export type EntryState =
  | { step: 'source' }
  | { step: 'condition'; source: 'manual' }
  | { step: 'ready'; intent: EntryIntent; fresh?: true };
export type EntryAction =
  | { type: 'source'; source: EntrySource }
  | { type: 'condition'; condition: RoomCondition }
  | { type: 'back' };
export function parseEntryIntent(
  source: string | undefined,
  condition: string | undefined,
): EntryState {
  if (source === 'photos' || source === 'own')
    return {
      step: 'ready',
      intent: { source: 'photos', condition: 'furnished' },
    };
  if (source !== 'manual' && source !== 'sample') return { step: 'source' };
  if (
    condition === 'empty' ||
    condition === 'partial' ||
    condition === 'furnished'
  )
    return { step: 'ready', intent: { source: 'manual', condition } };
  return { step: 'condition', source: 'manual' };
}
export function entryReducer(
  state: EntryState,
  action: EntryAction,
): EntryState {
  if (action.type === 'source')
    return action.source === 'photos'
      ? {
          step: 'ready',
          intent: { source: 'photos', condition: 'furnished' },
          fresh: true,
        }
      : { step: 'condition', source: 'manual' };
  if (action.type === 'condition')
    return state.step === 'condition'
      ? {
          step: 'ready',
          intent: { source: 'manual', condition: action.condition },
          fresh: true,
        }
      : state;
  if (state.step === 'ready' && state.intent.source === 'manual')
    return { step: 'condition', source: 'manual' };
  return { step: 'source' };
}
export function entryHref(state: EntryState): string {
  if (state.step === 'source') return '/demo';
  if (state.step === 'condition') return '/demo?start=manual';
  if (state.intent.source === 'photos') return '/demo?start=photos';
  return `/demo?start=manual&condition=${state.intent.condition}`;
}
