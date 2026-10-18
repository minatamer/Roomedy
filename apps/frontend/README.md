# Roomedy frontend

From the root: `pnpm install --frozen-lockfile`, `pnpm build:shared`, then start the backend and `pnpm dev:frontend`. The dedicated address is `http://127.0.0.1:4320`; check actual listener ownership first. Development uses `.next-dev`, production build/start uses `.next`. Hot reload handles ordinary UI changes; do not rebuild the stack for copy/spacing edits.

Optional ignored `apps/frontend/.env.local` configures the server-only `ROOMEDY_BACKEND_ORIGIN`; see [.env.example](.env.example). Never prefix private service configuration with `NEXT_PUBLIC_`. Next loads its own app-local environment. The fixed server bridge forwards only GET health/ready/config to corresponding `/v1/` paths, follows no redirects, bounds time/bytes/fragments and strictly validates responses before projecting them publicly. No generic proxy or metered route exists in this foundation.

`pnpm --filter @roomedy/frontend build` and `pnpm --filter @roomedy/frontend start` provide a production-like local build. Next telemetry is disabled in verification and CI. RM-004 provides the earthy landing and a labelled, finite scripted SVG room example. `/demo` progressively chooses sample/own room and its condition through an allow-listed typed route handoff. RM-005 now opens the canonical precision SVG editor for samples, with shared commands, provenance, catalogue, whole-change Undo and bounded lifecycle fences; RM-007 supplies own-room transient photo selection and manual rough 2D review with an explicit handoff into that same controller/editor. RM-006 lazily loads the main-editor Three/Fiber/Drei cutaway when requested. Initial photo review remains rough 2D only. System fonts and authored SVG/CSS artwork require no remote asset dependency.

No API keys, live provider types or backend app imports belong in client code. Shared domain imports use explicit `@roomedy/contracts/*` and `@roomedy/spatial` exports. The architecture checker follows transitive imports from `use client` entries; Next's `server-only` marker also protects the actual bridge.

## RM-006 cutaway

The main editor starts in 2D; requesting 3D lazily loads its scene. Camera and selection remain presentation only. Shared snapshots, physical-size/rotation mapping, asset/failure ownership and measured limits are documented in [room-view design](../../docs/design/room-view.md) and [RM-006 evidence](../../docs/validation/RM-006.md). No 3D intake preview, direct 3D dragging or provider request is introduced.

## RM-007 intake and review

The own-room route starts with optional local JPEG/PNG/WebP selection and a useful manual alternative. Initial review has no 3D canvas or switch. It preserves per-value uncertainty, app-owned identities, photo evidence, explicit duplicate reconciliation, complete feature corrections and independent locks. Explicit acceptance creates one baseline in the existing session and releases local photos; the main editor opens in 2D. See [media and authority policy](../../docs/engineering/image-intake.md) and [actual evidence](../../docs/validation/RM-007.md). Photo recognition is unavailable until RM-010; no selection or review action dispatches a provider. Semantic recovery/export remain RM-012.
