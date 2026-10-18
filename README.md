# Roomedy

Roomedy turns a reviewed rough 2D room sketch into an editable room with precision 2D and stylized 3D views. Start with a sample or room photos, review measurements, then arrange supported furniture manually or through reviewable assistant proposals. Furniture prices and budget planning are deferred.

**Stage:** the room editor, photo-to-rough-2D review, grounded assistant and semantic project/recovery flows are implemented locally. RM-001–RM-013 are committed; RM-014 prepares local packaging and release evidence. The guide goal remains active. Fake/paid-off only; actual owner visual/security decisions, Linux/hosted proof and funded real-provider evaluation remain distinct pending gates. No paid call, push or deployment has occurred.

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

Selected domain: **tryroomedy.com**. Registration, provider spend and deployment require separate authorization. Actual visual and security review gates remain with the owner.

Local release preparation: `pnpm release:inventory --out <file>` records exact source inputs; `pnpm release:build` is a dry run. Explicit local Linux image/probe execution uses `pnpm release:build --execute` only with a working Docker Linux engine. The installed CLI currently has no active Linux engine; a Windows build/inventory is not passing Linux proof. No helper pushes or deploys. See [operations](docs/operations/README.md), [strict proof policy](docs/operations/release-inputs.md), [stale-client behavior](docs/operations/stale-client.md) and [guarded rollout/rollback](docs/operations/rollout-and-rollback.md).
