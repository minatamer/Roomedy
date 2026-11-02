# RM-092 — sun and crescent icons

2 November 2026 · owner screenshot correction · clean base `2d209ac`.

Replace the 3D Day/Night words with matching outline sun and crescent-moon icons. Retain native button names Day/Night through aria-label and hover titles; hide decorative SVGs from assistive technology. Preserve current pressed-state colours, animated thumb, pill sizing,44px targets, focus behavior, callbacks and all lighting/onboarding state. Floor/Ceiling remains textual.

Use local inline SVG with the existing stroke language; no assets, dependencies or new icon framework. Verify actual Day/Night and keyboard behavior at desktop and320px, scoped formatting/lint and frontend build. No new cosmetic mirror tests or repeated unchanged business/backend/full-suite gate; RM-091's1798-test evidence stays dated. Read-only review must have no actionable findings before the existing authorized exact local checkpoint.

[Allocation](../commit-plans/RM-092.md), [receipt](../validation/RM-092.md). Preserve paid-ready services/env; no Send/provider test, restart, dependency, delegation, Chrome, image/cloud/push/deployment. Owner aesthetic acceptance remains separate.
