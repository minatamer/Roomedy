# RM-015AV — Expanded bedroom furniture and bathroom doors

20 October 2026. Local implementation complete; actual owner visual approval remains pending. Parent7d7d1da. Exact63-path allocation and extensions are in [the plan](../commit-plans/RM-015AV.md). No paid/live/key/config/delegation/new dependency/service/port/push/deploy authority was used.

## Result and shared authority

The catalogue has19 entries, including eleven new original procedural representations: full-length mirror, shelf with drawers, chest of drawers, bedside drawers, TV stand, tabletop TV, wall-mounted TV, lounge armchair, bedroom bench, side table and floor lamp. Every addition has a useful preset matching its default plus alternatives. TVs offer43/50/55/65/75-inch planning sizes. The four drawer pieces reuse AU's selected transient Open/Close preview. Existing materials and two licensed GLBs remain; eleven exact-hash SVGs are generated from the actual entry variants. [Primary dimensions and asset decisions](../references/bedroom-catalogue-2026-10-20.md).

Optional canonical pose bottomY supplies planned TV elevation and preserves legacy floor poses. Missing elevated height stays unknown. Real vertical intersections and ceiling dependencies prevent false TV/stand overlap or false fits; ordinary floor/floor conservatism remains. Wall-TV backs attach to the selected wall, including clamped dragging/numeric placement. Manual larger presets can move an unlocked item along its wall within the same command; position locks prevent that side effect. Scoped model rotation also needs move permission when changing walls. Exact mounting controls, manual/MEDY edits, animation, snapshots, whole-change Undo, recovery/import and exports use the same room authority. The final TV-to-floor replacement correction uses the new representation's placement defaults, matching manual catalogue replacement.

Bathroom purpose is optional metadata on an ordinary door. Room panel, inspector,2D accessibility, grounded MEDY cards/review, narrow navigation and export names distinguish it. Existing wall/width/hinge/mechanism, clearance and preview controls remain. The document still contains one rectangular room; no bathroom interior or bathroom furniture exists.

## Review and independent corrections

- Early command tests found pose evidence leaking into strict move targets. Placement targets now exclude provenance; the command owner authors planned evidence and preserves omitted elevation.
- Native mirror inspection found its reflective face covered by the original solid frame. A real open frame/back plate now exposes the reflective plane; an independent front-most-plane regression protects it.
- Native wall-corner resizing exposed a larger preset outside the room. Shared manual size authority now clamps the unlocked along-wall pose atomically, preserving locks and final checks.
- Read-only pass1 traced wall rotation's implicit move through the scope owner. The separate move permission guard is independently tested.
- Native2D TV/stand projection exposed insertion-order painting and overlapping labels. Shared floor-to-top projection and label visibility serve editor and PDF; correct compact names, neutral TV fill and room-side wall-TV labels retain readable control geometry.
- The first full gate found a generic seating fallback extending23 mm above a400 mm envelope. The actual bench variant was already bounded; the generic armrest calculation is now bounded too, with the existing all-entry min/max envelope check passing.
- Actual MEDY height preview exposed a blank detail row. Review now shows the before/after planned bottom edge; bathroom purpose/names are included.
- Read-only pass2 traced TV height leaking into MEDY floor replacements. A command regression verifies TV-to-mirror replacement uses floor placement, matching the manual builder. Only the compiler and its test changed after the native geometry/export review.

Read-only pass3 on the final63-path combined worktree: **Meets ticket; no actionable findings.** Registry, contracts, geometry, commands/scope, manual/chat forms, projection, material ownership, export/import and exact assets were inspected against the ticket. No new tests or code were authored during the read-only pass. Source/assets/test snapshot:55 paths, SHA256 `27385e3646956463e8a58746cda7851452962e99a5210d872e5333886dd4ef1c`; raw working-copy snapshot retained at `.release/AV-source-review-final.json`. No broader audit or external approval is implied.

## Actual native observations

Fresh isolated in-app-browser rooms on the existing4320 app:

- All eleven additions placed through the actual catalogue. Shelf/chest/bedside/TV-unit drawer actions opened and closed; selected Delete and Undo restored the floor lamp. The real shelf and media-unit drawer geometry was visually inspected.
- Wall TV changed mounting walls and resized55→65 inches at a corner; numeric Z placement,1000 mm elevation, a rejected2500 mm height and disabled mounting controls under position lock were observed. A TV stand and tabletop TV coexist at real600 mm base height. The450 mm supporting-height request correctly rejected a physical overlap;750/600 mm changes succeeded.
- A full-length mirror's corrected reflective face and an inward, right-hinged bathroom door were inspected in the same bedroom. The existing room door/window remained. The final scene screenshot is [here](C:/Users/minat/.codex/visualizations/2026/10/20/01a15835-0bd9-7d20-9601-faf2b8383623/RM-015AV-final-room.png).
- Actual2D projection showed one clear TV label above its stand.2D/3D and properties were exercised at1280×720,390×844,320×568,768×1024,1280×600 and1440×900. Recorded document/panel scroll widths never exceeded available width; phone properties and Back-to-room remained reachable. Tablet camera controls legitimately use an extra row. [Geometry records](C:/Users/minat/.codex/visualizations/2026/10/20/01a15835-0bd9-7d20-9601-faf2b8383623/RM-015AV-responsive-geometry.json) include the initial loading sample separately from settled samples. Desktop viewport overrides do not prove physical touch/GPU behaviour.
- MEDY prepared/applied a600→750 mm TV elevation and Undo restored it. A fresh final chat prepared/applied a bathroom door on the east wall at2000 mm offset, outward/left hinge, with a named object card and full review facts. Requests used the application-owned exact edit compiler, with no real-provider dispatch. Development module replacement reset a provisional chat view; a normal reload retired its transient candidate and retained accepted semantics before the final check. Mid-hot-reload chat continuity is not claimed as release evidence.
- Native PDF, GLB, OBJ/MTL/textures ZIP and editable JSON downloads succeeded. JSON preserves two pieces,600 mm TV elevation, bathroom purpose and one rectangle; GLB's TV node has Y0.6 m and a Bathroom door node. OBJ ZIP contains7 entries including OBJ/MTL. The project was imported through the real file chooser/confirmation and its Bathroom door remained in Room properties.
- Poppler rendered all4 native PDF pages. All were visually inspected; cover/cameras, life lettering, inventory and separate stacked-plan numbers are readable. QA copies and page montage are in `.release/local-apps/run-20261020-ab0cdbf3/AV-exports/`. No new PDF is delivered as an owner artifact.

Specific accessibility observations cover labelled controls, pressed opening actions, keyboard placement, readable field-level rejection, independent locks and reachable narrow navigation. No blanket WCAG, physical-device or performance certification is claimed.

## Settled checks and exact bytes

Final telemetry-disabled `pnpm check` passed: format, lint, all types,7 executable boundary tests, exact material/catalogue assets, **822 tests /55 files**, backend build and frontend build. The isolated runner forces fake/paid-off and blocks unexpected external transports. Final log: `.release/local-apps/run-20261020-ab0cdbf3/AV-check-complete.log`. Earlier failed/provisional gates remain separately named; they do not stand in for this final gate.

Final runtime inventory: **267 files /3,368,707 bytes**. Input digest and production BUILD_ID: `570ba31247edb3a7475e3b6b6504496402ba239ba5c7e5ec7dc870e6ae0d6a43`. The development app stays separate in `.next-dev`; no production review instance was started. A fresh exact-file inventory is compared with the final manifest and BUILD_ID before checkpointing. No source changes followed the final gate.

## Runtime and remaining gate

The restart skill verified both old dedicated supervisors/18 owned identities absent and4320/4321 released through stabilization, then launched the normal commands without mode/config changes. Frontend supervisor19572/listener3064 and backend supervisor26096/listener10528 remain on4320/private4321; exact creation times and descendant identities are in the refreshed ignored runtime record. Logs: `C:/Users/minat/Work/Roomedy/.release/local-apps/run-20261020-ab0cdbf3/frontend.stdout.log` and `backend.stdout.log` with matching stderr paths. Local HTTP readiness is200 and `fake-ready`. The browser's stale connection-error pages were blocked by its URL policy; no workaround was used. Native verification used fresh permitted HTTP tabs. Temporary feature rooms38/39 were closed; the error tab37 remains subject to normal automatic cleanup. The original preview can be reloaded by the owner.

Actual owner visual decision remains pending; Q held, guide goal paused, RM-016 Planned. Funded live-model quality, Linux/hosted/physical-device/native-heap/production continuous-frame evidence remain outside this local result. No push, deployment or external service change occurred.
