# Roomedy private API

From the repository root, install with `pnpm install --frozen-lockfile`, then `pnpm build:shared` and `pnpm dev:backend`. Production-like local commands: `pnpm --filter @roomedy/backend build` then `pnpm --filter @roomedy/backend start`. Default address: `127.0.0.1:4321`; verify port ownership before starting. Stop only this checkout's tracked process, never another service by port/name alone.

Optional configuration belongs in ignored `apps/backend/.env.local`, based on [.env.example](.env.example). Only `src/server.ts` loads that file and listens; process environment takes precedence. Watch mode re-runs this explicit entry after backend edits. Shared source edits require `pnpm build:shared`; do not rebuild/restart unrelated services for frontend spacing changes.

Fresh configuration is fake/paid-off. `GET /v1/health` proves liveness, `/v1/ready` reports AI availability separately, and `/v1/config` exposes only public capabilities/limits. In RM-001 all expensive POST operations return safe 503 responses with zero dispatches, including explicit live mode with keys. Admission and owning feature integrations must land before enabling them. Live prerequisites never trigger a fake fallback. No provider client/SDK is installed.

`parseRuntimeConfig`, `createRuntime` and `createApp` are inert imports with injected IDs/clock/provider/diagnostics. The executable alone accesses process configuration. No root/sibling environment is read. Safe errors use fixed visitor copy; operator logs contain fixed codes and opaque references only. Diagnostics never include arbitrary errors, room/photo/chat data or configuration values.

Automated checks do not connect to this service. `pnpm test:unit` starts an isolated child with fake/paid-off settings before imports; setup denies fetch and non-loopback sockets. Supertest may use ephemeral loopback listeners. Inherited live flags/keys cannot enable spending. Tests supply synthetic values explicitly to verify unavailable live readiness.
