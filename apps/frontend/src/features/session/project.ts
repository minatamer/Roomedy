import { projectSchema, recoverySchema } from '@roomedy/contracts/project';
import type { Project, Recovery } from '@roomedy/contracts/project';
import { POLICY, VERSIONS } from '@roomedy/contracts/policy';
import { jsonBytes, validateRoom } from '@roomedy/spatial';
import type { SessionSnapshot } from './state';

export type ProjectFailure =
  | 'too-large'
  | 'unsupported-version'
  | 'invalid-project'
  | 'unsupported-room'
  | 'expired';
export const projectMessages: Record<ProjectFailure, string> = {
  'too-large':
    'This project exceeds the 1 MiB file or 512 KiB room-and-Before limit.',
  'unsupported-version':
    'This project needs a different Roomedy, catalogue or rules version. Keep your current room and use its matching version.',
  'invalid-project':
    'This is not a valid Roomedy project. Your current room is unchanged.',
  'unsupported-room':
    'This project contains unsupported furniture or room values. Your current room is unchanged.',
  expired:
    'The saved room has expired. Start a new room or import a downloaded project.',
};
type Result<T> = { ok: true; value: T } | { ok: false; code: ProjectFailure };
export function validateProject(input: unknown): Result<Project> {
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: 'invalid-project' };
  if (
    jsonBytes({
      current: parsed.data.current,
      baseline: parsed.data.baseline,
    }) > POLICY.semanticPairBytes
  )
    return { ok: false, code: 'too-large' };
  if (!validateRoom(parsed.data.current) || !validateRoom(parsed.data.baseline))
    return { ok: false, code: 'unsupported-room' };
  return { ok: true, value: parsed.data };
}
function decode(text: string): Result<unknown> {
  if (
    text.length > POLICY.projectBytes ||
    new TextEncoder().encode(text).byteLength > POLICY.projectBytes
  )
    return { ok: false, code: 'too-large' };
  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, code: 'invalid-project' };
  }
}
export function readProject(text: string): Result<Project> {
  const decoded = decode(text);
  if (!decoded.ok) return decoded;
  const value = decoded.value;
  if (
    value &&
    typeof value === 'object' &&
    'format' in value &&
    value.format === 'roomedy-project' &&
    (('version' in value && value.version !== 1) ||
      ('catalogueVersion' in value &&
        value.catalogueVersion !== VERSIONS.catalogue) ||
      ('rulesVersion' in value && value.rulesVersion !== VERSIONS.rules))
  )
    return { ok: false, code: 'unsupported-version' };
  return validateProject(value);
}
export function readRecovery(text: string, now: number): Result<Recovery> {
  const decoded = decode(text);
  if (!decoded.ok) return decoded;
  const parsed = recoverySchema.safeParse(decoded.value);
  if (!parsed.success) return { ok: false, code: 'invalid-project' };
  if (parsed.data.createdAt > now || parsed.data.expiresAt <= now)
    return { ok: false, code: 'expired' };
  const project = validateProject(parsed.data.project);
  return project.ok
    ? { ok: true, value: { ...parsed.data, project: project.value } }
    : project;
}
/** Explicit semantic projection, never whole-session serialization. */
export function projectOf(state: SessionSnapshot): Project | null {
  if (!state.workspace || state.phase !== 'editor') return null;
  const parsed = validateProject({
    format: 'roomedy-project',
    version: 1,
    catalogueVersion: VERSIONS.catalogue,
    rulesVersion: VERSIONS.rules,
    current: state.workspace.current,
    baseline: state.workspace.baseline,
  });
  return parsed.ok ? parsed.value : null;
}
export function recoveryOf(state: SessionSnapshot): Recovery | null {
  const project = projectOf(state);
  return project
    ? {
        createdAt: state.createdAt,
        expiresAt: state.expiresAt,
        project,
        ui: { view: state.presentation.roomView === 'plan' ? '2d' : '3d' },
      }
    : null;
}
export function exportProject(state: SessionSnapshot): string | null {
  const project = projectOf(state);
  if (!project) return null;
  const text = JSON.stringify(project, null, 2);
  return new TextEncoder().encode(text).byteLength <= POLICY.projectBytes
    ? text
    : null;
}
