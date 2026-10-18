import type {
  ProviderOutcome,
  ProviderRequest,
} from '../providers/provider.js';
/** Stateless authored tool turns, not natural-language model quality. */
export async function assistantFakeResponse(
  request: ProviderRequest,
  signal: AbortSignal,
): Promise<ProviderOutcome> {
  if (signal.aborted) return { kind: 'cancelled' };
  if (request.input.at(-1)?.type === 'function_call_output')
    return { kind: 'completed', data: { kind: 'done' }, calls: [] };
  const content = request.input.at(-1)?.content;
  if (!Array.isArray(content) || typeof content[0]?.text !== 'string')
    return { kind: 'malformed' };
  let context;
  try {
    context = JSON.parse(content[0].text) as {
      task: { kind: string };
      request: string;
    };
  } catch {
    return { kind: 'malformed' };
  }
  const name =
    context.task.kind === 'search'
      ? 'find_arrangements'
      : context.task.kind === 'catalogue'
        ? 'find_furniture'
        : context.task.kind === 'undo'
          ? 'request_undo'
          : 'explain_checks';
  const category =
    ['bed', 'desk', 'chair', 'wardrobe', 'storage'].find((c) =>
      new RegExp('\\b' + c + '\\b').test(context.request.toLowerCase()),
    ) ?? null;
  return {
    kind: 'completed',
    data: null,
    calls: [
      {
        name,
        callId: 'fixture_assist_1',
        arguments:
          name === 'find_furniture'
            ? { category, maxWidth: null, maxDepth: null }
            : name === 'explain_checks'
              ? { issueId: null }
              : {},
      },
    ],
  };
}
