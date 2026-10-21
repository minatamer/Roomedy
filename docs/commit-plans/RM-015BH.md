# RM-015BH allocation — 21 October 2026

Clean initial worktree. Latest owner requests environment preparation plus complete themed Turnstile; app startup and all live/paid calls are explicitly held. Read-only Retailor/Retrosum examples and verification owners inform the pattern; never copy their secrets. No delegation/dependency/service/port/Git/publication change.

Allocated before implementation:

- `apps/backend/.env.example`
- `apps/frontend/.env.example`
- `apps/backend/README.md`
- `apps/frontend/README.md`
- `apps/backend/src/config/runtime-config.ts`
- `apps/backend/src/server.ts`
- `apps/backend/src/providers/model.ts`
- `apps/backend/src/providers/responses.ts`
- `apps/backend/src/security/turnstile.ts`
- `apps/backend/src/runtime/operations.ts`
- `apps/backend/src/runtime/create-runtime.ts`
- `packages/contracts/src/api.ts`
- `packages/contracts/src/operations.ts`
- `apps/frontend/src/app/layout.tsx`
- `apps/frontend/src/features/session/admission-client.ts`
- `apps/frontend/src/features/verification/state.ts`
- `apps/frontend/src/features/verification/turnstile.ts`
- `apps/frontend/src/features/verification/verification.tsx`
- `apps/frontend/src/features/verification/verification.module.css`
- `apps/frontend/src/features/assistant/client.ts`
- `apps/frontend/src/features/room-intake/recognition-client.ts`
- `scripts/evaluation/options.ts`
- `scripts/evaluate-roomedy.mjs`
- `scripts/run-tests.mjs`
- `scripts/isolated-mode.ts`
- `scripts/release/probe.mjs`
- `test/turnstile.test.ts`
- `test/verification.test.ts`
- `test/runtime.test.ts`
- `test/provider.test.ts`
- `test/admission.test.ts`
- `test/recognition.test.ts`
- `test/evaluation.test.ts`
- `docs/tickets/RM-015BH-prepare-live-mode-and-turnstile.md`
- `docs/commit-plans/RM-015BH.md`
- `docs/validation/RM-015BH.md`
- `docs/engineering/provider-safety.md`
- `docs/evaluation/README.md`
- `docs/README.md`
- `docs/tickets/README.md`
- `docs/ROOMEDY.md`
- `AGENTS.md`

Ignored operator artifacts: `apps/backend/.env.local`, `apps/frontend/.env.local`. Inspect only key presence/matching identity; do not print values or stage these files. Keep fake/paid-off until the owner changes the switches. Release digests remain owned by release tooling, absent from local examples. The existing server-only bridge secret is retained and documented as already prepared.

Implementation: reuse existing admission response for a server-issued SHA-256 challenge binding, then one browser proof and one fresh admission request. A shared frontend owner serves photo and Medy flows. Cloudflare validation uses finite bytes/fragments/deadline and no IP forwarding/retry. The existing operation grants/capacity/commands remain unchanged. Verification is lazy and transient with finite callbacks, cleanup and theme-aware dialog. No app builds/startup that load local env; verification uses isolated tests, offline types/lint/architecture and static rendering where available. Record actual vendor and browser layout limits candidly.

## Owner model follow-up —21 October

Before follow-up source edits, extend the allocation by the four paths above: shared backend model constant, Responses default, actual evaluation entry and provider regression. Retailor actually pins `gpt-6-luna` in both `apps/backend/src/catalogue/provider.ts:11` and `apps/backend/src/providers/assistant.ts:23`. Owner selects the same hardcoded model. Remove `OPENAI_MODEL` from both ignored local files and the backend example, preserve their current values and comment-free layout, and require only the key for provider configuration. Actual startup and evaluation use the one pinned default; the existing evaluation policy must name that model without an env model field. Synthetic adapter model injection remains available for isolated protocol tests. Update current setup instructions/progress to three operator fields; earlier four-field receipts remain dated history. App startup/live/paid hold and all other gates remain. Total allocation now42 paths.

## Authorized fake app and widget review —21 October

Latest owner explicitly authorizes starting the current fake-mode app and checking Turnstile setup/design, with quiet background verification and visible interaction only when needed, like Retailor. Preserve actual normal env loading; no env changes or paid AI. Owned4320/4321 are started with the run workflow and readiness confirms fake mode. The previous no-start hold is superseded only for this local fake review. Retailor uses `interaction-only` and opens its modal on `before-interactive-callback`; Roomedy already uses that policy with disabled retry/refresh.

Temporary review harness allocated before creation: `apps/frontend/src/app/verification-review/page.tsx`. It mounts the actual global verification owner through Cloudflare's documented public success/failure/forced-interaction test sitekeys, never calls backend admission or AI, and is removed before handoff. This is local testing only, not a permanent visitor control, fake-mode bypass or a second service/port. Owned runtime records/logs and screenshots live in ignored `.release/`. Existing verification component/CSS/tests remain allocated if actual inspection exposes a defect. Record native fake flow, vendor/interactive limitations and any scoped repair honestly.
