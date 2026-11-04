# Market research performance — RM-108

4 November 2026. Source inspection and content-safe local timing records show serial per-target dispatch, with recent individual requests18–83s. The expensive provider/search path dominates; measured local preparation was generally under3s. These observations are not a controlled benchmark or a merchant comparison.

Independent item searches can overlap, as described in OpenAI's [latency guide](https://developers.openai.com/api/docs/guides/latency-optimization). Select two lanes, within Roomedy's existing shared two-work-slot server capacity. Keep the full supported target list, three-candidate research goal, current model, per-item budgets, source validation and finite deadlines. This can reduce whole-room waiting; it does not shorten each item's provider latency or guarantee a twofold improvement.

OpenAI's [rate-limit guide](https://developers.openai.com/api/docs/guides/rate-limits) distinguishes request/token quotas at project/organization scope and exposes remaining/reset headers and sometimes Retry-After. A local two-request cap cannot prove an account's available quota. Existing backend admission, dispatch rate, exact grants/replay ownership and underlying-settlement retention remain authoritative. Pause new batch launches on busy/unavailable signals; retain already active outcomes and allow explicit visitor resumption. Never automatically retry a paid request.

Keep a single foreground session owner and separate exact child wire identities. Serialize only the proof UI; each challenge/proof remains bound to its child admission. Cancel queued proofs and requests with their parent, fence stale replies, and do not clear siblings when a child finishes. Keep result cards in original start order even when completion order differs.

Do not add shared result caching or merge superficially similar products: selected target/variant/size/locality/source-price bindings differ. Config fetches cost milliseconds and are not this bottleneck. Provider/server changes, speculative extra calls, quota probing, new retries and reduced evidence quality are outside this ticket.
