# Grounded assistant policy — RM-011

18 October 2026. Local fake/paid-off implementation. [Allocation](../commit-plans/RM-011.md), [actual checks](../validation/RM-011.md), [shared transport](provider-safety.md), [search authority](layout-search.md). No paid call, model-quality claim, stored provider conversation or owner visual approval.

## Authority and data flow

`resolveAssistantTask` is application policy shared by browser and backend. It resolves supported wording/selected controls to a conservative action/target/add/replace/remove scope at a captured room revision. The model cannot choose or enlarge that scope. True ambiguity, negation, conflicting instructions, repeated additions and unsupported wording receive a useful clarification rather than inferred permission. An unlocked object alone is not authorized.

One transient `AssistantController` owns bounded conversation and unsent draft text. The existing `SessionController` owns the canonical room, candidate projection, generation/operation identity, resource cancellation, command envelopes, receipts and whole-change Undo. There is no second scene/history authority. Selection, camera, cards, Apply, Cancel and Undo send no provider request.

An explicit request resolves locally, captures one operation token and cancels the previous candidate/work. Cheap ambiguity/unsupported/visitor-control/Undo guidance stays local. Already-selected finishes need no search/provider call. A layout goal runs the actual browser worker using the existing bounded search; only its action candidate is untrusted input to the backend. The backend independently re-resolves scope and rechecks geometry, goal satisfaction, offered variants and computed facts. It can run the same yielding backend search if no worker candidate is supplied. Direct application-resolved left/right/removal batches need no model round, but still pass shared preparation.

The source-controlled `grounded-room-1` prompt treats visitor text, labels, history and tool results as untrusted data. One user context item contains current semantic room/provenance, selection, resolved task/scope, offered catalogue options and bounded recent text. No photos, private filenames, grants, keys, old tool payloads or raw provider prose are attached. The final model output is only `{kind:"done"}`; actual reply copy, checks, measurements and receipts belong to the application.

## Supported capabilities and boundaries

| Capability | Actual behavior |
| --- | --- |
| Work area by window | One desk and at most one chair; disclose both affected pieces. Other furniture/finishes stay unchanged. Multiple desks/chairs/windows require actual selection/clarification. |
| Rearrange owned / clear entrance | Only owned movable targets; fixed pieces remain fixed. Entrance requests use computed entrance blockers rather than authorizing all unlocked pieces. No additions/replacements. |
| Furnish / add essentials | One of each named supported category; stable application IDs. Kept/nearby nouns are not additions. Existing furniture is not resized or moved to manufacture room. |
| Remove / replace | One explicit target; independent starting locks and retained/owned preference must permit it. Replacement is a supported proposed representation, distinct from measured owned size. |
| Left/right move | Known physical extent and room width; retain orientation/depth position and unrelated pieces. A rotated unknown footprint requests its actual dependent depth. |
| Room/piece appearance | Three supported room directions or a selected supported piece finish. Preserve geometry; owned finish is unchanged by general room presets. Proposed eligible finishes are part of the captured batch. |
| Explain/check/focus | Source-controlled facts and canonical IDs. Unknown or approximate checks stay visibly incomplete/approximate. Cards focus the real item/field. |
| Visitor controls | Missing measurement, independent lock, replacement preference and explicit Undo guidance point to real controls. Tools never confirm a value or unlock a piece. |
| Unsupported request | Prices, budgets, shopping and unknown finishes/capabilities receive concise size/layout/style alternatives. No retailer, URL, code or arbitrary network tool exists. |

Mixed add/move/finish batches and coordinated swaps are atomic when explicitly scoped by application preparation. Free wording that cannot safely establish all targets asks for narrower choices; it does not silently authorize a broader batch. Natural-language coverage remains deliberately conservative and does not claim general model understanding.

## Strict tools and bounded execution

Closed contracts allow `read_room`, `find_furniture`, `find_arrangements`, `prepare_edits`, `explain_checks`, `focus_item`, `request_measurement`, `request_lock_change` and `request_undo`. Each resolved task exposes only its relevant subset. Full furniture entities, dimensions/ownership/provenance and add/replace variants are built by application code from approved catalogue choices; flat tool arguments cannot fabricate them. Irrelevant non-null fields, extra properties, unknown tools/IDs/variants, unlock/confirmation and out-of-scope edits reject.

The serial loop allows at most4 provider rounds and the existing16-tool ceiling, with one call per round, deduplicated call IDs, strict projected schemas and no retry. A final output without a computed decision is incomplete. Repeated distinct prepared batches reject. Known spatial/lock rejection returns the actual computed issue, not a successful fit claim. Goal/preset fidelity is checked in addition to generic schema/space compliance. Measurement requests must be missing dependencies in actual unassessed checks relevant to the selected task; another piece's width may legitimately matter to a selected piece's overlap check.

The shared finite runtime/admission controls remain unchanged:60s assistant operation,45s provider call,110s independent browser watchdog, byte/fragment/token/rate/grant/concurrency bounds and real-settlement slot retention. Stateless `store:false` reasoning/function-call replay stays in bounded operation-local backend memory; see [transport policy](provider-safety.md). Browser history is at most80 compact messages/256KiB, with at most40 recent text turns/64KiB supplied to a request. Stored cards drop actions and retain at most8 objects/issues/fact IDs. No refresh replays an operation.

## Preview, Apply and UI

One candidate remains separate from Current. Plan ghosts show previous positions; the existing cutaway renders the same candidate and highlights. Count, inventory, checks and read-only inspection follow the displayed candidate. Apply/Cancel are beside the room; preview values cannot be silently edited as Current. Measurement guidance cancels a preview before opening a canonical editable field. Catalogue additions require resolving the existing preview.

Prepare and Apply use the same command authority, captured application scope, versions, input revision and starting locks. Apply recomputes the complete final batch, increments revision once and records one Undo entry/actual receipt. Replayed Apply returns already-applied without duplicate pieces/history. Cancel adds no accepted state/history. Manual edits, a new request and reset/expiry fence late worker/provider/transport results before cleanup. The independent visible watchdog ends progress even if an injected transport ignores abort. Import/comparison/recovery integration belongs to RM-012.

The assistant uses the existing sidebar, without repeatedly shrinking the room. An initially open native goals/finishes disclosure collapses after a request to preserve message space. The reachable composer has visible44px Send, Enter submission, Shift+Enter newline and composition guards. Draft text survives panel navigation. Canonical thumbnail/object/issue cards inspect real room data; simulation is explicit. The short optional read-only guide uses actual target bounds, scroll/resize observation and stable animation frames; Skip/Done/Escape restore focus. No arbitrary entrance wait or motion-off control was added.

Actual short-laptop/phone/tablet evidence and outstanding physical/live limitations are recorded separately in the validation receipt. Owner visual acceptance remains RM-015; broad accessibility, model compatibility, privacy/funding/challenge and hosted performance are not inferred from this local implementation.
