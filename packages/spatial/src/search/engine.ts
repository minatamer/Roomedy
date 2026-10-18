import { POLICY, VERSIONS } from '@roomedy/contracts/policy';
import {
  actionScopeSchema,
  operationIdentitySchema,
  proposalBatchSchema,
} from '@roomedy/contracts/commands';
import type { ActionScope, ProposalAction } from '@roomedy/contracts/commands';
import {
  searchRequestSchema,
  searchResultSchema,
} from '@roomedy/contracts/search';
import type {
  SearchRequest,
  SearchResult,
  SearchChoice,
  SearchCandidate,
} from '@roomedy/contracts/search';
import type { Furniture } from '@roomedy/contracts/room';
import { validateRoom, preservesHardIssue } from '../commands.js';
import { checkRoom } from '../checks.js';
import { findCatalogueEntry } from '../catalogue.js';
import { jsonBytes } from '../history.js';
import { evaluateScopedBatch } from './scope.js';
import { candidatePositions, windowPoint } from './positions.js';
import type { SearchPose } from './positions.js';
import { candidateRank, searchFacts } from './facts.js';

const emptyIdentity = {
  workspaceId: 'invalid',
  generation: 0,
  operationId: 'invalid',
  roomId: 'invalid',
  inputRevision: 0,
};
export function emptySearchResult(
  identity: unknown,
  seed = 0,
  termination: SearchResult['termination'] = 'invalid-input',
): SearchResult {
  const parsed = operationIdentitySchema.safeParse(identity);
  return {
    identity: parsed.success ? parsed.data : emptyIdentity,
    seed: Number.isInteger(seed) && seed >= 0 && seed <= 0xffffffff ? seed : 0,
    visitedNodes: 0,
    evaluated: 0,
    pruned: 0,
    termination,
    candidate: null,
    question: null,
    alternatives: [],
  };
}
export function proposedSearchPiece(choice: SearchChoice): Furniture | null {
  const entry = findCatalogueEntry(choice.catalogueId, VERSIONS.catalogue);
  if (!entry) return null;
  const dimension = (axis: 'width' | 'depth' | 'height') => ({
    value: choice.size?.[axis] ?? entry.size[axis].default,
    status: 'estimated' as const,
    sourceId: 'selected-variant',
  });
  return {
    id: choice.id,
    label: entry.label,
    catalogueId: entry.id,
    catalogueVersion: entry.version,
    dimensions: {
      width: dimension('width'),
      depth: dimension('depth'),
      height: dimension('height'),
    },
    pose: {
      centerX: 0,
      centerZ: 0,
      quarterTurns: 0,
      provenance: { status: 'planned', sourceId: 'assistant-plan' },
    },
    ownership: 'proposed',
    preference: 'flexible',
    locks: { position: false, rotation: false, dimensions: false },
    finish: choice.finish ?? entry.finishes[0]!,
  };
}
type Actor = { piece: Furniture; kind: 'existing' | 'add' | 'replace' };
type Frame = { positions: SearchPose[]; next: number };
const rankLess = (a: readonly number[], b: readonly number[]) => {
  for (let i = 0; i < a.length; i++) {
    if (a[i]! < b[i]!) return true;
    if (a[i]! > b[i]!) return false;
  }
  return false;
};
/** Pure incremental DFS. No clock, I/O, scheduler, accepted-room mutation or retained visited history. */
export class LayoutSearch {
  readonly request: SearchRequest;
  readonly scope: ActionScope;
  private result: SearchResult;
  private actors: Actor[] = [];
  private fixed: Furniture[] = [];
  private placed: Furniture[] = [];
  private frames: Frame[] = [];
  private done = false;
  private beforeChecks;
  private bestRank: number[] | null = null;
  constructor(raw: unknown, rawScope: unknown) {
    const request = searchRequestSchema.safeParse(raw),
      scope = actionScopeSchema.safeParse(rawScope);
    if (!request.success || !scope.success)
      throw new Error('invalid-search-input');
    this.request = request.data;
    this.scope = scope.data;
    this.result = emptySearchResult(
      this.request.identity,
      this.request.seed,
      'exhausted',
    );
    this.beforeChecks = checkRoom(this.request.room);
    if (
      !validateRoom(this.request.room) ||
      jsonBytes({ request: this.request, scope: this.scope }) >
        POLICY.searchMessageBytes ||
      this.request.identity.roomId !== this.request.room.roomId ||
      this.request.identity.inputRevision !== this.request.room.roomRevision
    ) {
      this.stop('invalid-input');
      return;
    }
    if (
      this.scope.roomId !== this.request.room.roomId ||
      this.scope.roomRevision !== this.request.room.roomRevision
    ) {
      this.stop('out-of-scope');
      return;
    }
    this.prepare();
  }
  private stop(
    reason: SearchResult['termination'],
    alternatives: SearchResult['alternatives'] = [],
  ) {
    this.done = true;
    this.result.termination = reason;
    this.result.alternatives = alternatives;
  }
  private question(
    id: string,
    field: NonNullable<SearchResult['question']>['field'],
  ) {
    this.result.question = { id, field };
    this.stop('needs-measurement', ['confirm-measurement']);
  }
  private prepare() {
    const { room, goal } = this.request,
      existing = new Map(room.furniture.map((p) => [p.id, p]));
    const choiceIds = [...goal.additions, ...goal.replacements].map(
      (p) => p.id,
    );
    const arrays = [
      goal.targetIds,
      goal.retainedIds,
      goal.fixedIds,
      goal.removals,
      choiceIds,
      goal.pieceFinishes.map((p) => p.id),
    ];
    if (
      arrays.some((ids) => new Set(ids).size !== ids.length) ||
      goal.additions.some((p) => existing.has(p.id)) ||
      goal.replacements.some((p) => !existing.has(p.id)) ||
      [...goal.retainedIds, ...goal.fixedIds, ...goal.removals].some(
        (id) => !existing.has(id),
      ) ||
      goal.targetIds.some((id) => !existing.has(id) && !choiceIds.includes(id))
    ) {
      this.stop('invalid-input');
      return;
    }
    if (
      goal.retainedIds.some(
        (id) =>
          goal.removals.includes(id) ||
          goal.replacements.some((p) => p.id === id),
      ) ||
      goal.fixedIds.some(
        (id) =>
          goal.removals.includes(id) ||
          goal.replacements.some((p) => p.id === id),
      )
    ) {
      this.stop('out-of-scope');
      return;
    }
    if (
      goal.kind === 'rearrange-owned' &&
      (goal.additions.length ||
        goal.replacements.length ||
        goal.removals.length ||
        goal.targetIds.some((id) => existing.get(id)?.ownership !== 'owned'))
    ) {
      this.stop('out-of-scope');
      return;
    }
    if (
      (goal.kind !== 'appearance' &&
        (goal.roomFinish || goal.pieceFinishes.length)) ||
      (goal.kind === 'appearance' &&
        (goal.additions.length ||
          goal.replacements.length ||
          goal.removals.length))
    ) {
      this.stop('unsupported');
      return;
    }
    if (goal.kind === 'window' && !goal.windowId) {
      this.stop('unsupported', ['relax-preference']);
      return;
    }
    if (goal.kind !== 'appearance') {
      for (const axis of ['width', 'depth'] as const)
        if (room.room[axis].value === null) {
          this.question(room.roomId, axis);
          return;
        }
      if (goal.windowId && !windowPoint(room, goal.windowId)) {
        const feature = room.room.features.find(
          (f) => f.id === goal.windowId && f.kind === 'window',
        );
        if (!feature) {
          this.stop('unsupported');
          return;
        }
        this.question(
          feature.id,
          feature.wall === 'unknown'
            ? 'wall'
            : feature.offset.value === null
              ? 'offset'
              : 'width',
        );
        return;
      }
    }
    for (const id of goal.targetIds) {
      const piece = existing.get(id);
      if (
        piece &&
        !goal.fixedIds.includes(id) &&
        !goal.replacements.some((c) => c.id === id) &&
        !goal.removals.includes(id)
      )
        this.actors.push({ piece, kind: 'existing' });
    }
    for (const [kind, choices] of [
      ['add', goal.additions],
      ['replace', goal.replacements],
    ] as const)
      for (const choice of choices) {
        const piece = proposedSearchPiece(choice);
        if (!piece) {
          this.stop('unsupported', ['choose-smaller-replacement']);
          return;
        }
        this.actors.push({ piece, kind });
      }
    if (
      goal.kind === 'window' &&
      !this.actors.some(
        (a) =>
          findCatalogueEntry(a.piece.catalogueId, a.piece.catalogueVersion)
            ?.category === 'desk',
      )
    ) {
      this.stop(
        'unsupported',
        goal.targetIds.some((id) => goal.fixedIds.includes(id))
          ? ['review-lock']
          : ['include-coordinated-piece'],
      );
      return;
    }
    if (goal.kind === 'appearance') this.actors = [];
    const priority = (p: Furniture) => {
      const category = findCatalogueEntry(
        p.catalogueId,
        p.catalogueVersion,
      )!.category;
      return goal.windowId
        ? { desk: 0, chair: 1, wardrobe: 2, bed: 3, storage: 4 }[category]
        : { wardrobe: 0, bed: 1, desk: 2, chair: 3, storage: 4 }[category];
    };
    this.actors.sort(
      (a, b) =>
        priority(a.piece) - priority(b.piece) ||
        (a.piece.id < b.piece.id ? -1 : a.piece.id > b.piece.id ? 1 : 0),
    );
    const actorIds = new Set(this.actors.map((a) => a.piece.id));
    this.fixed = room.furniture.filter(
      (p) => !actorIds.has(p.id) && !goal.removals.includes(p.id),
    );
    if (
      !validateRoom({
        ...room,
        furniture: [...this.fixed, ...this.actors.map((a) => a.piece)],
      })
    ) {
      this.stop('unsupported', ['choose-smaller-replacement']);
      return;
    }
    // Fail before exploration if the resolved goal asks for targets/kinds beyond the captured permission.
    if (
      this.actors.some((a) =>
        a.kind === 'existing'
          ? !this.scope.targetIds.includes(a.piece.id)
          : !(
              a.kind === 'add' ? this.scope.additions : this.scope.replacements
            ).some(
              (p) =>
                p.id === a.piece.id && p.catalogueId === a.piece.catalogueId,
            ),
      )
    ) {
      this.stop('out-of-scope');
      return;
    }
    for (const actor of this.actors)
      for (const axis of ['width', 'depth'] as const)
        if (actor.piece.dimensions[axis].value === null) {
          this.question(actor.piece.id, axis);
          return;
        }
    if (this.actors.length)
      this.frames.push({
        positions: candidatePositions(
          this.actors[0]!.piece,
          { ...room, furniture: this.fixed },
          goal,
          this.request.seed,
        ),
        next: 0,
      });
  }
  get finished() {
    return this.done;
  }
  get progress() {
    return {
      visitedNodes: this.result.visitedNodes,
      evaluated: this.result.evaluated,
      pruned: this.result.pruned,
    };
  }
  private actions(): ProposalAction[] {
    const goal = this.request.goal,
      actions: ProposalAction[] = [];
    for (const id of goal.removals) actions.push({ type: 'remove', id });
    for (const [index, actor] of this.actors.entries()) {
      const piece = this.placed[index]!;
      if (actor.kind === 'add') actions.push({ type: 'add', furniture: piece });
      else if (actor.kind === 'replace')
        actions.push({ type: 'replace', id: piece.id, furniture: piece });
      else if (
        piece.pose.centerX !== actor.piece.pose.centerX ||
        piece.pose.centerZ !== actor.piece.pose.centerZ
      )
        actions.push({
          type: 'move',
          id: piece.id,
          pose: {
            centerX: piece.pose.centerX,
            centerZ: piece.pose.centerZ,
            quarterTurns: piece.pose.quarterTurns,
          },
        });
      else if (piece.pose.quarterTurns !== actor.piece.pose.quarterTurns)
        actions.push({
          type: 'rotate',
          id: piece.id,
          quarterTurns: piece.pose.quarterTurns,
        });
    }
    if (goal.roomFinish)
      actions.push({ type: 'room-finish', ...goal.roomFinish });
    for (const finish of goal.pieceFinishes)
      actions.push({ type: 'finish', ...finish });
    return actions;
  }
  private evaluate() {
    this.result.evaluated++;
    const actions = this.actions();
    if (!actions.length) return;
    const candidate = evaluateSearchActions(
      this.request,
      actions,
      this.scope,
      this.beforeChecks,
    );
    if (!candidate) return;
    const { facts, checks } = candidate;
    const rank = candidateRank(this.request.goal, facts, checks);
    if (!this.bestRank || rankLess(rank, this.bestRank)) {
      if (jsonBytes(candidate) > POLICY.searchMessageBytes) return;
      this.bestRank = rank;
      this.result.candidate = candidate;
    }
  }
  step(requested: number = POLICY.searchSliceNodes): boolean {
    if (!Number.isFinite(requested) || requested < 1) {
      this.stop('invalid-input');
      return true;
    }
    let remaining = Math.max(
      0,
      Math.min(POLICY.searchSliceNodes, Math.floor(requested)),
    );
    while (!this.done && remaining-- > 0) {
      if (this.result.visitedNodes >= this.request.maxNodes) {
        this.stop('work-limit');
        break;
      }
      if (!this.actors.length) {
        this.result.visitedNodes++;
        this.evaluate();
        this.stop('exhausted');
        break;
      }
      while (
        this.frames.length &&
        this.frames.at(-1)!.next >= this.frames.at(-1)!.positions.length
      ) {
        this.frames.pop();
        this.placed.pop();
      }
      if (!this.frames.length) {
        this.stop('exhausted');
        break;
      }
      const depth = this.frames.length - 1,
        frame = this.frames[depth]!,
        actor = this.actors[depth]!,
        pose = frame.positions[frame.next++]!;
      this.result.visitedNodes++;
      this.placed[depth] = {
        ...actor.piece,
        pose: {
          ...pose,
          provenance: { status: 'planned', sourceId: 'assistant-plan' },
        },
      };
      const partial = {
        ...this.request.room,
        furniture: [...this.fixed, ...this.placed.slice(0, depth + 1)],
      };
      const checks = checkRoom(partial);
      if (
        checks.issues.some(
          (issue) =>
            issue.severity === 'hard' &&
            !preservesHardIssue(
              this.beforeChecks.issues.find(
                (old) => old.id === issue.id && old.severity === 'hard',
              ),
              issue,
            ),
        )
      ) {
        this.result.pruned++;
        continue;
      }
      if (depth === this.actors.length - 1) this.evaluate();
      else
        this.frames.push({
          positions: candidatePositions(
            this.actors[depth + 1]!.piece,
            partial,
            this.request.goal,
            this.request.seed,
          ),
          next: 0,
        });
    }
    return this.done;
  }
  finish(reason?: 'deadline' | 'cancelled'): SearchResult {
    if (reason && !this.done) this.stop(reason);
    if (!this.done) throw new Error('search-still-running');
    if (this.result.termination === 'cancelled') this.result.candidate = null;
    if (this.result.candidate?.facts.missingInputs.length)
      this.result.alternatives = ['confirm-measurement'];
    if (
      !this.result.candidate &&
      !this.result.alternatives.length &&
      this.result.termination !== 'cancelled'
    ) {
      const requestedLock = this.request.goal.targetIds.some((id) => {
        const locks = this.request.room.furniture.find(
          (p) => p.id === id,
        )?.locks;
        return (
          this.request.goal.fixedIds.includes(id) ||
          !!locks?.position ||
          !!locks?.rotation
        );
      });
      this.result.alternatives = requestedLock
        ? ['review-lock', 'relax-preference', 'no-improvement-within-search']
        : ['no-improvement-within-search', 'relax-preference', 'omit-optional'];
    }
    return searchResultSchema.parse(this.result);
  }
}
/** Recompute candidate facts/geometry; claimed checks or pass flags never grant authority. */
export function validateSearchCandidate(
  request: SearchRequest,
  candidate: Pick<SearchCandidate, 'actions'>,
  scope: ActionScope,
): SearchCandidate | null {
  return evaluateSearchActions(request, candidate.actions, scope);
}
function evaluateSearchActions(
  request: SearchRequest,
  raw: unknown,
  scope: ActionScope,
  beforeChecks = checkRoom(request.room),
): SearchCandidate | null {
  const parsed = proposalBatchSchema.safeParse(raw);
  if (!parsed.success) return null;
  const actions = parsed.data,
    goal = request.goal;
  const variant = (piece: Furniture, choices: SearchChoice[]) => {
    const choice = choices.find((p) => p.id === piece.id),
      expected = choice ? proposedSearchPiece(choice) : null;
    return (
      !!expected &&
      piece.catalogueId === expected.catalogueId &&
      piece.finish === expected.finish &&
      (['width', 'depth', 'height'] as const).every(
        (axis) =>
          piece.dimensions[axis].value === expected.dimensions[axis].value,
      )
    );
  };
  if (
    actions.some((action) => {
      if (action.type === 'room-finish')
        return (
          goal.kind !== 'appearance' ||
          !goal.roomFinish ||
          action.floorFinish !== goal.roomFinish.floorFinish ||
          action.wallFinish !== goal.roomFinish.wallFinish
        );
      if (action.type === 'add')
        return (
          goal.kind === 'appearance' ||
          goal.kind === 'rearrange-owned' ||
          !variant(action.furniture, goal.additions)
        );
      if (action.type === 'replace')
        return (
          goal.kind === 'appearance' ||
          goal.kind === 'rearrange-owned' ||
          goal.retainedIds.includes(action.id) ||
          goal.fixedIds.includes(action.id) ||
          !variant(action.furniture, goal.replacements)
        );
      if (action.type === 'remove')
        return (
          goal.kind === 'appearance' ||
          goal.kind === 'rearrange-owned' ||
          !goal.removals.includes(action.id) ||
          goal.retainedIds.includes(action.id) ||
          goal.fixedIds.includes(action.id)
        );
      if (action.type === 'finish')
        return (
          goal.kind !== 'appearance' ||
          !goal.pieceFinishes.some(
            (p) => p.id === action.id && p.finish === action.finish,
          )
        );
      if (action.type === 'resize') return true;
      return (
        goal.kind === 'appearance' ||
        !goal.targetIds.includes(action.id) ||
        goal.fixedIds.includes(action.id) ||
        (goal.kind === 'rearrange-owned' &&
          request.room.furniture.find((p) => p.id === action.id)?.ownership !==
            'owned')
      );
    })
  )
    return null;
  const evaluated = evaluateScopedBatch(request.room, actions, scope);
  if (!evaluated.ok || !evaluated.changed) return null;
  const facts = searchFacts(
    request.room,
    evaluated.room,
    goal,
    evaluated.checks,
  );
  const before = beforeChecks.issues.filter((i) => i.severity === 'hard'),
    after = evaluated.checks.issues.filter((i) => i.severity === 'hard');
  const repair =
    after.length < before.length ||
    after.some((i) => {
      const old = before.find((p) => p.id === i.id);
      return (
        old &&
        ((i.areaMm2 ?? 0) < (old.areaMm2 ?? 0) ||
          (i.deficitMm ?? 0) < (old.deficitMm ?? 0))
      );
    });
  // These are selected goal preferences, not replacements for hard geometry or ergonomic claims.
  if (
    facts.deskChairAlignmentMm.after !== null &&
    (facts.deskChairAlignmentMm.after > POLICY.searchGroupToleranceMm ||
      facts.chairFacesDesk.after === false)
  )
    return null;
  if (
    goal.kind === 'window' &&
    facts.windowDistanceMm.before !== null &&
    (facts.windowDistanceMm.after === null ||
      facts.windowDistanceMm.after >= facts.windowDistanceMm.before)
  )
    return null;
  if (
    goal.kind === 'rearrange-owned' &&
    (facts.centralFreeMm2.after ?? 0) <= (facts.centralFreeMm2.before ?? 0) &&
    !repair
  )
    return null;
  return {
    actions,
    affectedIds: evaluated.affectedIds,
    checks: evaluated.checks,
    facts,
  };
}
