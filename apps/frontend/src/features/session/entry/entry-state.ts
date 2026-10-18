export type EntrySource = 'sample' | 'own';
export type RoomCondition = 'empty' | 'partial' | 'furnished';
export type EntryIntent = { source: EntrySource; condition: RoomCondition };
export type EntryState =
  | { step: 'source' }
  | { step: 'condition'; source: EntrySource }
  | { step: 'ready'; intent: EntryIntent };
export type EntryAction =
  | { type: 'source'; source: EntrySource }
  | { type: 'condition'; condition: RoomCondition }
  | { type: 'back' };
export function parseEntryIntent(
  source: string | undefined,
  condition: string | undefined,
): EntryState {
  if (source !== 'sample' && source !== 'own') return { step: 'source' };
  if (
    condition === 'empty' ||
    condition === 'partial' ||
    condition === 'furnished'
  )
    return { step: 'ready', intent: { source, condition } };
  return { step: 'condition', source };
}
export function entryReducer(
  state: EntryState,
  action: EntryAction,
): EntryState {
  if (action.type === 'source')
    return { step: 'condition', source: action.source };
  if (action.type === 'condition')
    return state.step === 'condition'
      ? {
          step: 'ready',
          intent: { source: state.source, condition: action.condition },
        }
      : state;
  if (state.step === 'ready')
    return { step: 'condition', source: state.intent.source };
  return { step: 'source' };
}
export function entryHref(state: EntryState): string {
  if (state.step === 'source') return '/demo';
  if (state.step === 'condition') return `/demo?start=${state.source}`;
  return `/demo?start=${state.intent.source}&condition=${state.intent.condition}`;
}
