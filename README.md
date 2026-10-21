# Roomedy

Roomedy turns room photos into an editable studio with precision2D and stylized3D views. Choose photos, continue through processing, then correct measurements and arrange supported furniture in the studio manually or through reviewable assistant proposals. Manual room setup is also available. Furniture prices and budget planning are deferred.

**Deployed:** [Try Roomedy](https://roomedy-frontend-860563209111.europe-west1.run.app). The manual studio, 2D/3D editing and Undo are verified on Cloud Run, with Medy initially open and public samples available. Paid recognition and provider-backed Medy stay disabled pending challenge/funding setup. [Hosted acceptance](docs/operations/HOSTED_ACCEPTANCE.md) records the exact public frontend/private backend, checks and remaining conditions. Quality/security work and selected remediation are complete locally; the current1,043-test gate and exact Linux/90-asset proof match the deployed build. Bounded prior local live-photo/Medy evidence remains separate from hosted paid activation and general accuracy claims.

Use Node **24.19.0** and pnpm **11.25.0**. From the root:

```powershell
pnpm install --frozen-lockfile
pnpm build:shared
pnpm dev:backend
# In a second terminal:
pnpm dev:frontend
```

Verify ports **4321** (backend) and **4320** (frontend) are free or belong to this checkout before starting. Optional configuration uses app-local ignored `.env.local` files with blank-secret examples. Existing process environment takes precedence. Defaults are fake/paid-off; deliberate drafting/assistant requests use visibly authored fake output. Live operation remains unavailable without its separately reviewed model/privacy/funding/visitor-verification prerequisites. Never use another repo's secrets or stop its services.

After `pnpm build`, `pnpm test:smoke` briefly verifies both owned local apps and their fixed bridge, then cleans up. It refuses occupied ports and forces fake/paid-off independently of manual configuration.

Use `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:boundaries`, `pnpm test:unit`, `pnpm build`, or `pnpm check` for the settled full no-key gate. Tests force fake/paid-off before imports and deny external network. Development hot reload uses separate `.next-dev` output; production uses `.next`.

- [Backend setup](apps/backend/README.md) and [frontend setup](apps/frontend/README.md)
- [Detailed blueprint](docs/ROOMEDY.md) and [documentation map](docs/README.md)
- [Ordered ticket queue](docs/tickets/README.md)
- [Product concept overview](docs/ROOMEDY_OVERVIEW.html) â€” scripted illustration, separate from the app
- [RM-001 allocation](docs/commit-plans/RM-001.md) and [validation evidence](docs/validation/RM-001.md)

Selected domain: **tryroomedy.com**, not yet registered/configured. The owner has requested deployment to the existing `roomedy` cloud project after the recommended audit-first path. No domain purchase/DNS change or new paid evaluation is implied. Current security findings still follow the build review process.

Local release preparation: `pnpm release:inventory --out <file>` records exact source inputs; `pnpm release:build` is a dry run. Explicit local Linux image/probe execution uses `pnpm release:build --execute`. Docker's Linux engine is now available; current candidate images/probes must still actually pass before deployment. A Windows build/inventory is not Linux proof. Snapshot Docker commands and installer work are bounded, with cleanup owned by the verified temporary container. No release helper pushes or deploys. See [operations](docs/operations/README.md), [strict proof policy](docs/operations/release-inputs.md), [stale-client behavior](docs/operations/stale-client.md) and [guarded rollout/rollback](docs/operations/rollout-and-rollback.md).
