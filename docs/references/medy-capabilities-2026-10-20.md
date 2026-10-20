# MEDY capability audit —20 October2026

Baseline3be5abd. [AT plan](../commit-plans/RM-015AT.md). Name is MEDY, from RooMEDY, following the human's explicit M-E-D-Y spelling. Audit findings are source evidence, not live-model or owner approval.

## Before revision

Assistant tools cover room read/catalogue/search/scoped move/rotate/add/replace/remove/finish, checks, focus and requests for manual measurement/locks/Undo. Exact dimensions, most feature/room/metadata controls, camera/zoom/views, tour and project flows are absent from chat. Explicit Delete/size actions are more restricted than their current manual counterparts. Generic conversational output is constrained to {kind:done}; app-authored replies cannot currently answer ordinary chat or design questions naturally. Unknown interpretation gives another clarification choice instead of executing a clear normalized manual request. Existing canonical SessionController, strict proposals, bounded optimizer, field provenance and transport are preserved foundations.

## Manual capability inventory and required chat result

| Domain | Existing manual action | MEDY result to implement/verify |
| --- | --- | --- |
| Furniture | Select/inspect/catalogue/Add/Replace/Delete | Exact current target; supported catalogue/preset; actual reviewed command/clear blocker; protected Delete parity |
| Placement | Numeric x/z, relative moves, rotate both ways, direct floor drag | Explicit numeric/relative target and quarter-turn previews; drag gesture represented by the same pose commands; no fabricated footprint |
| Furniture size | Width/depth/height, size presets, measured/unknown fields | Units/presets and exact supplied values, preserved omitted axes, planning estimate by default; confirmation only from an explicit human measurement instruction |
| Furniture details | Finish, ownership, Keep/Flexible/May replace, independent locks | Exact scoped visitor edits; no model-inferred unlock/ownership/permission |
| Room | Width/depth/height, confirm/unknown, condition and intent goals/style | Same bounded visitor controls/facts and one Undo; do not invent confirmed values |
| Surfaces | Walls/floor colour/hex/texture and palettes | Existing supported surfaces and coherent requested palette; preserve layout/owned finish unless explicitly requested |
| Features | Add/remove doors/windows/obstacles, wall/offset/size/sill/projection/mechanism/hinge | Same feature commands, unknowns/provenance and actual validation; exact ambiguous-feature clarification |
| Preview/history | Apply/Cancel/latest Undo | Resolve only the current correlated candidate; actual accepted receipt/whole-change Undo; no Redo |
| Navigation |2D/3D, Explore/Arrange, zoom/fit/pan/orbit/look/walk, viewpoints, Snap | Invoke current real presentation owners without mutating room/history or cancelling a preview |
| Inspection | Furniture/Room/Assistant panels and selected feature/issue | Focus actual canonical data/current controls; no provider cost for focus |
| Guide | Tour/welcome/replay, native Next/Back/Skip/Escape | Chat request starts the existing tour with real target/readiness/cleanup; guide owns its focus-isolated controls |
| Project | Export formats, import chooser, Start a new room | Existing native downloads/chooser/replacement confirmation; visitor supplies local file and confirms replacement |
| Intake | New-room/manual/photo entry after starting over | Existing fresh-room flow; chat does not fabricate a selected user file or silently replace work |
| Design | Furnish/rearrange/work/daylight/clearance/coordinated style | Real bounded optimizer/current room, functional access, orderly neutral defaults and transparent limits |
| Conversation | Greeting/name/help/design explanation/contextual follow-up | Friendly grounded MEDY reply with useful next step, bounded history and no invented action/fit receipt |

No selection of new paid mode, key/account setup, browser-wide operations, hidden Before UI, Redo, multi-room/shopping/unsupported catalogue/decor or Q lighting is implied by manual parity.

## Reference and primary-source evidence

Read-only Retailor apps/frontend/src/features/landing/landing.tsx (Meet Tailor, task role copy and customer/owner chat examples) and Retrosum equivalent (Meet Retro/copilot, actionable explanation/tour/edit requests and workspace CTA/RetroPreview). Adapt the compact introduction/task-preview pattern to Roomedy's existing assistant chapter; sibling styling/configuration/permission is not copied.

Official OpenAI pages opened20October2026: [Function calling](https://developers.openai.com/api/docs/guides/function-calling) and [Prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering). Preserve explicit strict closed schemas/required fields/nullable options, serial tool calls, correlated tool outputs and app execution; source-controlled identity/instructions/examples/current context and representative evals. These docs support the implementation contract, not a claim of tested paid-model behavior. No API key tool is available; no key is needed or requested for offline implementation/injected protocol tests.

Actual per-capability source/test/browser evidence will be filled after implementation, separately from this initial audit.


## Implemented coverage and limits

The audit table’s manual actions now have application compiler/real UI-owner paths. Shared unit/protocol/lifecycle coverage is in `test/medy-commands.test.ts`, `test/medy-controls.test.ts`, `test/medy-parity.test.ts` plus existing assistant/session/integrated journeys. Exact source and actual native rows, including genuine file-selection/replacement boundaries, are recorded in [AT receipt](../validation/RM-015AT.md). Direct-field Add/Replace/independent lock/ownership and uncommon feature combinations have controlled canonical-command coverage; the native matrix exercises representative sizes/rotation/Delete/Undo, room/window/metadata previews, views/camera/tour/project and empty/partial/furnished design stories rather than every possible combination.

Manual parity means the selected release’s real controls and supported catalogue, with the same bounds and failures. It does not promise arbitrary free-form language will execute without clarification, unsupported furniture/decor/colours, hidden Before/Redo/lighting/shopping/multi-room features, a file chosen by the model, bypassed confirmations/locks/final checks, actual physical fit or an optimal aesthetic result. Clear common requests execute locally or preview directly; unfamiliar safe wording may offer a validated visitor-selectable canonical request. Model advice has no tools/actions. A real OpenAI key was not added or used; injected real-protocol tests and authored fake simulation do not establish funded model quality.
