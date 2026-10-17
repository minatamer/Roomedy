# Roomedy frontend

From the root: `pnpm install --frozen-lockfile`, `pnpm build:shared`, then start the backend and `pnpm dev:frontend`. The dedicated address is `http://127.0.0.1:4320`; check actual listener ownership first. Development uses `.next-dev`, production build/start uses `.next`. Hot reload handles ordinary UI changes; do not rebuild the stack for copy/spacing edits.

Optional ignored `apps/frontend/.env.local` configures the server-only `ROOMEDY_BACKEND_ORIGIN`; see [.env.example](.env.example). Never prefix private service configuration with `NEXT_PUBLIC_`. Next loads its own app-local environment. The fixed server bridge forwards only GET health/ready/config to corresponding `/v1/` paths, follows no redirects, bounds time/bytes/fragments and strictly validates responses before projecting them publicly. No generic proxy or metered route exists in this foundation.

`pnpm --filter @roomedy/frontend build` and `pnpm --filter @roomedy/frontend start` provide a production-like local build. Next telemetry is disabled in verification and CI. The initial page is a labelled simulated foundation shell; landing/editor flows belong to later tickets. Three/Fiber/Drei versions are pinned now but no 3D code loads on this page. Initial photo review must remain rough 2D only when implemented.

No API keys, live provider types or backend app imports belong in client code. Shared domain imports use explicit `@roomedy/contracts/*` and `@roomedy/spatial` exports. The architecture checker follows transitive imports from `use client` entries; Next's `server-only` marker also protects the actual bridge.
