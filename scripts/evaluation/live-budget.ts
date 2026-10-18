import { POLICY } from '@roomedy/contracts/policy';
import { responseBody } from '../../apps/backend/src/providers/responses.js';
import type {
  ProviderPort,
  ProviderRequest,
  ProviderOutcome,
  ProviderUsage,
} from '../../apps/backend/src/providers/provider.js';
import type { LivePolicy } from './options.js';

/** Whole-run reservation, including failed/unknown attempts. Never refunds or retries. */
export class EvaluationBudget {
  readonly signal: AbortSignal;
  readonly usage: ProviderUsage[] = [];
  dispatches = 0;
  reservedTokens = 0;
  missingUsage = 0;
  private readonly controller = new AbortController();
  private readonly timer: ReturnType<typeof setTimeout>;
  private readonly started: number;
  private active = false;
  private unsettled = false;
  constructor(
    private readonly provider: ProviderPort,
    private readonly policy: LivePolicy,
    private readonly now = Date.now,
  ) {
    this.started = now();
    this.signal = this.controller.signal;
    this.timer = setTimeout(() => this.controller.abort(), policy.maxMs);
  }
  async call(request: ProviderRequest): Promise<ProviderOutcome> {
    if (
      this.active ||
      this.unsettled ||
      this.signal.aborted ||
      this.now() - this.started >= this.policy.maxMs
    )
      return { kind: 'timeout' };
    // Text UTF-8 bytes conservatively over-reserve ordinary tokenizer input. Image units are
    // a separately reviewed MODEL-SPECIFIC upper bound; base64 bytes are not image tokens.
    let imageCount = 0;
    const body = responseBody(request, this.policy.model);
    const text = JSON.stringify(
      JSON.parse(body) as unknown,
      (key, value: unknown) => {
        if (key === 'image_url' && typeof value === 'string') {
          imageCount++;
          return '';
        }
        return value;
      },
    );
    const reserve =
      Buffer.byteLength(text) +
      imageCount * this.policy.imageTokenUpperBound +
      POLICY.providerOutputTokens;
    if (
      this.dispatches >= this.policy.maxDispatches ||
      this.reservedTokens + reserve > this.policy.maxReservedTokens
    )
      return { kind: 'unavailable' };
    this.dispatches++;
    this.reservedTokens += reserve;
    this.active = true;
    let onAbort = () => undefined as void;
    try {
      const call = this.provider.start(request, this.signal);
      this.unsettled = true;
      void call.settled.then(
        () => {
          this.unsettled = false;
        },
        () => {
          this.unsettled = false;
        },
      );
      const timed = new Promise<ProviderOutcome>((resolve) => {
        onAbort = () => resolve({ kind: 'timeout' });
        this.signal.addEventListener('abort', onAbort, { once: true });
        if (this.signal.aborted) onAbort();
      });
      const result = await Promise.race([
        Promise.all([call.result, call.settled]).then(([outcome]) => outcome),
        timed,
      ]);
      if (result.usage) {
        this.usage.push(result.usage);
        if (
          result.usage.totalTokens > reserve ||
          result.usage.outputTokens > POLICY.providerOutputTokens
        )
          this.controller.abort();
      } else this.missingUsage++;
      return result;
    } catch {
      this.missingUsage++;
      return { kind: 'unavailable' };
    } finally {
      this.active = false;
      this.signal.removeEventListener('abort', onAbort);
    }
  }
  close() {
    clearTimeout(this.timer);
    this.controller.abort();
  }
}
