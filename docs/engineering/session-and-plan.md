# Canonical session and precision plan

RM-005 implementation notes, 18 October 2026. [Ticket](../tickets/RM-005-deliver-canonical-session-and-precision-2d-editor.md), [spatial authority](spatial-rules.md), [file allocation](../commit-plans/RM-005.md). Actual verification belongs to the validation receipt; this document alone is not a pass.

## State and command ownership

`SessionController` is the sole owner of the accepted command workspace, immutable starting baseline, revision, bounded shared history, recent receipts and operation invalidation. React subscribes through `useSyncExternalStore`; views never assign accepted room state. `entry`, `intake`, `editor`, `expired` and `disposed` are explicit phases. Current sample entry dynamically loads the editor after its source/condition decisions; the own-room boundary remains RM-007.

The controller reuses `createCommandWorkspace`, `prepareCommand`, `applyCommand`, `undoCommand` and `checkRoom`. There is no second command or geometry implementation. Visitor intent uses visitor authority; later assistant callers must add their own application-owned scope and assistant authority rather than treating this visitor API as model permission. A failed spatial command can carry the one exact already-computed blocking issue. Source-controlled UI wording resolves its IDs against current semantic labels; it does not print raw exceptions or expose an invented successful receipt.

Each accepted edit has one envelope/sequence and one history entry. Selection, panel choice, zoom, pan and snap preference are presentation data. A no-op retires its command safely without changing room revision or cancelling a valid operation. Undo restores a semantic snapshot as a new revision and leaves the starting baseline fixed. UI Undo labels are pruned with the bounded history; no unbounded parallel label/receipt store exists.

## Identity, lifetime and effects

The workspace has a fresh opaque ID, monotonic generation, created-at and fixed two-hour expiry. Production uses the system clock and crypto UUIDs; tests inject both. Accepted intake captures the baseline without extending that workspace's expiry. Explicit reset creates a new identity/generation/lifetime; invalid replacement validation happens before useful work is retired.

Every action and asynchronous result checks expiry independently of the wake-up timer. Retirement clears accepted semantics and fences phase/generation/pending identity before aborting or releasing resources. Reset, expiry and dispose release owned work. One operation token contains workspace, generation, operation ID, room ID and input revision. A newer operation, semantic edit, goal change or Undo retires old work; camera/selection inspection does not. Completion is synchronous, single-use and rechecks expiry after cleanup. Async consumers must perform guarded completion for every write, including after an abort attempt.

The registry admits at most 64 session resources and 16 operation resources. Resources can be abort callbacks, worker termination, blob revocation or cancellation of deferred writes; current RM-005 has no photo/network worker to dispatch. Release is idempotent. Rejected/stale admission releases immediately. Individual cleanup failures cannot prevent other cleanup and are counted without retaining unknown exception text. Cleanup callbacks release resources; they must not create new work. Session resources survive ordinary manual edits; operation resources are retired when their captured semantics become stale.

The editor creates its controller on a client microtask owned by its effect. A cancelled StrictMode/unmounted setup cannot publish a controller; actual unmount disposes the owned controller and timer. SVG gesture capture and animation frames are view-owned and cleaned on unmount. Storage, semantic export/import, Before UI, warnings and broader two-build lifecycle handling remain RM-012/RM-014; no photo or durable project is stored by RM-005.

## SVG and gestures

The plan uses millimetres, northwest origin, +X east and SVG +Y mapped to semantic +Z south. Furniture poses remain centres and quarter-turns; footprint calculations and wall bands come from the shared spatial package. The pure adapter maps client coordinates through the SVG `meet` letterbox and current displayed viewBox. Zoom/pan animate the actual viewBox for 180 ms; accepted piece movement/finish changes have short transitions. An interrupted view transition continues from its rendered box. View transforms never change physical dimensions or create history.

Free movement rounds only to half-millimetre centres. Snap prefers nearby exact wall/neighbor edge contact within 40 mm, with relevant perpendicular spans, otherwise a 50 mm centre grid. Odd dimensions retain exact half-mm contacts at every quarter-turn. This snapping helper proposes coordinates; it never determines fit. The shared evaluator validates the final drop.

Pointer capture owns one transient ghost. A click under three screen pixels is selection, so selecting an existing half-mm position does not snap or authenticate it. Pointer-up inside the plan commits once only if the captured revision is still current; outside release, cancellation, lost capture and Escape preserve current semantics/history. Rejected drops report the actual shared blocking issue. Arrow keys nudge 10 mm, Shift 100 mm and Alt 0.5 mm, with composition-safe key handling. Numeric position inputs preserve half-mm values. Width/depth/height inputs use integer millimetres.

The plan reads the current or explicitly labelled candidate projection. It shows wall openings, dimensions, furniture fronts and selected issue regions, capped at 32 visible overlays. Issue borders appear above furniture with a light contrast halo. Unknown room dimensions produce an explicitly illustrative outline; unknown piece dimensions use an identified placeholder rather than fabricated dimensions. Plan footprints, catalogue cards and measured dimensions remain independent of decorative mesh eligibility.

## Controls, provenance and panels

Owned/preference/position/rotation/size locks remain independent. Measurement confirmation is a deliberate per-field action; unrelated evidence stays unchanged, and unknown can be restored explicitly. A true owned measurement may exceed the selected representation's range and reveal conflicts; the plan retains its size and discloses the representation limit. Proposed resizing stays estimated and respects the offered range. Fixed-size variants do not show an unusable resize form. Replacement is explicit, shows the old/new physical sizes, and cannot silently resize an owned piece.

Feature corrections use add/update/remove commands with wall, mechanism, hinge and per-value evidence. Newly added features have estimated dimensions and unknown wall/mechanism/hinge. Unknown facts stay unassessed. Corrections describe the physical room rather than authorizing renovation. Derived issues stay visible after unrelated appearance changes, and incomplete/unsupported checks never become a global fit pass.

Palette preview is separate from the accepted room and revalidated on Apply. It changes room finishes and compatible proposed pieces, preserves owned finishes, and records one Undo step. Cancel/new preview/manual semantic changes retire it. The action-count ceiling remains enforced; a palette involving too many changed pieces directs individual finish editing instead of splitting one change secretly. Prices/shopping, 3D, AI, durable storage and comparison controls are absent from this ticket.

Desktop keeps the room alongside one inspector. Narrow layouts stack a useful plan and active panel instead of squeezing columns. Panel transitions focus their actual heading; plan gestures retain plan focus. Mobile has explicit Edit properties/Back to plan actions. Numeric errors keep the relevant draft, name units/ranges and focus the field. Native leave confirmation compares current/baseline semantics (excluding only revision), rather than prunable history length, when choosing another room or returning home. Its interaction was browser-review blocked; the semantic guard has a regression. Explicit conditional buttons can confirm a known estimated wall/mechanism/hinge without changing its value.

## Verification boundaries

Session and adapter fixtures independently exercise baseline immutability, one-step Undo, all quarter-turn contacts, letterboxing/pan/scale, locks/invalid drops, per-value corrections, operation races, sleeping expiry, cleanup, long editing and preview atomicity. Actual browser checks are required separately. Desktop emulation does not prove physical touch/GPU/assistive behavior. The fixed two-hour expiry is a known timing-adjustability limitation, not blanket WCAG conformance.

Vitest integration-test type checking uses ESNext/Bundler resolution for imported frontend modules, matching its runtime. Shared/backend production builds independently retain NodeNext checks. After rebuilding a changed shared package, restart only an owned app whose dependency bundle remains stale; ordinary UI edits use hot reload. No live/provider result, deployment or owner visual decision follows from these local checks.

## RM-006 projection extension

The editor now lazily composes one cutaway with the same current/candidate/checks/selection inputs. View/camera refs are presentation state scoped to the workspace; no semantic controller method, command policy or baseline authority changes. The loading boundary keeps PlanView usable; graphical failure preserves numeric/plan editing. [Renderer design and ownership](../design/room-view.md), [actual evidence](../validation/RM-006.md). References above to 3D being absent describe RM-005 historical scope.
