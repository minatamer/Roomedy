export interface EvaluationOptions {
  mode: 'offline' | 'live';
  dryRun: boolean;
  executeLive: boolean;
  cases: string[];
  maxCases: number;
  policy: string | null;
}
export function parseOptions(args: readonly string[]): EvaluationOptions {
  const o: EvaluationOptions = {
    mode: 'offline',
    dryRun: false,
    executeLive: false,
    cases: [],
    maxCases: 24,
    policy: null,
  };
  const seen = new Set<string>();
  for (let i = 0; i < args.length; i++) {
    const flag = args[i]!;
    if (seen.has(flag)) throw new Error('evaluation-options');
    seen.add(flag);
    if (flag === '--dry-run') o.dryRun = true;
    else if (flag === '--execute-live') o.executeLive = true;
    else {
      const v = args[++i];
      if (!v || v.startsWith('--')) throw new Error('evaluation-options');
      if (flag === '--mode' && ['offline', 'live'].includes(v))
        o.mode = v as EvaluationOptions['mode'];
      else if (flag === '--cases' && /^[a-z0-9,-]{1,1500}$/.test(v))
        o.cases = v.split(',');
      else if (
        flag === '--max-cases' &&
        /^\d{1,2}$/.test(v) &&
        Number(v) >= 1 &&
        Number(v) <= 24
      )
        o.maxCases = Number(v);
      else if (flag === '--policy' && v.length <= 500) o.policy = v;
      else throw new Error('evaluation-options');
    }
  }
  if (
    new Set(o.cases).size !== o.cases.length ||
    (o.mode === 'offline' && (o.executeLive || o.policy))
  )
    throw new Error('evaluation-options');
  return o;
}
export interface LivePolicy {
  model: string;
  cases: string[];
  maxCases: number;
  maxDispatches: number;
  maxReservedTokens: number;
  maxMs: number;
  imageTokenUpperBound: number;
  approval: string;
  funding: string;
  fundedAllowanceUsd: number;
  privacy: string;
  dataRights: string;
  compatibility: string;
}
const safeRef = (v: unknown): v is string =>
  typeof v === 'string' && /^[A-Za-z0-9._:-]{1,120}$/.test(v);
export function parseLivePolicy(raw: unknown): LivePolicy {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw))
    throw new Error('evaluation-policy');
  const v = raw as Record<string, unknown>;
  const fields = [
    'model',
    'cases',
    'maxCases',
    'maxDispatches',
    'maxReservedTokens',
    'maxMs',
    'imageTokenUpperBound',
    'approval',
    'funding',
    'fundedAllowanceUsd',
    'privacy',
    'dataRights',
    'compatibility',
  ];
  if (
    Object.keys(v).length !== fields.length ||
    !Object.keys(v).every((k) => fields.includes(k)) ||
    ![
      'model',
      'approval',
      'funding',
      'privacy',
      'dataRights',
      'compatibility',
    ].every((k) => safeRef(v[k])) ||
    !Array.isArray(v.cases) ||
    v.cases.length < 1 ||
    v.cases.length > 24 ||
    !v.cases.every(safeRef) ||
    new Set(v.cases).size !== v.cases.length
  )
    throw new Error('evaluation-policy');
  if (
    typeof v.fundedAllowanceUsd !== 'number' ||
    !Number.isFinite(v.fundedAllowanceUsd) ||
    v.fundedAllowanceUsd <= 0 ||
    v.fundedAllowanceUsd > 100
  )
    throw new Error('evaluation-policy');
  for (const [k, max] of [
    ['maxCases', 24],
    ['maxDispatches', 96],
    ['maxReservedTokens', 2_000_000],
    ['maxMs', 600_000],
    ['imageTokenUpperBound', 200_000],
  ] as const)
    if (!Number.isSafeInteger(v[k]) || Number(v[k]) < 1 || Number(v[k]) > max)
      throw new Error('evaluation-policy');
  return v as unknown as LivePolicy;
}
export function selectCases(
  options: EvaluationOptions,
  available: readonly string[],
  policy?: LivePolicy,
) {
  const selected = options.cases.length
    ? options.cases
    : options.mode === 'offline'
      ? [...available]
      : [];
  if (
    !selected.length ||
    selected.length > options.maxCases ||
    selected.some((id) => !available.includes(id))
  )
    throw new Error('evaluation-case-scope');
  if (
    options.mode === 'live' &&
    (!policy ||
      !options.cases.length ||
      selected.length > policy.maxCases ||
      selected.length !== policy.cases.length ||
      selected.some((id) => !policy.cases.includes(id)))
  )
    throw new Error('evaluation-case-scope');
  return selected;
}
export function livePrerequisites(
  options: EvaluationOptions,
  policy: LivePolicy,
  env: Readonly<Record<string, string | undefined>>,
) {
  const missing: string[] = [];
  if (!options.executeLive) missing.push('execute-live');
  if (env.PAID_DEMO_ENABLED !== 'true' || env.FAKE_MODE !== 'false')
    missing.push('paid-live-mode');
  if (
    !env.OPENAI_API_KEY ||
    env.OPENAI_API_KEY.length > 4096 ||
    /[\r\n]/.test(env.OPENAI_API_KEY)
  )
    missing.push('provider-key');
  if (env.OPENAI_MODEL !== policy.model) missing.push('model-match');
  if (env.LIVE_POLICY_REVIEWED !== 'true') missing.push('privacy-review');
  return missing;
}
