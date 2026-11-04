# RM-108 — overlap independent market searches safely

4 November 2026. Complete locally. Owner requests practical sourcing performance improvements, including parallelism without API trouble. [Allocation](../commit-plans/RM-108.md), [research](../engineering/market-research-performance.md), [receipt](../validation/RM-108.md).

- [x] Whole-room Find options starts at most two independent item searches, replacing a finished lane until every supported furniture/floor/wall target is processed. Show actual completed/active progress and retain card order when replies arrive out of order.
- [x] Keep one session foreground owner with unique child wire identities, exact input-bound admission/grants/proofs and a single FIFO verification prompt. Completing one child must not cancel its sibling. Single-target research retains its existing authority.
- [x] Busy/unavailable/rate-limit signals pause unscheduled items, preserve in-flight results and offer explicit Resume. No automatic retry, raised server capacity, budget/quality cut or claim that local concurrency proves account-wide quota safety.
- [x] Cancellation, scope/room/phase/reset/expiry/disposal/supersession retire both children, queued proofs and late results without touching accepted source/price/quantity/history facts. Preserve all prior pending paths and exact Git history unstaged/uncommitted.
- [x] Meaningful injected transport/verification/lifecycle regressions, native isolated offline queue/proof/card/pause checks, settled code/types/boundaries/assets/unit/both-build gates and read-only validate→confirm/fix→revalidate to no actionable findings. No paid call, real CAPTCHA, owner-session manipulation, model/env/dependency/cloud/push/deploy or manual restart.
