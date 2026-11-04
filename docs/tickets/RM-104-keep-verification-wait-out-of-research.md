# RM-104 — preserve research while verification waits

Status: complete locally; unstaged/uncommitted · 4 November 2026. [Allocation](../commit-plans/RM-104.md), [receipt](../validation/RM-104.md).

- [x] Remove the independent60s browser verification cutoff; waiting must not consume a research/recognition/Medy request budget.
- [x] Preserve fresh per-request/local-work watchdogs, exact grants, cancellation/lifecycle and backend/provider/hosting/resource bounds, with no automatic paid retry.
- [x] Keep an expired vendor challenge refreshable in place; give a slow quiet check useful wait/retry/cancel controls without failing its product.
- [x] Prove long waits followed by successful bounded research, late-callback retirement, cancellation and abort-ignoring request deadlines using offline fixtures.
- [x] Update policy/evidence and complete connected/native/full checks without touching the owner's session, Git history or deployment.
