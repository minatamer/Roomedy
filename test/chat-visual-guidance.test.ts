import { describe, expect, it } from 'vitest';
import {
  designVisualGuidance,
  marketVisualGuidance,
} from '../apps/frontend/src/features/assistant/visual-guidance.js';
const none = { preview: false, objects: 0, catalogue: 0, issues: 0 };
describe('guidance follows actual rendered interactions', () => {
  it('does not invent visuals, active previews or editing actions for an inactive reply', () => {
    expect(designVisualGuidance(none)).toBe('');
    const historical = designVisualGuidance({ ...none, objects: 1 });
    expect(historical).toContain('inspect');
    expect(historical).not.toContain('Apply');
    expect(historical).not.toContain('Cancel');
    expect(historical).not.toContain('suggested');
  });
  it('includes only the action families present, including a full mixed preview', () => {
    const catalogue = designVisualGuidance({ ...none, catalogue: 2 });
    expect(catalogue).toContain('open Furniture');
    expect(catalogue).not.toContain('Apply');
    expect(catalogue).not.toContain('check');
    const preview = designVisualGuidance({
      preview: true,
      objects: 1,
      catalogue: 1,
      issues: 1,
    });
    for (const action of [
      'Apply changes',
      'Cancel',
      'inspect',
      'open Furniture',
      'check',
    ])
      expect(preview).toContain(action);
  });
  it('does not tell visitors to choose while busy or when no options were found', () => {
    expect(marketVisualGuidance(false, 0, false)).toBe('');
    expect(marketVisualGuidance(true, 3, true)).toContain(
      'after the search finishes',
    );
    expect(marketVisualGuidance(true, 3, true)).not.toContain('Choose button');
  });
  it('explains carousel controls only for a result with several options', () => {
    expect(marketVisualGuidance(false, 1, false)).not.toContain('arrows');
    expect(marketVisualGuidance(false, 2, true)).toContain('arrows');
    expect(marketVisualGuidance(false, 2, true)).toContain('Choose button');
  });
});
