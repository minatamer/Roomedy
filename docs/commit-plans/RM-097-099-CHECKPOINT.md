# RM-097–099 file-level local review checkpoint

3 November2026. Direct owner requests a file commit plan, multiple local commits, staging/commit and review tomorrow (**4 November2026**). Entry `main` is clean at `eb82f2b8c200e1bdf95c1a1c530c3ea21ce5da8c`. The application work is already saved in five separate ticket commits after `98210f440ac0382da64989e3836f75e75e59d928`; preserve that series and its exact source/assets/tests. This checkpoint adds two cohesive documentation commits for the exact file map and review handoff. No application work is replayed or history rewritten.

## Existing committed work

| Order | Local commit | Subject | Changed paths |
| --- | --- | --- | ---: |
|1| `d694f5b5d9c15d8184984adea4b31a39b9446d7e` |RM-097 fix photo adoption and validate the paid-mode journey|25|
|2| `5383a67154b1b482fac427ebe4992ba90bf09a33` |RM-098: verify and arrange photo room layouts|18|
|3| `6e06fd548934857123efb2053d088e00adf964ae` |RM-098: record final paid Luna layout verification|7|
|4| `470c9f434c4f2b0f1794330b22c92a0be40eeca4` |RM-099: remove the standing mirror from sample photos|18|
|5| `eb82f2b8c200e1bdf95c1a1c530c3ea21ce5da8c` |RM-098: record the permanent Luna instruction|7|

The union is **48 paths**; shared progress/ticket files appear in more than one commit. The exact current application candidate includes the v3 public photos.

## Exact file-to-commit map

| Path | Existing commit(s) |
| --- | --- |
| `AGENTS.md` | `d694f5b`, `5383a67`, `6e06fd5`, `470c9f4`, `eb82f2b` |
| `apps/backend/src/providers/responses.ts` | `d694f5b` |
| `apps/backend/src/recognition/recognize.ts` | `d694f5b`, `5383a67` |
| `apps/backend/src/sourcing/sourcing.ts` | `d694f5b` |
| `apps/frontend/public/examples/bedroom-bedding-v2.webp` | `470c9f4` |
| `apps/frontend/public/examples/bedroom-bedding-v3.webp` | `470c9f4` |
| `apps/frontend/public/examples/bedroom-room-one-v2.webp` | `470c9f4` |
| `apps/frontend/public/examples/bedroom-room-one-v3.webp` | `470c9f4` |
| `apps/frontend/public/examples/bedroom-room-two-v2.webp` | `470c9f4` |
| `apps/frontend/public/examples/bedroom-room-two-v3.webp` | `470c9f4` |
| `apps/frontend/public/examples/bedroom-workspace-v2.webp` | `470c9f4` |
| `apps/frontend/public/examples/bedroom-workspace-v3.webp` | `470c9f4` |
| `apps/frontend/src/features/cost/planning.ts` | `d694f5b` |
| `apps/frontend/src/features/cost/research.tsx` | `d694f5b` |
| `apps/frontend/src/features/room-intake/draft.ts` | `d694f5b`, `5383a67` |
| `apps/frontend/src/features/room-intake/example-photos.ts` | `470c9f4` |
| `apps/frontend/src/features/room-intake/photo-layout.ts` | `5383a67` |
| `apps/frontend/src/features/room-intake/photo-pose.ts` | `5383a67` |
| `apps/frontend/src/features/room-intake/review-controller.ts` | `5383a67` |
| `docs/ROOMEDY.md` | `d694f5b`, `5383a67`, `6e06fd5`, `470c9f4`, `eb82f2b` |
| `docs/commit-plans/RM-097.md` | `d694f5b` |
| `docs/commit-plans/RM-098.md` | `5383a67`, `6e06fd5`, `eb82f2b` |
| `docs/commit-plans/RM-099.md` | `470c9f4` |
| `docs/operations/DEPLOYMENT_PREPARATION_HANDOFF.md` | `d694f5b`, `5383a67`, `6e06fd5`, `470c9f4`, `eb82f2b` |
| `docs/references/sample-room-photos-2026-11-02.md` | `470c9f4` |
| `docs/references/sample-room-photos-2026-11-03.md` | `470c9f4` |
| `docs/tickets/README.md` | `d694f5b`, `5383a67`, `6e06fd5`, `470c9f4`, `eb82f2b` |
| `docs/tickets/RM-097-final-paid-mode-revision.md` | `d694f5b` |
| `docs/tickets/RM-098-reconcile-photo-mirrors-and-placement.md` | `5383a67`, `6e06fd5`, `eb82f2b` |
| `docs/tickets/RM-099-remove-standing-mirror-from-samples.md` | `470c9f4` |
| `docs/validation/RM-097.md` | `d694f5b` |
| `docs/validation/RM-098.md` | `5383a67`, `6e06fd5`, `eb82f2b` |
| `docs/validation/RM-099.md` | `470c9f4` |
| `packages/contracts/src/intake.ts` | `d694f5b`, `5383a67` |
| `packages/contracts/src/policy.ts` | `d694f5b` |
| `packages/spatial/src/estimates.ts` | `d694f5b` |
| `packages/spatial/src/medy-language.ts` | `d694f5b` |
| `packages/spatial/src/planning.ts` | `d694f5b` |
| `test/assistant-quick-replies.test.ts` | `d694f5b` |
| `test/cost-planning.test.ts` | `d694f5b` |
| `test/photo-adoption.test.ts` | `d694f5b`, `5383a67` |
| `test/photo-layout.test.ts` | `5383a67` |
| `test/photo-to-studio.test.ts` | `5383a67` |
| `test/photo-verifier.test.ts` | `5383a67` |
| `test/planning.test.ts` | `d694f5b` |
| `test/provider.test.ts` | `d694f5b` |
| `test/recognition.test.ts` | `d694f5b`, `5383a67` |
| `test/sourcing.test.ts` | `d694f5b` |

## Additional staging allocation before edits

Commit06 — `RM-097-099: record the file-level review plan`:

- `docs/commit-plans/RM-097-099-CHECKPOINT.md` — this exact existing-commit map and two-commit allocation.

Commit07 — `RM-097-099: record checkpoint validation and review handoff`:

- `docs/validation/RM-097-099-CHECKPOINT.md` — Git evidence, preserved validation, current candidate and remaining owner review.
- `docs/operations/DEPLOYMENT_PREPARATION_HANDOFF.md` — link the checkpoint and tomorrow's local review.
- `docs/ROOMEDY.md` — guard-helper owner authority/next action/handoff only, preserving all provisional owner gates.

Four newly changed documentation paths; the complete base-to-final path union will be **50** because the handoff/state were already among the48. Stage only each stated group, inspect exact staged paths/whitespace, commit normally with ticket prefixes, then verify parent order, unchanged entry tracked blobs outside these four paths and a clean index/worktree. No amend/rebase/reset/hook bypass, push, deployment, service/env action, new provider request or dependency change.

## Validation retained for review

- [RM-097 receipt](../validation/RM-097.md): paid-mode journey fixes and its dated1923-test/code/assets/both-build proof.
- [RM-098 receipt](../validation/RM-098.md): deterministic layout verifier,174 affected/1988 complete tests/118files and code/assets/both-build proof; final v2 paid scan is separate dated evidence.
- [RM-099 receipt](../validation/RM-099.md): all four active v3 photos remove the standing mirror;49 existing affected checks, scoped code checks/frontend build and native gallery/preparation/public-hash/inventory pass. No paid scan of v3 has been performed.

Reuse these settled checks for unchanged application bytes. This documentation/Git checkpoint needs static path/blob/whitespace/link checks, not another application suite/build. Current source-only inventory is402inputs/4,703,065bytes, digest `06f6aeacc112fc6ce9f5871e52da62b0e5a76ff20dd0769f3e0e7e0c8294f5b2`. Real measurements, owner visual/physical/merchant/actual v3 recognition and exact hosted release acceptance remain separate. Tomorrow's review is a plan, not an acceptance or a scheduled reminder.

Ignored env/runtime/build/cache/screenshots, raw generated originals and operator snapshots remain excluded. The four selected bounded public WebPs are already committed in470c9f4. Preserve current services and the open review tabs.
