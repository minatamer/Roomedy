# RM-001 — Initialize the workspace, contracts and safe runtime

Status: **Implemented locally — external evidence pending**  
Planning date: **17 October 2026**  
Milestone: **Foundation**  
Depends on: None  
Suggested commit: `RM-001: initialize workspace contracts and safe runtime`  
Authority: [blueprint §§8, 14–18, 21–22](../ROOMEDY.md#14-architecture-and-dependency-boundaries)  
Queue and execution rules: [ticket index](README.md)  
Build guidelines: [owner feedback lessons](../references/LESSONS_FROM_VISUAL_FEEDBACK.md) (L-16, L-18–L-21, L-24) and [review checklist](../design/REVIEW_CHECKLIST.md)

## Outcome and standalone context

Create a runnable strict TypeScript pnpm workspace with a public Next/React frontend, private Express API, browser-safe contracts and a pure spatial package. Establish the real build, dependency, configuration and test boundaries before the editor or AI features arrive. A set of empty folders is insufficient.

Roomedy converts photos into a correctable rough 2D sketch, then one accepted semantic room used by the main editor's plan and cutaway. Contracts must describe that room without importing React, Three, provider SDKs or platform effects. The first release is one rectangular bedroom/workspace; prices, visitor budgets and shopping are excluded. Exact compatible dependency versions and finite engineering limits are selected here with official documentation and later measurement, rather than copied from sibling manifests.

## Dependency evidence and proposed ownership

Read the approved plan and current repository state before execution. Allocate exact files before substantial edits; follow the index's validation and authorization rules.

| Area | Responsibility |
| --- | --- |
| Root manifests, lockfile, TypeScript/lint/format configuration | Pinned compatible toolchain, shared scripts and reproducibility |
| `packages/contracts/src/{room,catalogue,commands,api,policy}` | Public strict schemas and bounded cross-boundary vocabulary |
| `packages/spatial/src` | Pure package/public exports and interfaces; full algorithms belong to RM-003 |
| `apps/backend/src/{server.ts,config,runtime,http,providers}` | Inert app factory, explicit startup, injected fake ports and content-free readiness |
| `apps/frontend/src/{app,server}` | Thin real entry points and fixed same-origin bridge foundation |
| `scripts/check-boundaries.*`, `test/`, CI, `AGENTS.md` and READMEs | Executable architecture, pre-import isolation, operating instructions and meaningful no-key gates |

## Implementation plan

1. Verify supported Node/pnpm/Next/React/Three/R3F/Drei/TypeScript/Zod/Express compatibility against primary documentation. Pin a compatible set and one lockfile; record selected support policy. Do not install a renderer service, database, ORM or general queue.
2. Create minimal running applications and shared builds. Use explicit public package exports. Enforce applications never importing one another, contracts importing no apps/platform/provider/UI concerns, and spatial importing only pure contracts/logic. Catch client imports of server-only modules with an executable rule.
3. Define strict schemas for rectangle dimensions, per-value provenance, wall features/mechanisms, stable furniture IDs/catalogue versions, center pose, quarter-turns, ownership/preferences, independent locks, room revision, issue facts, command/proposal/receipt and baseline/project projections. Coordinates use integer millimetres, X/Z floor and Y up. Unknowns are explicit; schemas reject non-finite/unsafe values and unknown fields.
4. Define workspace identity/generation/operation/revision envelopes and trusted-origin assignment. Provider/browser/imported data cannot self-authorize confirmations, unlocks or server admission. Keep pending operations distinct from accepted semantic data.
5. Establish one finite policy module for counts, bytes, deadlines, history and search. Start from [§18 candidates](../ROOMEDY.md#181-bounds-are-part-of-the-feature), identify enforcement owners and mark provisional values for RM-007/RM-008/RM-015 measurement. Fixed two-hour guest expiry is selected scope. Bound prepared image requests separately from raw uploads and semantic JSON.
6. Build an import-safe Express app factory and explicit startup composition. Only startup loads its app-local ignored environment and listens; process environment takes precedence. No import constructs a paid client, reads secrets or starts work. Proposed dedicated ports are 4320/4321, subject to verified ownership before starting.
7. Add fixed health/ready/config operations and a fixed-path Next server bridge. Public config contains mode/capabilities/enforced limits only. Missing live prerequisites fail closed; no automatic fake fallback. Foundation fake fixtures are visibly labelled and provider calls remain zero.
8. Install test isolation before application imports: fake mode, paid disabled, injected clocks/IDs/providers and denied external network. Inherited credentials/live flags cannot override it. Use dispatch counters, not absence of visible errors, to prove zero calls.
9. Provide real format/lint/typecheck/boundary/unit/build/check commands, blank-secret examples, ignore rules, startup documentation, repository operating instructions in `AGENTS.md` and no-key CI. Establish source-controlled safe user errors and private structured diagnostics. Later transport/admission enforcement belongs to RM-008; live routes remain unavailable until that dependency is integrated.

## Prevention requirements from prior feedback

Extend the existing documentation-only AGENTS.md with actual commands when the foundation exists; retain these owner lessons. Provide a normal hot-reload workflow and separate development/production output where needed. Runtime capability/mode comes from current composition, never a saved room. Keep deterministic gate tests on controlled fixtures and strict release freshness as a separate actual-candidate check.

## Acceptance criteria

- [x] Frozen-lockfile installation and both minimal apps' documented local builds work on the selected supported runtime.
- [x] Shared contracts build in browser and backend consumers; spatial remains pure and browser-safe.
- [x] Executable boundary checks reject illegal cross-app, platform, provider and client/server imports.
- [x] Canonical room/provenance/command/project schemas and finite policy are documented with exact selected or provisional values.
- [x] Health, readiness and config distinguish process health from unavailable AI and expose no private configuration.
- [x] Importing factories/contracts has no environment, listener, storage or provider side effects.
- [x] Fake/paid-off tests withstand inherited live flags and record zero metered dispatches.
- [ ] Established root commands and CI run meaningful no-key checks; no app spending or deployment is enabled implicitly. **Local commands and workflow definition pass; actual hosted CI execution remains unverified without an authorized push.**
- [x] Documented hot reload and scoped backend startup preserve configured manual runtime mode while automated tests independently remain fake/paid-off.
- [x] Existing owner guidelines survive foundation setup; deterministic checks do not depend on the current freshness of historical image evidence.

## Focused verification and evidence

| Case | Required evidence |
| --- | --- |
| Empty environment and explicit live-without-key | Safe startup/readiness behavior; dispatch count zero |
| Negative, fractional, NaN/infinite, unsafe or excessive dimensions/counts | Boundary rejects with stable safe codes |
| Duplicate IDs/invalid catalogue version/unsupported rotation | Contract rejection, not silent coercion |
| Client-to-server/app-to-app/shared-to-platform imports | Deliberately invalid fixtures fail executable boundary checks |
| Factory imported under hostile inherited environment | No file reads/listeners/provider composition or network |
| Public config and compiled frontend | No key, private origin, account identity or raw diagnostic payload |

## Handoff and limits

Record installed versions, selected coordinate/schema policy, actual commands and local results in the execution evidence when performed. RM-002/003 consume these contracts; RM-007/008/015 refine measured policy through the same module. No geometry accuracy, photo interpretation, production capacity or paid/hosted acceptance is established by this foundation. No implementation or Git action is authorized by this planned ticket alone.

Execution: [file allocation](../commit-plans/RM-001.md), [validation and exact evidence](../validation/RM-001.md). Required local outcome passed on 17 October 2026; next dependent work may proceed. No paid/live/hosted/visual acceptance is inferred.
