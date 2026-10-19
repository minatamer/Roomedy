import {
  assistantToolSchemas,
  assistantReplySchema,
} from '@roomedy/contracts/assistant';
import type {
  AssistantReply,
  AssistantTool,
} from '@roomedy/contracts/assistant';
import type { OperationInput } from '@roomedy/contracts/operations';
import type { ProposalAction } from '@roomedy/contracts/commands';
import type { SearchResult } from '@roomedy/contracts/search';
import { POLICY } from '@roomedy/contracts/policy';
import {
  CATALOGUE,
  checkRoom,
  emptyAssistantReply,
  evaluateScopedBatch,
  proposedSearchPiece,
  validateSearchCandidate,
  searchFacts,
} from '@roomedy/spatial';
import type { AssistantTask } from '@roomedy/spatial';
import { runBackendLayoutSearch } from './layout-search.js';

type Input = Extract<OperationInput, { kind: 'assistant' }>;
export function createAssistantTools(
  input: Input,
  task: AssistantTask,
  signal: AbortSignal,
) {
  const room = input.room,
    checks = checkRoom(room);
  let reply = emptyAssistantReply(room, task.label),
    prepared: string | null = null,
    search: SearchResult | null = null;
  const ids = new Set([
    room.roomId,
    ...room.furniture.map((p) => p.id),
    ...room.room.features.map((f) => f.id),
  ]);
  let decisions = 0;
  const reject = () => ({ ok: false, code: 'unsupported-tool-input' });
  function prepare(
    actions: ProposalAction[],
    facts: AssistantReply['facts'] = null,
  ) {
    if (signal.aborted) return reject();
    if (
      task.actions &&
      JSON.stringify(actions) !== JSON.stringify(task.actions)
    )
      return reject();
    decisions++;
    const evaluated = evaluateScopedBatch(room, actions, task.scope);
    if (!evaluated.ok) {
      reply = {
        ...emptyAssistantReply(
          room,
          evaluated.code === 'locked'
            ? 'A protected piece cannot move. Review its locks before requesting a new proposal.'
            : evaluated.code === 'retained'
              ? 'This piece is protected as Keep. Review its preference and locks before a replacement or removal.'
              : 'That batch introduces an unsupported change or new modeled conflict. Your current room is unchanged.',
        ),
        objectIds: evaluated.issue?.objectIds ?? task.objectIds,
        blockedIssue: evaluated.issue ?? null,
      };
      return {
        ok: ['new-conflict', 'locked', 'retained', 'no-improvement'].includes(
          evaluated.code,
        ),
        blocked: true,
        code: evaluated.code,
        checks: evaluated.issue ? [evaluated.issue] : [],
      };
    }
    if (task.goal && evaluated.changed) {
      let base = actions;
      if (task.extraFinish) {
        const finishes = actions.filter((a) => a.type === 'room-finish');
        if (
          finishes.length !== 1 ||
          JSON.stringify(finishes[0]) !== JSON.stringify(task.extraFinish)
        )
          return reject();
        base = actions.filter((a) => a.type !== 'room-finish');
      }
      const checked = validateSearchCandidate(
        {
          identity: input.identity,
          room,
          goal: task.goal,
          seed: 42,
          maxNodes: POLICY.searchCandidates,
        },
        { actions: base },
        task.scope,
      );
      if (!checked) return reject();
      // Include every changed item in the final atomic batch, including an extra room palette.
      facts = searchFacts(room, evaluated.room, task.goal, evaluated.checks);
    }
    const payload = JSON.stringify(actions);
    if (prepared !== null && payload !== prepared) return reject();
    prepared = payload;
    const missing = evaluated.checks.coverage.filter(
      (c) => c.status === 'unassessed' || c.unassessed > 0,
    ).length;
    const changedPieces = evaluated.affectedIds.flatMap((id) => {
      const p =
        evaluated.room.furniture.find((p) => p.id === id) ??
        room.furniture.find((p) => p.id === id);
      return p ? [p.label.slice(0, 60)] : [];
    });
    const names =
      changedPieces.slice(0, 3).join(', ') +
      (changedPieces.length > 3 ? ' and other requested pieces' : '');
    const window = facts?.windowDistanceMm,
      centre = facts?.centralFreeMm2;
    const tradeoff =
      window?.before !== null &&
      window?.before !== undefined &&
      window.after !== null
        ? `The work area moves closer to daylight: ${Math.round(window.before)} → ${Math.round(window.after)} mm from the window. `
        : centre?.before !== null &&
            centre?.before !== undefined &&
            centre.after !== null &&
            centre.after > centre.before
          ? `The modeled free centre grows from ${(centre.before / 1e6).toFixed(2)} to ${(centre.after / 1e6).toFixed(2)} m²; furniture sizes stay the same. `
          : '';
    const palette = task.extraFinish ?? task.goal?.roomFinish;
    const style = palette
      ? palette.wallFinish === 'clay'
        ? 'Oak and clay bring warmth without changing owned furniture finishes. '
        : palette.wallFinish === 'sage'
          ? 'Walnut and sage give the room a calmer, coordinated palette. '
          : 'Oak and ivory keep the room light and airy. '
      : '';
    const invitation =
      task.goal?.kind === 'appearance' && task.goal.pieceFinishes.length === 1
        ? `I’d use ${task.goal.pieceFinishes[0]!.finish} for ${names}. `
        : task.goal?.kind === 'open-space'
          ? `I’d reposition ${names || 'the requested pieces'} for a clearer centre. `
          : task.goal?.kind === 'window'
            ? `I’d bring ${names || 'the work area'} nearer the window. `
            : `${task.label}${names ? `: ${names}` : ''}. `;
    reply = {
      ...emptyAssistantReply(
        room,
        evaluated.changed
          ? `${invitation}${tradeoff}${style}${missing ? `${missing} ${missing === 1 ? 'check still needs' : 'checks still need'} measurements before relying on the fit.` : 'Review this arrangement, then Apply if it works for you.'}`
          : 'This request needs no room change.',
      ),
      kind: evaluated.changed ? 'proposal' : 'explanation',
      actions: evaluated.changed ? actions : null,
      objectIds: evaluated.affectedIds,
      checks: evaluated.checks,
      facts,
    };
    return {
      ok: true,
      changed: evaluated.changed,
      actions: evaluated.changed ? actions : [],
      checks: evaluated.checks,
      facts,
    };
  }
  async function arrangements() {
    if (!task.goal) return reject();
    if (!search) {
      const request = {
        identity: input.identity,
        room,
        goal: task.goal,
        seed: 42,
        maxNodes: POLICY.searchCandidates,
      };
      const local = input.localCandidate
        ? validateSearchCandidate(request, input.localCandidate, task.scope)
        : null;
      // Untrusted worker facts/geometry are recomputed by the backend, never forwarded as authority.
      if (input.localCandidate && !local) return reject();
      search = local
        ? {
            identity: input.identity,
            seed: 42,
            visitedNodes: 0,
            evaluated: 0,
            pruned: 0,
            termination: 'exhausted',
            candidate: local,
            question: null,
            alternatives: [],
          }
        : await runBackendLayoutSearch(request, task.scope, signal);
    }
    if (signal.aborted) return reject();
    if (search.candidate)
      return prepare(
        [
          ...search.candidate.actions,
          ...(task.extraFinish ? [task.extraFinish] : []),
        ],
        search.candidate.facts,
      );
    reply = {
      ...emptyAssistantReply(
        room,
        search.question
          ? 'One relevant measurement is needed before this arrangement can be proposed.'
          : 'No better arrangement was found within this bounded search. Review a measurement, lock or selected essential and try a new request.',
      ),
      kind: search.question ? 'visitor-action' : 'explanation',
      objectIds: search.question ? [search.question.id] : task.objectIds,
      question: search.question,
      control: search.question ? 'measurement' : null,
    };
    return {
      ok: true,
      termination: search.termination,
      question: search.question,
      alternatives: search.alternatives,
    };
  }
  async function execute(
    name: AssistantTool,
    args: unknown,
  ): Promise<Record<string, unknown>> {
    if (signal.aborted) return reject();
    const schema = assistantToolSchemas[name];
    if (!schema || !schema.safeParse(args).success) return reject();
    if (name === 'read_room') return { ok: true, room, checks };
    decisions++;
    if (name === 'find_furniture') {
      const a = assistantToolSchemas.find_furniture.parse(args),
        entries = CATALOGUE.filter(
          (e) =>
            (a.category === null || e.category === a.category) &&
            (a.maxWidth === null || e.size.width.min <= a.maxWidth) &&
            (a.maxDepth === null || e.size.depth.min <= a.maxDepth),
        );
      reply = {
        ...emptyAssistantReply(
          room,
          'Choose from these supported similar representations. Measure owned furniture separately; offered dimensions are estimates.',
        ),
        catalogueIds: entries.map((e) => e.id),
      };
      return { ok: true, items: entries };
    }
    if (name === 'explain_checks') {
      const a = assistantToolSchemas.explain_checks.parse(args),
        issue = a.issueId
          ? checks.issues.find((i) => i.id === a.issueId)
          : null;
      if (a.issueId && !issue) return reject();
      const hard = checks.issues.filter((i) => i.severity === 'hard').length,
        missing = checks.coverage.filter(
          (c) => c.status === 'unassessed' || c.unassessed > 0,
        ).length;
      reply = {
        ...emptyAssistantReply(
          room,
          `${hard ? `${hard} modeled space ${hard === 1 ? 'issue needs' : 'issues need'} review.` : 'No blocking issue was found in the modeled checks.'} ${missing ? `${missing} ${missing === 1 ? 'check still has' : 'checks still have'} missing inputs.` : 'These results apply only to the recorded evidence.'}`,
        ),
        objectIds: issue ? issue.objectIds : task.objectIds,
      };
      return { ok: true, checks: issue ? [issue] : checks };
    }
    if (name === 'find_arrangements') return arrangements();
    if (name === 'focus_item') {
      const a = assistantToolSchemas.focus_item.parse(args);
      if (!ids.has(a.id)) return reject();
      reply = {
        ...emptyAssistantReply(
          room,
          'Select this item to inspect its recorded measurements and room checks.',
        ),
        objectIds: [a.id],
      };
      return { ok: true, id: a.id };
    }
    if (name === 'request_measurement') {
      const a = assistantToolSchemas.request_measurement.parse(args);
      if (!ids.has(a.id)) return reject();
      const piece = room.furniture.find((p) => p.id === a.id),
        feature = room.room.features.find((f) => f.id === a.id);
      if (
        (a.id === room.roomId || piece) &&
        !['width', 'depth', 'height'].includes(a.field)
      )
        return reject();
      if (
        feature &&
        (a.field === 'depth' ||
          (a.field === 'hinge' && feature.kind !== 'door') ||
          (a.field === 'mechanism' && feature.kind === 'obstacle'))
      )
        return reject();
      const source =
        a.id === room.roomId ? room.room : piece ? piece.dimensions : feature;
      const value = source
        ? (source as unknown as Record<string, unknown>)[a.field]
        : undefined;
      const missing =
        value === 'unknown' ||
        (typeof value === 'object' &&
          value !== null &&
          'status' in value &&
          value.status === 'unknown');
      const tag = `${a.id === room.roomId ? 'room' : a.id}:${a.field}`;
      const relevant = checks.issues.some(
        (issue) =>
          issue.severity === 'unassessed' &&
          issue.requiredInputs.includes(tag) &&
          (task.objectIds.length === 0 ||
            a.id === room.roomId ||
            issue.objectIds.some((id) => task.objectIds.includes(id))),
      );
      if (!missing || !relevant) return reject();
      reply = {
        ...emptyAssistantReply(
          room,
          `Review ${a.field} for this item. Only your explicit field confirmation can record a measured value.`,
          'visitor-action',
        ),
        objectIds: [a.id],
        question: a,
        control: 'measurement',
      };
      return { ok: true, request: a };
    }
    if (name === 'request_lock_change') {
      const a = assistantToolSchemas.request_lock_change.parse(args),
        piece = room.furniture.find((p) => p.id === a.id);
      if (
        !piece ||
        !piece.locks[a.lock] ||
        (!task.objectIds.includes(a.id) && !task.scope.targetIds.includes(a.id))
      )
        return reject();
      reply = {
        ...emptyAssistantReply(
          room,
          `${piece.label} has a ${a.lock} lock. Review it in properties; the assistant cannot unlock it.`,
          'visitor-action',
        ),
        objectIds: [a.id],
        control: a.lock === 'position' ? 'position-lock' : 'rotation-lock',
      };
      return { ok: true, request: a };
    }
    if (name === 'request_undo') {
      if (task.kind !== 'undo') return reject();
      reply = {
        ...emptyAssistantReply(
          room,
          'Undo the latest room change with the shared Undo control?',
          'visitor-action',
        ),
        control: 'undo',
      };
      return { ok: true, visitorAction: 'undo' };
    }
    const a = assistantToolSchemas.prepare_edits.parse(args),
      actions: ProposalAction[] = [];
    for (const item of a.actions) {
      const required: Record<typeof item.type, string[]> = {
        move: ['id', 'centerX', 'centerZ', 'quarterTurns'],
        rotate: ['id', 'quarterTurns'],
        add: [
          'id',
          'catalogueId',
          'centerX',
          'centerZ',
          'quarterTurns',
          'finish',
        ],
        replace: [
          'id',
          'catalogueId',
          'centerX',
          'centerZ',
          'quarterTurns',
          'finish',
        ],
        remove: ['id'],
        finish: ['id', 'finish'],
        'room-finish': ['floorFinish', 'wallFinish'],
      };
      if (
        Object.entries(item).some(
          ([key, v]) =>
            key !== 'type' && !required[item.type].includes(key) && v !== null,
        )
      )
        return reject();
      if (item.type === 'room-finish') {
        if (!item.floorFinish || !item.wallFinish) return reject();
        actions.push({
          type: item.type,
          floorFinish: item.floorFinish,
          wallFinish: item.wallFinish,
        });
        continue;
      }
      if (!item.id) return reject();
      if (item.type === 'remove') {
        actions.push({ type: item.type, id: item.id });
        continue;
      }
      if (item.type === 'finish') {
        if (!item.finish) return reject();
        actions.push({ type: item.type, id: item.id, finish: item.finish });
        continue;
      }
      if (item.quarterTurns === null) return reject();
      if (item.type === 'rotate') {
        actions.push({
          type: item.type,
          id: item.id,
          quarterTurns: item.quarterTurns,
        });
        continue;
      }
      if (item.centerX === null || item.centerZ === null) return reject();
      const pose = {
        centerX: item.centerX,
        centerZ: item.centerZ,
        quarterTurns: item.quarterTurns,
      };
      if (item.type === 'move') {
        actions.push({ type: item.type, id: item.id, pose });
        continue;
      }
      const choice = (
        item.type === 'add' ? task.goal?.additions : task.goal?.replacements
      )?.find((c) => c.id === item.id && c.catalogueId === item.catalogueId);
      if (!choice || (item.finish !== null && item.finish !== choice.finish))
        return reject();
      const furniture = proposedSearchPiece(choice);
      if (!furniture) return reject();
      actions.push({
        type: item.type,
        furniture: {
          ...furniture,
          pose: { ...pose, provenance: furniture.pose.provenance },
        },
        ...(item.type === 'replace' ? { id: item.id } : {}),
      } as ProposalAction);
    }
    return prepare(actions);
  }
  return {
    execute,
    prepare,
    reply: () => assistantReplySchema.parse(reply),
    hasResult: () => decisions > 0,
  };
}
