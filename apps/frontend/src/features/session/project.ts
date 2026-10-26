import { projectSchema, recoverySchema } from '@roomedy/contracts/project';
import type { Project, Recovery } from '@roomedy/contracts/project';
import { POLICY, VERSIONS } from '@roomedy/contracts/policy';
import { CALCULATION_VERSION } from '@roomedy/contracts/estimates';
import {
  jsonBytes,
  validateRoom,
  calculateRoomEstimate,
} from '@roomedy/spatial';
import type { SessionSnapshot } from './state';

export type ProjectFailure =
  | 'too-large'
  | 'unsupported-version'
  | 'invalid-project'
  | 'unsupported-room'
  | 'expired';
export const projectMessages: Record<ProjectFailure, string> = {
  'too-large':
    'This project exceeds the 1 MiB file or 512 KiB current-room-and-Before limit. Keep fewer saved versions in a project file.',
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
function unsupportedVersion(input: unknown) {
  if (
    !input ||
    typeof input !== 'object' ||
    !('format' in input) ||
    input.format !== 'roomedy-project'
  )
    return false;
  const raw = input as Record<string, unknown>;
  const other = (value: unknown, key: string, expected: unknown) =>
    !!value &&
    typeof value === 'object' &&
    key in value &&
    (value as Record<string, unknown>)[key] !== expected;
  return (
    (raw.version !== 1 && raw.version !== 2) ||
    other(raw, 'catalogueVersion', VERSIONS.catalogue) ||
    other(raw, 'rulesVersion', VERSIONS.rules) ||
    (Array.isArray(raw.versions) &&
      (raw.versions as unknown[]).some(
        (v) =>
          other(v, 'catalogueVersion', VERSIONS.catalogue) ||
          other(v, 'rulesVersion', VERSIONS.rules) ||
          other(v, 'calculationVersion', CALCULATION_VERSION) ||
          other(v, 'representationVersion', 'roomedy-cpq-1'),
      ))
  );
}
export function validateProject(input: unknown): Result<Project> {
  if (unsupportedVersion(input))
    return { ok: false, code: 'unsupported-version' };
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: 'invalid-project' };
  if (jsonBytes(parsed.data) > POLICY.projectBytes - 1024)
    return { ok: false, code: 'too-large' };
  if (
    jsonBytes({
      current: parsed.data.current,
      baseline: parsed.data.baseline,
    }) > POLICY.semanticPairBytes
  )
    return { ok: false, code: 'too-large' };
  if (!validateRoom(parsed.data.current) || !validateRoom(parsed.data.baseline))
    return { ok: false, code: 'unsupported-room' };
  const cost = parsed.data.cost;
  if (
    cost &&
    !calculateRoomEstimate(parsed.data.current, cost.settings, cost.offers).ok
  )
    return { ok: false, code: 'invalid-project' };
  for (const version of parsed.data.versions) {
    if (!validateRoom(version.room))
      return { ok: false, code: 'unsupported-room' };
    const result = calculateRoomEstimate(
      version.room,
      version.pricing.settings,
      version.pricing.offers,
    );
    if (
      !result.ok ||
      JSON.stringify(result.estimate) !== JSON.stringify(version.estimate)
    )
      return { ok: false, code: 'invalid-project' };
  }
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
  return validateProject(decoded.value);
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
    version: 2,
    catalogueVersion: VERSIONS.catalogue,
    rulesVersion: VERSIONS.rules,
    current: state.workspace.current,
    baseline: state.workspace.baseline,
    cost: state.cost
      ? {
          settings: state.cost.settings,
          offers: state.cost.offers,
          budgetMinor: state.cost.budgetMinor,
        }
      : null,
    versions: state.estimateVersions,
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
        ui: {
          view: state.presentation.roomView === 'plan' ? '2d' : '3d',
          destination: state.destination,
        },
      }
    : null;
}
export function exportProject(state: SessionSnapshot): string | null {
  const project = projectOf(state);
  if (!project) return null;
  const text = JSON.stringify(project);
  return new TextEncoder().encode(text).byteLength <= POLICY.projectBytes
    ? text
    : null;
}
