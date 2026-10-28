# Spatial rules and command authority

## Disposable AI planning geometry — RM-015BV

Latest owner instruction supersedes missing-input AI gates while preserving canonical evidence. planningRoom reuses supplied values and fills absent dimensions from the actual catalogue or bounded defaults:6000×5000mm room expanded to existing furniture extents within20000mm,2700mm height,900mmdoor/1200mmwindow width,2100mmdoor/1200mmother height,900mmwindow sill/0otherwise,200mmobstacle projection, centered windows and200mmother opening offset. Unknown doors use west/inward/left; other unknown walls use north and windows fixed. Missing values are estimated/planning-default in a disposable projection, never saved as confirmed. Supplied values and explicit locks are untouched. Search and candidate revalidation share the projection; scoped commands return the canonical original room plus evaluated checks, committing only requested actions. Search facts keep one assumed room envelope across before/after. Genuine conflicts/scope/schema/bounds still apply. Unassessed/unimplemented metadata remains available internally for existing closed exports/contracts, without UI coverage nags or AI measurement interruption. Explicit visitor corrections remain. [Evidence](../validation/RM-015BV.md).

## Furniture appearance commands — RM-023,26October2026

`set-furniture-materials` is a strict visitor-only patch; the pure evaluator checks actual catalogue part roles and supported detailed size before accepting fields. It cannot alter measurements, locks, geometry, ownership or product identity. Unsupported mixtures reject atomically, including leather bedding/velvet lamp shades and soft/hardware edits on bounds-only models. Patch fields merge with accepted optional choices. Existing add/replace candidate policy, original finish permission, normal room validation, preview identity and one-command Undo remain authoritative. Imports retain optional strict data without inventing facts or stretching a fixed mesh. A nullable soft-colour patch explicitly restores its default, independently of upholstery/hardware. Use default colour in the inspector and an explicit Medy default-soft-colour request share that command. [Current evidence](../validation/RM-023.md).

## RM-022 material choices —26 October 2026

`set-room-surface` retains its visitor-intent authority and adds named wall targets plus optional bounded material detail. Detail specifies full texture repeat width/height100–3000mm, direction0–3 and matte/satin/gloss; it is planned appearance, never measurement evidence. Each wall inherits unknown/omitted colour/texture/detail from all-walls. Individual edits preserve aggregate/other-wall state. All-walls patches apply only requested fields to existing overrides, preserving different textures/detail when changing colour. No-op and omitted fields retain their original evidence and do not create an empty override. Global room palettes intentionally apply colour to every existing wall record while preserving independent texture/detail.

Legacy schema1 rooms remain valid; optional records are strictly validated on normal room/project import. The normal pure evaluator, command identity, stale/replay checks, atomic batches and whole-change Undo remain the only commit path. Studio controls and Medy's supported explicit visitor-intent edits share it. No physical dimensions, opening facts, pose, locks or fit authority are changed by material choices. [Actual validation](../validation/RM-022.md).

RM-003 implementation policy, 17 October 2026. Use with the [ticket](../tickets/RM-003-build-spatial-checks-commands-and-undo.md), [approved refinements](../reviews/2026-10-17-plan-review.md) and [actual validation record](../validation/RM-003.md). This policy describes the supported semantic model; it is not a building-code, accessibility, ergonomic or real-world survey certification.

## Coordinates and physical truth

The supported room is one rectangle. Physical dimensions are bounded integer millimetres. Furniture centres are exact multiples of 0.5 mm, bounded to ±40,000 mm; room edges are at most 20,000 mm and furniture edges at most 10,000 mm. Invalid, non-finite, unsafe and unsupported values reject. Display rounding does not enter geometry. An odd 1501 mm span exactly fits from 0 to 1501 with centre 750.5; no epsilon enlarges the room.

The floor uses X east and Z south, Y up, origin at the northwest corner. Furniture width/depth are local unrotated axes; pose is its footprint centre. Quarter-turns are clockwise in plan: `(x,z) → (-z,x) → (-x,-z) → (z,-x)`. Local front is +Z. The future Three adapter converts millimetres to metres once and uses Y rotation `-quarterTurns * π/2`. Decorative mesh bounds never determine fit.

Owned items retain their bounded true dimensions independently of the selected asset's size range. Offered proposed additions/replacements remain within catalogue size/finish policy. An incompatible owned representation uses an explicit semantic box with exact physical bounds, including tiny but structurally bounded values; a detailed fixed mesh is never stretched silently. A physical correction can reveal an arrangement issue without being rejected merely to preserve the previous layout.

## Evidence and check coverage

Numeric dimensions retain their own unknown/estimated/extracted/scan-derived/confirmed source. Pose has bounded provenance; a deliberate target position uses `planned`, distinct from confirming an observed photographed position. Wall association, opening mechanism and door hinge retain separate bounded evidence, with unknown values explicit. Only trusted visitor/authored-sample actions can confirm facts; assistant hypotheses cannot.

Checks describe their actual dependencies. Unknown evidence makes dependent fit unassessed; estimated/extracted/scan-derived values remain approximate. Planned geometry is identified as planned, not an authenticated survey. A visible overlap in a bounded display hypothesis remains a conservative hard blocker even when its evidence is unassessed. Missing information never supplies a green pass. Unsupported entry connectivity remains explicitly unassessed. Each of the nine rules reports status, confidence, assessment count and unassessed count; rules with no applicable objects are explicitly not applicable.

## Supported geometry

| Rule | Geometry and limitation |
| --- | --- |
| Containment | Check semantic footprint portions outside each room edge separately. Exact edge contact is allowed; positive crossing is a blocker. Finite physical feature positions can describe an existing bad placement and remain visible as facts. |
| Solid overlap | Strict positive-area intersection of full semantic floor footprints. Edge contact is distinct from access clearance. No tucked-under chair/desk exception is inferred from a decorative mesh or an unknown height. |
| Furniture height | Compare actual known item height to room height; unknown dependencies remain unassessed. |
| Storage access | A configured front band uses catalogue mechanism and clearance; hinged/sliding storage have distinct presets. These bands are functional areas, not solid furniture. |
| Chair use | Pull-out is behind the chair's local front. A correctly facing chair may occupy the desk's configured use band; its solid footprint still cannot overlap the desk. This is not ergonomic certification. |
| Door | An inward leaf reserves a conservative width-by-width rectangle inside the room at the opening. Outward/sliding doors use the configured 600 mm approach band. Unknown required wall/mechanism evidence is unassessed; the hinge is required for the inward-envelope rule. The rectangle does not claim an exact hinge sweep. |
| Window | A fixed/outward/sliding opening uses the configured 100 mm band with a warning for an item above its sill; inward movement uses a wider modeled band and a hard blocker. Unknown sill/item height remains unassessed when the footprint reaches the modeled window band. |
| Fixed obstacle | Use its wall interval, inward projection and relevant vertical values. A finite feature outside its wall/ceiling is a disclosed physical conflict, not permission to alter room dimensions. |
| Entry connectivity | No path-finding claim in this ticket. Free floor area alone does not prove a route exists. |

Catalogue access presets in millimetres: bed 600, desk 800, procedural/fixed chair 800, hinged wardrobe 800, sliding wardrobe 600, open storage 600, fixed hinged bedside storage 450. Generic open-item use-band infringements are warnings; supported opening/pull-out restrictions are hard checks. These are versioned planning assumptions, not independently certified clearances.

The independent door corpus must record approximation error. For a north door with a hinge at `(1000,0)` and radius 900 mm, the footprint `[1800,1900] × [800,900]` lies inside the conservative square but outside the actual quarter-circle: even its closest point has squared hinge distance `800² + 800² = 1,280,000 > 900² = 810,000`. Mirror the case for the other hinge and include a physically covered control. This disclosed false rejection is deliberately tested. An analytic sector is conditional on demonstrated product need and independently tested precision; this ticket must not describe the rectangle as exact.

## Commands and corrections

The shared evaluator takes a structurally bounded room, a bounded action batch and a trusted application authority. Wire fields cannot assign their own authority. Manual controls, accepted intake and assistant proposals share this evaluator. The engine performs no I/O, time/environment lookup, storage, provider or renderer work.

Visitor corrections include dimensions and feature add/update/remove, including wall/mechanism/hinge. Room/furniture/feature IDs are unambiguous. Physical-description corrections can reveal blockers while preserving the corrected fact; mixing a correction with an arrangement move does not grant a general conflict bypass. An assistant can request visitor measurement/lock work, but cannot confirm, unlock or renovate the room.

Locks and retained ownership are checked against the starting room throughout a batch. Unlock-then-move cannot evade a starting lock. Owned resizing is a physical measurement correction or explicit replacement, not a smaller synthetic owned item. Assistant changes preserve retained dimensions and owned finishes. An explicit starting Keep preference protects removal/replacement even for a proposed piece. Proposed variants use supported catalogue policy.

Evaluate the complete final arrangement atomically, allowing coordinated swaps whose intermediate states would overlap. Any invalid action rejects the entire batch without mutating its input. Issue identities are stable by rule/involved IDs and relevant region ownership, not array order or issue count. Existing conflicts stay disclosed. A repair introduces no new hard identity or affected region, does not worsen area/deficit, and improves at least one existing hard problem. Appearance-only changes can preserve disclosed issues without claiming fit.

## Apply, replay and Undo

The envelope binds workspace/generation/room/input revision, versions, command ID, monotonic command sequence and exact actions. Prepare does not commit. Apply re-evaluates against current state and creates a payload-bound receipt. New accepted commands advance the sequence high-water mark; a finite recent cache supports exact duplicate receipts. Evicted old sequences remain stale, including after no-ops and Undo. Cache eviction never restores an old command's execution authority.

A changed batch increments room revision once and stores one previous semantic room for Undo. An accepted no-op creates no history or room revision, while retiring its command sequence safely. Undo restores the prior whole semantic arrangement as a new increasing revision; it preserves the immutable Before baseline and command high-water mark. It has no provider, conversation, photo or capability effect. Redo is outside scope.

History is bounded to 20 snapshots and 2 MiB, pruning oldest entries deterministically; receipt memory is independently bounded. Reset/import create a fresh workspace identity/history in their later controller owner. Cancellation and asynchronous effect fencing belong to the controller; this pure package validates the identity supplied to Apply.

## Evidence boundary

The RM-003 validation receipt records actual tests/builds, read-only review and any remaining local defects. Geometry fixtures use independently derived facts rather than the engine as their oracle. Photos, real-provider quality, layout-search success, R3F/browser behavior, storage, actual Linux/hosted execution and owner visual/security decisions remain separate ticket evidence.

## AA visitor planning size estimates

`set-size-estimate` is a visitor-only bounded action with integer width/depth and optional height. It exists separately from measured corrections and assistant/proposed-only resize: presets can describe owned furniture without falsely confirming it. It respects the original dimension lock even if another action unlocks it in the same batch; UI Unlock is a separate explicit command. Only changed provided axes become estimated/visitor-estimate; omitted/unchanged confirmed/extracted/unknown values survive. Ownership/preferences/poses/other locks do not change. No assistant action/schema/scope expansion, no inclusion in measurementActions and no bypass of final hard-conflict/repair/variant checks. Fixed proposed variants and catalogue bounds remain strict; owned physical evidence remains independent of representation eligibility. One atomic dispatch and normal Undo/replay/expiry authority owns the result.

Review’s same authority records deliberate per-axis keys for provided estimates, preserving them through later hypotheses. Presets never claim physical measurement, exact product geometry, certified clearance or a real-provider action. [AA plan/evidence](../validation/RM-015AA.md) and [manufacturer research](../references/furniture-sizes-2026-10-19.md) distinguish defaults from actual facts.


## AD surface choices and evidence

Visitor-only set-room-surface patches one bounded floor/walls colour/texture through existing evaluateBatch/dispatch/Undo. It is nonspatial like room-finish; no geometry/measurements/pose/ownership/locks are changed and existing conflicts are not hidden. Changed fields only become planned/visitor-plan; no-op/omitted values retain evidence. Existing room-finish actions intentionally select palette colours (palette-plan) while preserving independently chosen texture, and preview uses the same helper. Assistant proposal schema is not expanded; existing no-op and changed-room fact comparisons now include resolved surface appearance so custom colours cannot mask a requested palette. Optional schema1 fields preserve old imports and bounded semantic recovery/export; baseline and lifecycle fencing remain. Photo intake carries separate estimated facts with supplied source IDs; reviewed/planned corrections survive later hypotheses, source removal/reclassification retires unreviewed estimates, and appearance never establishes frame/scale. [AD plan/evidence](../validation/RM-015AD.md); latest batch test deferral is not final verification.

## AQ initial-facing preferences

Local+Z/front arrows and all configured access geometry remain the source of orientation truth:0 south,1 west,2 north,3 east. The small pure initial-facing helper compares exactly four new-piece turns using footprint containment/solid overlap, configured service-band obstruction, then back-wall gap (or a chair facing a nearby desk). It does not replace the complete validator, certify ergonomic access or invent unknown geometry. Existing chair pull-out and desk-facing-chair exceptions apply only to access, never to solid overlap. Obstacle/opening/unknown checks still belong to the command evaluator. Explicit visitor rotation stops automatic new-piece suggestions; replacement and accepted/imported/recovered poses are preserved.

Fresh authored starter wardrobes now use centre3850/3200,turn1 with50mm east gap and west-facing access. Independent sample-corner literals record3550–4150 by2600–3800, derived by hand from the1200×600 rotated footprint. This changes new fixture construction, not persisted room data. AI search uses target-scoped computed access/backing preferences under the existing hard rules; recognition is instructed to estimate only visible facing and keep ambiguous orientation null/unknown. [Ticket/evidence](../validation/RM-015AQ.md).

## CPQ history context — RM-027

Spatial validation and receipts retain their existing authority. Room Apply may capture a strict financial-before snapshot in the same twenty-entry/two-MiB history. A cost-only history entry advances the command high-water mark but not geometry/revision; geometric Undo retains its increasing revision. Undo returns financial metadata to the Session owner for a fresh cost revision, without performing provider work or changing the immutable baseline. Byte limits include financial data. Combined source-size proposals use ordinary visitor set-size-estimate and final validation, including original size locks and per-axis estimated provenance. See [cost planning](cost-planning.md).
