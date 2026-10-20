# Roomedy — product and engineering blueprint

**Chat composer simplified — RM-015BC:** Removed the keyboard-help line, composer divider and visible Ask Medy label. The textarea retains its accessible name, and Send stays right aligned. Keyboard/composition/chat behavior remain. [Ticket](tickets/RM-015BC-remove-chat-keyboard-hint.md), [allocation](commit-plans/RM-015BC.md), [evidence](validation/RM-015BC.md). Scoped format/lint/frontend types and actual desktop/phone checks pass; no fresh full-build claim. Actual owner approval pending; Q held, guide paused, RM-016 Planned.

**Selection-driven arranging — RM-015BB:** Explore view/Arrange room buttons and independent mode state are removed. Selecting furniture enables direct editing; clearing selection restores navigation. Selected windows retain wall editing. Empty floor/background or scoped Escape clears selection safely; Medy follows the same selection behavior. [Ticket](tickets/RM-015BB-use-selection-to-arrange.md), [allocation](commit-plans/RM-015BB.md), [evidence](validation/RM-015BB.md). Actual owner approval pending; Q held, guide paused, RM-016 Planned.

**Fitting2D furniture labels — RM-015BA:** Whole names turn sideways when a tall narrow footprint lacks horizontal space; names that fit stay horizontal. Shared bounded type fitting preserves TV captions, unknown fallback, front/selection/physical geometry and commands. [Ticket](tickets/RM-015BA-fit-plan-labels-to-furniture.md), [allocation](commit-plans/RM-015BA.md), [evidence](validation/RM-015BA.md). Actual owner approval pending; Q held, guide paused, RM-016 Planned.

**Header groups and Project motion — RM-015AZ:** Project then Undo follows the brand; Furniture/Room/Medy moves to the right to match the properties column. The Project dropdown fades/slides/scales open and closed through one interruptible finite owner, with immediate closing focus exclusion and responsive anchoring. [Ticket](tickets/RM-015AZ-align-header-controls-and-animate-project.md), [allocation](commit-plans/RM-015AZ.md), [evidence](validation/RM-015AZ.md). Actual owner visual approval pending; Q held, guide paused, RM-016 Planned.

**Medy identity and chat — RM-015AY:** The assistant is displayed as Medy with one shared decorative sparkle in studio/navigation/landing. Visitor messages and text align right in warm bubbles; assistant replies are plain on the left. A keyboard-focusable bounded history keeps older messages scrollable and the composer/actions reachable. Fake greetings, tour and real instruction use the same name. [Ticket](tickets/RM-015AY-refine-medy-identity-and-chat.md), [allocation](commit-plans/RM-015AY.md), [evidence](validation/RM-015AY.md). Actual owner visual approval pending; Q held, guide paused, RM-016 Planned.

**Beige Export — RM-015AX:** Project Export now uses a reusable beige button class, visually distinct from neutral Import and brown Start a new room. Existing menu sizing, focus/hover/disabled states,44px targets and file actions remain. [Ticket](tickets/RM-015AX-distinguish-export-with-beige.md), [allocation](commit-plans/RM-015AX.md), [evidence](validation/RM-015AX.md). Actual owner visual approval pending; Q held, guide paused, RM-016 Planned.

**Selected deletion — RM-015AW:** Delete now follows the current selection in Explore or Arrange, in2D/3D. Furniture (including owned/Keep/locked beds), windows and obstacles remain deliberately removable with one Undo; an unrelated existing conflict cannot veto pure visitor deletion. Doors, including bathroom-purpose doors, stay protected in the shared evaluator, inspector and MEDY. [Ticket](tickets/RM-015AW-enable-selected-deletion-and-protect-doors.md), [allocation](commit-plans/RM-015AW.md), [evidence](validation/RM-015AW.md). Actual owner visual approval pending; Q held, guide paused, RM-016 Planned.

**Expanded bedroom catalogue — RM-015AV:** Eleven additions bring the catalogue to19: full-length mirror, drawer shelf/chest/bedside unit, TV stand, tabletop/wall TVs, armchair, bench, side table and floor lamp. Shared presets, real planned TV elevation/wall attachment, vertical checks, exact manual/MEDY edits and exports preserve the existing authority. A bathroom-purpose door remains a normal opening in the same rectangular room. Drawer previews reuse AU; no bathroom interior is created. [Ticket](tickets/RM-015AV-expand-bedroom-furniture-and-bathroom-doors.md), [allocation](commit-plans/RM-015AV.md), [size/asset decisions](references/bedroom-catalogue-2026-10-20.md), [evidence](validation/RM-015AV.md). Actual owner visual approval pending; Q held, guide paused, RM-016 Planned.

**Opening previews — RM-015AU:** Latest owner selects right-card3D opening/closing/sliding previews. Supported wardrobe panels/handles, the prepared bedside cabinet's actual door, known room-door mechanisms/hinges and operable windows animate through the existing demand scene. Open shelves/fixed/unknown mechanisms/bounds-only furniture stay static. One transient selected target retires on context/lifecycle changes; canonical geometry/evidence/checks,2D, commands/Undo, recovery and exports remain unchanged. Generic drawer motion is tested without introducing a catalogue product. [Ticket](tickets/RM-015AU-preview-opening-parts-in-3d.md), [eighteen-path allocation](commit-plans/RM-015AU.md), [evidence](validation/RM-015AU.md). Actual owner approval pending; Q held, guide paused, RM-016 Planned.

**Animated view toggle,20October:** Latest owner removes the piece count and selects one animated exclusive2D/3D pill. It remains inside the frame bottom right, mounted above the changing view/loading/graphics content so CSS motion and focus continue. Canonical view state also reflects MEDY. [Twelve-path AP allocation](commit-plans/RM-015AP.md#animated-view-toggle-follow-up-allocation--20-october2026), [evidence](validation/RM-015AP.md#animated-view-toggle-follow-up--20-october2026). This supersedes historical count/two-button presentation requirements. Actual owner approval pending; Q held, guide paused, RM-016 Planned.

**MEDY assistant revision — RM-015AT:** Exact furniture/room/opening edits, shared size presets, protected Delete/size parity, metadata/locks, selection/views/camera/Snap/tour and existing project flows now run through the same manual owners from chat. MEDY has friendly bounded advice, a Meet MEDY landing chapter and coordinated neutral design defaults. Explicit human edits compile locally; model interpretation can offer a validated request for a new visitor selection, and model prose never grants commands. [Ticket](tickets/RM-015AT-make-medy-a-complete-room-assistant.md), [allocation](commit-plans/RM-015AT.md), [capability audit](references/medy-capabilities-2026-10-20.md), [evidence](validation/RM-015AT.md). Fake and injected real-protocol checks remain distinct from funded live-model quality. Actual owner visual approval pending; Q held, guide paused, RM-016 Planned. No key/config/mode, paid/live, delegation, new dependency/service/port, push or deployment.

**Free material detail — RM-015AS:** Photographed CC0 oak planks/veneer, linen and restrained plaster now enrich the existing shapes and finish colours. Four bounded local sets/eight PNGs total912,545bytes. Shared editor/landing/export ownership preserves final-size GPU storage, data colour spaces and procedural fallbacks. [Ticket](tickets/RM-015AS-add-free-photographic-material-detail.md), [34-path plan](commit-plans/RM-015AS.md), [research/provenance](references/material-research-2026-10-20.md), [actual evidence](validation/RM-015AS.md). Actual owner visual approval pending; Q held, guide paused, RM-016 Planned.

**Single editor header,20October:** Removed the visible Design Studio title and raised Furniture/Room/Assistant into the brand/Undo/Project bar. Room and right cards use the released height; Assistant follows its actual panel. Narrow headers wrap naturally. [Eleven-path AP follow-up](commit-plans/RM-015AP.md#single-header-and-dynamic-working-height-follow-up-allocation--20-october2026), [actual evidence](validation/RM-015AP.md#single-header-and-dynamic-working-height-follow-up--20-october2026). Actual owner approval pending; Q held, guide paused, RM-016 Planned.

**3D entrance scrollbar correction,20October:** The room frame stays fixed while the existing entrance animates its inner Canvas host, eliminating transient room-column overflow. [Nine-path AP follow-up](commit-plans/RM-015AP.md#3d-entrance-scrollbar-follow-up-allocation--20-october2026), [actual evidence](validation/RM-015AP.md#3d-entrance-scrollbar-follow-up--20-october2026). Actual owner visual approval pending; Q held, guide paused, RM-016 Planned.

**Furniture access toasts — RM-015AR:** Named, actionable notices replace unexplained access-region boxes in2D/3D. Selection and new/changed accepted access conflicts/Undo use existing facts and the shared4s notice owner; narrow toasts clear the view controls. [Ticket](tickets/RM-015AR-explain-furniture-clearance-with-toasts.md), [15-path plan](commit-plans/RM-015AR.md), [evidence](validation/RM-015AR.md). Actual visual approval pending; Q held, guide paused, RM-016 Planned.

**Studio footer removed,20October:** The saved-time text, horizontal line and reserved footer row are gone.2D/3D frames and properties use the full viewport bottom; narrow layouts retain natural flow. [10-path AB follow-up](commit-plans/RM-015AB.md#remove-the-studio-footer-follow-up-allocation--20-october2026), [actual evidence](validation/RM-015AB.md#remove-the-studio-footer-follow-up--20-october2026). Actual owner visual approval pending; Q held, guide paused, RM-016 Planned.

**Rounded browser icon,20October:** The existing large cocoa mark now sits on a rounded beige tile across SVG/PNG/ICO browser variants, with revised asset URLs. [13-path AF follow-up](commit-plans/RM-015AF.md#rounded-browser-icon-follow-up-allocation--20-october2026), [actual evidence](validation/RM-015AF.md#rounded-browser-icon-follow-up--20-october2026). Actual owner visual approval pending; Q held, guide paused, RM-016 Planned.

**PDF cover correction,20October:** The first-page room now fills its own right-hand area using a padded crop of the actual3D render. Its opaque background no longer obscures the italic “life.” [Nine-path X follow-up](commit-plans/RM-015X.md#cover-framing-follow-up-allocation--20-october2026), [current evidence](validation/RM-015X.md#cover-framing-follow-up--20-october2026). Overall owner visual approval remains pending; Q held, guide paused, RM-016 Planned.

**Project primary CTA,20October:** Start a new room uses the existing shared brown editor primary class, matching its confirmation action. [Six-path AI follow-up](commit-plans/RM-015AI.md#project-primary-action-follow-up-allocation-20-october2026), [actual scoped evidence](validation/RM-015AI.md#project-primary-action-follow-up-20-october2026). This is a single-class hot-reload correction; AQ's prior production artifact remains distinct. Actual visual approval pending; Q held, guide paused, RM-016 Planned.

**Latest furniture facing — RM-015AQ:** Fresh starter wardrobes sit near the east wall with their front west into the room. New-piece previews/numeric Add share a bounded orientation suggestion until explicit visitor rotation; replacement and accepted/recovered poses stay authoritative. Shared AI search considers functional front access and back-wall placement inside the authorized scope. Recognition preserves observed facing and leaves hidden orientation unknown. [Ticket](tickets/RM-015AQ-place-furniture-with-usable-facing.md), [22-path plan](commit-plans/RM-015AQ.md), [evidence](validation/RM-015AQ.md). Actual visual approval pending; Q held, guide paused, RM-016 Planned.

**Latest studio layout — RM-015AP:** Design Studio uses distinct serif typography at the left of Furniture/Room/Assistant. Add piece leaves only that row; catalogue entry remains in Furniture. Count and 2D/3D live inside the frame bottom right. Both views share the same actual-column rail and editing/navigation controls, with camera-specific views retained. [Ticket](tickets/RM-015AP-align-the-studio-and-share-view-controls.md), [exact plan](commit-plans/RM-015AP.md), [evidence](validation/RM-015AP.md). Actual visual approval pending; Q held, guide paused, RM-016 Planned.

**Selected3D direction cue,20October — RM-015AO:** Only selected3D furniture shows a clear outward arrow from its local+Z front. The non-pickable indicator lives in the existing animated Piece group, following displayed movement/rotation/Undo without canonical or per-frame state. It clears with selection and is absent from exports; existing2D arrows remain. [Ticket](tickets/RM-015AO-show-selected-furniture-direction-in-3d.md), [nine-path plan](commit-plans/RM-015AO.md), [evidence](validation/RM-015AO.md). Actual visual approval pending; Q held, guide paused, RM-016 Planned.

**Latest selected furniture controls,20October — RM-015AN:** Basic properties show size preset and piece finish; exact sizes, position, ownership/preferences and independent locks are Advanced. Rotation and selected Delete live beside the room in2D/3D arrangement tools, with a shared styled Snap switch. Catalogue owns Replace. Deliberate visitor Apply size/Delete use narrow per-action overrides with unchanged stored locks, strict final checks and one Undo; assistant/ordinary starting-lock behavior remains. [Ticket](tickets/RM-015AN-simplify-selected-furniture-controls.md), [27-path plan](commit-plans/RM-015AN.md), [evidence](validation/RM-015AN.md). This supersedes AA's separate basic Unlock-size action. Actual visual approval pending; Q held, guide paused, RM-016 Planned.

**Latest owner flow,20October — RM-015AM:** Choose photos → explicit Continue → designed processing → main studio, with all room/furniture corrections in the studio. The separate rough2D review page and pre-studio shape acknowledgement are superseded. Preserve estimates/unknowns, strict reconciliation/validation, one baseline/fixed expiry, transient photo cleanup and default3D with2D available. Fake-only preview is finite and cancellable; live follows actual work without an artificial minimum. [Ticket](tickets/RM-015AM-process-photos-directly-into-the-studio.md), [24-path plan](commit-plans/RM-015AM.md), [evidence](validation/RM-015AM.md). Historical review-first decisions retain their date/evidence; actual visual approval pending, Q held, guide paused, RM-016 Planned.

**Photo control cleanup, 20 October:** Uploaded/sample thumbnails open directly without View badges; selected-photo ordering arrows are removed and Remove fills the existing row. Recognition already derives photo roles from visual evidence rather than upload order, with stable source IDs. The four-photo example batch respects the actual registry/public limit and existing atomic admission. [Y allocation](commit-plans/RM-015Y.md#photo-control-cleanup-allocation--20-october-2026) and [scoped evidence](validation/RM-015Y.md#photo-control-cleanup--20-october-2026) keep actual owner visual approval pending; Q held, guide paused, RM-016 Planned.

**Furniture capture follow-up, 20 October:** Two matching room/furniture photo animations replace the captioned single guide, with no visible explanation and one icon-only Replay action. The original opposite-corner samples now have companion bed/cabinet detail photographs, all four entering the existing preparation/viewer/explicit Continue flow. [Y allocation](commit-plans/RM-015Y.md#furniture-capture-follow-up-allocation--20-october-2026), [asset provenance](references/photo-capture-assets-2026-10-19.md#furniture-detail-additions--20-october-2026) and [actual evidence](validation/RM-015Y.md) preserve fake estimates and pending owner visual approval. Q held, guide paused, RM-016 Planned.

**Photo Continue CTA follow-up, 20 October:** The selected-photo action now says Continue and reuses the solid walnut landing CTA's global `button primary` classes and decorative arrow. Actual desktop/phone/short-laptop focus and fake drafting checks, scoped format/lint/frontend types and current limits are recorded in [Z follow-up evidence](validation/RM-015Z.md#continue-cta-follow-up--20-october-2026). Existing explicit recognition/availability/lifecycle behavior remains. Actual owner visual approval pending; Q held, guide paused, RM-016 Planned.

**Consolidated owner review:** The implementation is already committed through `65048e2` and Git was clean when the owner approved a final checkpoint. [File-level consolidation](commit-plans/RM-015-VISUAL-REVIEW-CHECKPOINT.md) records the exact five-file documentation commit and 211 already-committed feedback paths. [Visual-feedback checklist](reviews/2026-10-20-visual-feedback-checklist.md) gathers the review items. The owner will review later; actual visual approval remains pending, Q held, guide paused and RM-016 Planned. No new application changes or fresh executable verification are claimed.

**Current main-editor default:** [RM-015AL](tickets/RM-015AL-open-editor-in-3d.md), [12-path plan](commit-plans/RM-015AL.md) and [evidence](validation/RM-015AL.md) follow committedb14a407. Fresh/reset/accepted main-editor rooms open in3D through one presentation factory. Explicit recovered views/current import view, manual2D switching and rough2D photo review remain. Focused125tests, final602-test/root/both-build/current-source gates and actual fresh3D/2D recovery/photo-review→accepted3D checks passed; full12-path read-only pass1 is clean and the exact local checkpoint is prepared. Actual owner visual approval pending; Q held, guide paused, RM-016 Planned.

**Current panel-corner follow-up:** [AK allocation](commit-plans/RM-015AK.md#panel-corner-follow-up-allocation--20-october-2026) and [evidence](validation/RM-015AK.md#panel-corner-follow-up--20-october-2026) follow committed618add8. The shared outer properties panel now matches the18px room-frame radius in catalogue, inspector and assistant states. Actual desktop/short/phone scrolling and scoped CSS formatting passed. This hot-reload candidate differs from the prior production artifact; no fresh full-root/build claim. Actual visual approval remains pending; Q held, guide paused, RM-016 Planned.

**Current furniture-add correction:** [RM-015AK](tickets/RM-015AK-drag-furniture-from-the-catalogue.md), [21-path allocation](commit-plans/RM-015AK.md) and [actual evidence](validation/RM-015AK.md) follow committed25135b7. Drag catalogue furniture into2D or3D with validated previews and one Add/Undo. Select/click/keyboard alternatives use the same authority; exact fields remain Advanced. Work area opens desk choices until a desk exists. Actual desktop/short/phone observations, focused62tests and final599-test/root/both-build/current-source gates passed; final21-path read-only pass2 is clean and the exact local checkpoint is prepared. Actual owner visual approval remains pending; Q held, guide paused, RM-016 Planned.

**Prior proposal/toast correction:** [RM-015AJ](tickets/RM-015AJ-keep-proposal-decisions-in-chat.md), [15-path allocation](commit-plans/RM-015AJ.md) and [actual evidence](validation/RM-015AJ.md) follow committed575d907. Proposal decisions now belong to their matching assistant message; old messages cannot resolve a replacement. Visitor palettes keep their existing controls. One owned4s notice timer clears presentation only and retires across lifecycle changes. Focused52tests and final586-test/root/both-build/current217-file source gates passed; native desktop/short/phone and Apply/Cancel/Undo inspected. Read-only pass1 is clean and exact local checkpoint prepared; actual visual approval pending, Q held, guide paused, RM-016 Planned.

**Current Undo/Project glass follow-up:** The AD–AI batch is committed133e154. Latest screenshot asks both header controls to reuse glass-control. [AI ticket](tickets/RM-015AI-simplify-editor-tool-navigation.md), [eight-path follow-up plan](commit-plans/RM-015AI.md#header-glass-follow-up-allocation-20-october2026) and [actual evidence](validation/RM-015AI.md) record shared styling, preserved disabled/disclosure behavior, desktop/phone/short observations and scoped format/lint/frontend types. Prior full578-test/build evidence remains historical for this class-only correction; current hot-reload source differs from that production artifact. Actual visual approval pending; Q held, guide paused, RM-016 Planned.

**Current settled queued edits:** [RM-015AD–AI batch evidence](validation/RM-015AD-AI.md) and [exact70-path checkpoint plan](commit-plans/RM-015AD-AI-CHECKPOINT.md) follow committed AC42b400a. All queued finishes/photo estimates, shared glass, browser icon,2D rotation/direction, horizontal interior dragging and tool-row cleanup are implemented. Native desktop/narrow/focus/edit/export observations are recorded. The queue finished before one settled578-test/root/both-build gate; current216-file source/BUILD_ID matches and full-scope read-only pass1 is clean. GLB/OBJ downloads and all4PDF pages inspected. Exact local checkpoint prepared; actual owner visual approval remains pending, Q held, guide paused, RM-016 Planned. Owner requests no questions while sleeping. Individual receipts preserve historical test timing and explicit unperformed external/device/full-matrix limits.

**Current temporary comparison pause:** [RM-015AC](tickets/RM-015AC-temporarily-hide-room-comparison.md), [14-path plan](commit-plans/RM-015AC.md) and [evidence](validation/RM-015AC.md) follow committed AB6db513e. Before/Current controls are hidden for now; full comparison/baseline/import/export implementation remains. Editor stays Current; the existing last tour step points to Undo. Actual visual approval pending, Q held, guide paused, RM-016 Planned.


**Current editor-height correction:** [RM-015AB](tickets/RM-015AB-fill-the-editor-working-height.md), [16-path plan](commit-plans/RM-015AB.md) and [evidence](validation/RM-015AB.md) follow committed AA/a8f1c02. Owner removes under-frame boilerplate and gives the frame/left controls the full available working height. Accessible descriptions and actual Checks/properties/errors remain; sole hot reload4320/private4321. Actual visual approval pending, Q held, guide paused and RM-016 Planned.


**Current furniture-size feedback:** [RM-015AA](tickets/RM-015AA-add-useful-furniture-size-presets.md), [24-path plan](commit-plans/RM-015AA.md), [primary research](references/furniture-sizes-2026-10-19.md) and [evidence](validation/RM-015AA.md) follow committed Z59dae0a. Owner selects Single/Queen/King and other useful sizing shortcuts. Regional bed dimensions distinguish mattress/frame; common adjustable desk/wardrobe/shelf presets and custom values use shared estimate/lock/spatial/Undo authority. Actual visual approval remains pending; Q held, guide paused, RM-016 Planned.

**Current photo simplification:** [RM-015Z](tickets/RM-015Z-simplify-photo-intake-and-infer-photo-roles.md), [27-path plan](commit-plans/RM-015Z.md) and [evidence](validation/RM-015Z.md) follow committed Y27b0130. Latest owner selects concise matched cards and automatic photo understanding: no visitor type selector, retained animated guide/gallery/viewer, one explicit Draft beside prepared uploads. Bounded source classification protects uncertain room scale. Actual owner visual acceptance remains pending; Q held and RM-016 Planned.

**Brand:** Roomedy · **Selected domain:** tryroomedy.com  
**Prepared:** 17 October 2026 · Africa/Cairo  
**Stage:** AD–AI locally validated578tests/root/both builds/current source; clean read-only pass1 and exact local checkpoint prepared; actual owner visual approval pending, Q held, guide paused and RM-016 Planned
**Visual companion:** [Roomedy overview](ROOMEDY_OVERVIEW.html)  
**Documentation map:** [Start here](README.md)

**Prior landing steering, 19 October:** A–K are committed. Owner-selected [RM-015L](tickets/RM-015L-create-a-scroll-driven-furniture-landing.md) replaces the rejected small landing with an assembling/rotating/opening furniture room, richer workflow/value and the preserved palette/mark/dot plus matching beige icons/centered footer. [L evidence](validation/RM-015L.md) records404tests/root/builds and the historical182-input Windows review and exact limits. Continue the actual visual session; approval remains pending and RM-016 has not started.

**18 October checkpoint:** the approved numeric fake/paid-off loop has committed RM-001–RM-014; `2e27f79` prepared release files with Linux/hosted/live proof explicitly pending. RM-015 has actual nine-size/interaction/measurement evidence, scoped numeric-error and summary fixes, and a passing346-test/seven-boundary/root/build gate. Read-only pass1 found no new actionable findings. The owner explicitly withheld visual approval and separately authorized the [exact15-file checkpoint plan and local commit](commit-plans/RM-015.md). This preserves current work; it does not complete RM-015 or resolve the [actual visual gate](design/visual-review.md). The guide goal stays paused and RM-016 stays Planned. [Performance evidence](design/performance.md) retains its limits. No paid calls, deployment, push, reset consumption or delegation; stop at review gates or0% usage. Approved PR-01–PR-15/O-01–O-03 requirements remain current.

**Historical local result record:** [RM-003 checks](validation/RM-003.md) passed 84 tests, six boundary cases, exact assets and both builds. The read-only review found no actionable source issues. RM-003 is committed as `bc349f5`; RM-004 as `bd0bf78`. [RM-004 checks](validation/RM-004.md) establish the earthy landing baseline. [RM-005 checks](validation/RM-005.md) establish the canonical session and working precision 2D editor with 112 tests and final gates passed; it is committed as `85c7362`. RM-006 is committed as `f73ce2e`. RM-007 is committed as `d1d8c30` after147-test/root/browser validation. [RM-008 checks](validation/RM-008.md) establish finite shared admission/private bounded transport with170 tests, final root/build gates and read-only pass2 passed. It is committed as `3e6d4c1`. [RM-009 evidence](validation/RM-009.md) establishes bounded deterministic search/application scope with190 tests, all root/build gates, final native quality/health measurements and clean read-only pass3. It is committed as `bfd9e6d`. [RM-010 evidence](validation/RM-010.md) records admitted fake recognition, bounded pixel decode and correction-safe2D review with235 tests, all root/build gates and read-only pass3 passed. RM-010 is committed as `526a6b3`. [RM-011 evidence](validation/RM-011.md) records the grounded scoped assistant, actual worker/fake HTTP and coherent reviewed proposals with274 tests, all root/build gates and clean read-only pass1. RM-011 is committed as `7580870`. [RM-012 evidence](validation/RM-012.md) records same-scale comparison, fixed two-hour semantic tab recovery, safe project import/export and cleanup with314 tests, all root/build gates and clean read-only pass3. Exact RM-012 commit is next before RM-013; model/challenge/hosted/physical/owner evidence stays separately scoped. Earlier in-progress statements below describe historical checkpoints.

**Step-five deliverable:** [Detailed ticket plan and dependency queue](tickets/README.md). The owner approved the updated plan/guidelines, completed RM-000, then explicitly authorized ordered fake-mode execution/validation and local commits after each ticket. RM-001 is implemented locally; hosted CI is unverified; required review gates, no paid calls/deployment and a 0% remaining Codex usage cutoff apply.

**Build guidelines:** [Lessons from the four owner-referenced feedback chats](references/LESSONS_FROM_VISUAL_FEEDBACK.md), [feature/review checklist](design/REVIEW_CHECKLIST.md) and [repository instructions](../AGENTS.md). Apply them during the owning feature, before the final visual/quality/security passes.

Roomedy helps someone furnish an empty room or make the furniture they already own work better. The visitor sees one editable room in a precise 2D plan and an approachable 3D cutaway, changes it directly, or asks an assistant to prepare a change. Geometry, confirmed measurements and the visitor's constraints determine what can actually fit.

> Keep my bed and wardrobe. Put the desk near the window and give me more room to pull out the chair.

The important outcome is a room arrangement the visitor can inspect, apply, adjust and undo. A generated before/after image would not establish the product's central promise.

This document replaces the initial draft as the current specification for discussion. The [original Markdown](drafts/2026-10-17/ROOMEDY.md) and [original HTML](drafts/2026-10-17/ROOMEDY_OVERVIEW.html) remain as source history. The RM-001 foundation is implemented locally. RM-002 now supplies the dimensioned catalogue, local prepared assets and authored fixtures. The AI integration and layout engine remain future tickets. The companion is an offline scripted SVG concept, with a few illustrative checks; it is neither a React Three Fiber build nor live AI evidence.

## Owner-requested pre-review expansion — 19 October 2026

Latest direct owner instruction authorizes planning and executing all ten requested todos before our joint visual session, using execute → read-only validate → independently verify/fix → revalidate until no actionable findings, then continue. This supersedes the prior stop for this specific revision round; visual approval has not been supplied. The new lettered queue RM-015A–J precedes RM-016. Existing historical statements that direct 3D editing/interior viewing were deferred describe the earlier release selection; they do not veto this newly selected work.

Selected additions: motion-first UI; dimensional animated hero; continuous camera travel and eye-level interior exploration; close-up model/material/lighting quality; direct floor-plane 3D editing through the shared authority; broader conversational spatial/style assistance; useful fake/sample full flows with real computed edits; removal of redundant demo/development commentary; permanent active-motion rules; current integrated evidence and review preparation. See [the ordered queue](tickets/README.md#owner-requested-pre-review-queue--19-october-2026) and [motion/product-language policy](design/motion.md).

No extra per-ticket plan/visual pause is required inside this expressly authorized loop. Each packet needs scoped checks and clean read-only validation before the next. The actual joint visual result gate remains pending after J; RM-016–020 retain their separate conditions. Paid/live requests, deployment, push, reset-credit consumption and delegation remain unauthorized. External live-model quality/device/Linux/hosted evidence stays pending; prepare and test every locally possible path.

## Contents

1. [Authority, status and decisions](#1-authority-status-and-decisions)
2. [Product promise and scope](#2-product-promise-and-scope)
3. [Reference repos: inspected evidence](#3-reference-repos-inspected-evidence)
4. [Landing and guest entry](#4-landing-and-guest-entry)
5. [The complete visitor journeys](#5-the-complete-visitor-journeys)
6. [Intake and measurement confidence](#6-intake-and-measurement-confidence)
7. [Workspace and manual editing](#7-workspace-and-manual-editing)
8. [Room document and coordinate contract](#8-room-document-and-coordinate-contract)
9. [Commands, previews, Apply and Undo](#9-commands-previews-apply-and-undo)
10. [Geometry and layout generation](#10-geometry-and-layout-generation)
11. [Assistant behavior and tools](#11-assistant-behavior-and-tools)
12. [Worked scenarios](#12-worked-scenarios)
13. [Furniture and asset pipeline](#13-furniture-and-asset-pipeline)
14. [Architecture and dependency boundaries](#14-architecture-and-dependency-boundaries)
15. [Proposed repository structure](#15-proposed-repository-structure)
16. [API and provider contracts](#16-api-and-provider-contracts)
17. [Guest lifecycle and privacy](#17-guest-lifecycle-and-privacy)
18. [Bounds, concurrency and costs](#18-bounds-concurrency-and-costs)
19. [Visual direction and accessibility](#19-visual-direction-and-accessibility)
20. [Failure and recovery](#20-failure-and-recovery)
21. [Security and diagnostics](#21-security-and-diagnostics)
22. [Local engineering conventions](#22-local-engineering-conventions)
23. [Deployment preparation](#23-deployment-preparation)
24. [Testing and acceptance evidence](#24-testing-and-acceptance-evidence)
25. [Delivery sequence](#25-delivery-sequence)
26. [Decision register](#26-decision-register)
27. [Primary research and source register](#27-primary-research-and-source-register)
28. [Documentation verification](#28-documentation-verification)

## 1. Authority, status and decisions

### 1.1 What this document owns

Use the latest explicit owner instruction first, this blueprint second, then an approved scoped implementation packet. The [ticket queue](tickets/README.md) and feedback guidelines are now owner-approved; the subsequent step-seven request separately authorizes ordered local fake-mode implementation and commits. Reference repos and archived drafts supply evidence and context; they do not transfer product scope, credentials, account approvals or release acceptance. The owner accepted the step-three product recommendations with prices and budget planning deferred; section 26 records that selection and the engineering/verification work still outstanding.

The root README owns the short public story. This document owns product behavior, architecture recommendations and open choices. The HTML owns the readable product summary. App/package READMEs will own actual setup and focused verification when implemented. Root `AGENTS.md` owns concise operating instructions, current RM-001 commands and directions to the feedback lessons/checklist. Update the narrowest owning document rather than maintaining several competing specifications. This follows the documentation ownership rules actually read in all four siblings [CB-1, SP-1, RS-1, RT-1].

### 1.2 Decision vocabulary

| Label | Meaning in this blueprint |
| --- | --- |
| Established direction | Explicit in the supplied Roomedy materials; retained here without claiming a new owner approval |
| Owner-selected scope | Directly accepted by the owner in this chat; implementation and visual verification remain separate |
| Recommended baseline | A concrete proposal derived from the product and reference inspection; can be changed at product review |
| Open decision | The supplied material does not settle it; a recommendation is not an owner's answer |
| Evidence required | Needs implementation, tests, assets, provider access, measurements or hosted verification |

**Established direction:** Roomedy and tryroomedy.com; a landing page and guest demo; empty, partly furnished and existing-room journeys; editable 2D/3D; manual and assistant operation; honest dimensions; reviewable, reversible assistant changes; one detailed Markdown and a companion HTML.

**Owner-confirmed review sequence, 17 October 2026:** initial photo review uses a rough, editable **2D sketch only**. The visitor corrects the sketch and reviews measurements before entering the main editor. **3D becomes available only in the main editor.** This clarification applies to all uploaded-room starting conditions; it does not remove either view from the main editor.

**Owner-selected first-release product, 17 October 2026:** rectangular bedroom/workspace combinations; an oat/sand/beige/walnut/cocoa website palette with earthy wood tones, optional neutral black/white studio chrome and polished stylized furniture; similar supported models at reviewed dimensions; precision placement in 2D and 3D orbit/selection/inspection; one proposal at a time plus a bounded read-only Before/Current peek; samples/photos/typed dimensions; two-hour local semantic-room recovery and export/import, with raw photos transient. Guided sketch correction, visual ownership/goal/style cards, contextual assistant actions, explanatory previews and the sketch-to-studio transition are included. Furniture prices and visitor budget planning are explicitly deferred.

**Recommended baseline:** a rectangular single-room first release, a small curated/procedural catalogue, Next.js/React/TypeScript, a separate Express API, shared browser-safe contracts and a pure spatial engine, browser-owned guest state, server-side GPT integration, and two Cloud Run application services when deployment is authorized.

**Evidence required:** remaining application behavior and all amended contract checks. RM-001/002 have dated local evidence; unfinished RM-003 has no final validation. Recognition accuracy, complete geometric reliability, solver quality, device performance, provider latency/cost, domain and hosted outcomes remain unverified.

The owner's product decision was: “ok let's leave prices and budget planning out for now. use your recommendations for the rest and update the docs.” This accepted the reviewed product recommendation set and documentation update. The later step-five instruction separately authorized detailed ticket creation using actual reference repos and explicitly prohibited implementation. Neither instruction grants local Git staging/commits, paid calls or publication. Build progress preserves both scopes; visual acceptance still requires a later review of the implemented interface.

**Approved engineering refinement, 17 October 2026:** the owner said: “ok i approve the recommendations. update the docs and tickets, then resume RM-003 and continue in order. use fake mode, validate and commit each ticket, and stop at review gates or 0% usage. no paid calls or deployment.” Source: `human:current-chat/2026-10-17/approve-review-and-resume-ordered-build`. This adopts PR-01–PR-15 and the stated O dispositions into the existing packets. It does not approve actual visual results, select future security findings, authorize external work or retroactively verify amended requirements.

## 2. Product promise and scope

### 2.1 Audience and value

The primary visitor is a renter or someone working with a small room: a bedroom that also needs a desk, storage and usable circulation. They may have an empty space, a few pieces they want to keep, or a room that feels awkward despite already being furnished. A second audience is a potential client evaluating spatial interaction, visual editor engineering and useful AI integration.

The visitor should be able to try a supplied room, make one meaningful change, understand what was checked and undo it during a short visit. Photos reduce setup work; they do not remove the need to confirm fit-critical measurements. The assistant should operate the same editor the visitor sees.

### 2.2 The portfolio distinction

ClipBuilder demonstrates media processing, ScreenPilot a live voice workflow, Retrosum evidence-backed document analysis, and Retailor AI-assisted commerce with connected views. Roomedy contributes synchronized spatial views, furniture manipulation, geometry-based constraints and reversible multi-object operations. Reuse their engineering backbone without copying their brands or unrelated features.

### 2.3 Scope boundaries

| Baseline direction | Deliberately later or outside this demo |
| --- | --- |
| One rectangular bedroom/workspace; quarter-turn rotations as the engineering baseline | Additional room categories/shapes, multi-room buildings, arbitrary polygons, slopes and complete CAD |
| Samples, room photos, explicit dimensions and furniture inventory | Native phone scanning, AR capture and exact arbitrary furniture reconstruction |
| Bed, desk, chair, wardrobe and a small set of coherent additions | An unbounded marketplace or runtime downloads of arbitrary models |
| Fit/access checks with visible assumptions | Claims of professional construction, accessibility or building-code compliance |
| A guest workspace with fixed two-hour semantic-room recovery and project export/import | Mandatory accounts, persistent raw photos, a server database, durable project library or background queue |
| One proposal and a read-only starting-layout comparison | Multiple alternative layouts, furniture prices, visitor budgets, retail sourcing or checkout |
| Supported layout and appearance changes | Structural renovations, unsupported furniture mechanisms or guaranteed optimal designs |
| Real configured AI for deliberate public assistant/recognition actions | Scripted output presented as live AI, silent fake fallback, or AI calls on every drag |

Dimensioned floor-plan images/PDFs, multiple alternative layouts, furniture prices and visitor budget planning are deferred beyond this first release. Do not show price fields, cost totals, budget questions, affordability filters or shopping CTAs. Internal provider/cloud spend controls remain required and are separate from the deferred visitor-facing budget feature.

### 2.4 Product principles

1. Keep a complete guest story understandable and short.
2. Treat empty rooms as a normal starting point, not an exception.
3. Make photo interpretation a correctable draft.
4. Preserve measurement provenance and uncertainty.
5. Drive every view and action from one canonical room document.
6. Respect retained furniture, independently locked dimensions and position locks.
7. Show compromises through specific facts, not a mysterious room score.
8. Separate proposals from committed changes.
9. Preserve the visitor's work when a request fails or becomes stale.
10. Label documentation illustrations, development fixtures and live behavior accurately.

## 3. Reference repos: inspected evidence

### 3.1 Inspection scope and limits

On 17 October 2026 the four local reference checkouts were inspected read-only: `C:/Users/minat/Work/ClipBuilder`, `C:/Users/minat/Work/screen-pilot`, `C:/Users/minat/Work/Retrosum` and `C:/Users/minat/Work/Retailor`. Inspection included root guidance, manifests, READMEs, existing documentation indexes where present, reusable lessons, representative frontend state, backend factories/startup, contracts and Docker/deployment files. File links and inspected responsibilities are listed in section 27.

No sibling source, environment file, private upload or running service was changed. No sibling app, provider request or deployment was run. Sandbox access did not permit reading sibling Git metadata through Git, so these are dated working-tree observations, not claims tied to a verified clean commit. ScreenPilot has no `docs/README.md` in the inspected checkout; its root README and source-of-truth links provide the map. Some sibling indexes retain historical status text; current code and explicit operating guidance were compared rather than treating every old note as current truth. Step five additionally inspected real ticket indexes and representative packets from all four siblings; the [ticket-structure source table](tickets/README.md#reference-ticket-structures-actually-inspected) records exact files and adopted patterns without transferring their checked acceptance or approvals.

### 3.2 What each reference actually contributes

| Reference | Observed implementation | Roomedy application | Do not inherit |
| --- | --- | --- | --- |
| ClipBuilder | Next frontend, Express backend, `contracts`, separate `composition` package and a specialized private renderer; inert app factory and explicit startup; revision-aware frontend reducer; multi-stage non-root Docker builds [CB-1–CB-4] | Thin application entry points, shared contracts, one state authority, bounded operations, truthful release evidence | Its Gemini choice, video renderer, GCS media lifecycle, no-editor product restriction or project-specific approval flags |
| ScreenPilot | Next frontend, Express API, browser-safe contract subpaths; explicit provider adapters; one demo reducer; allow-listed session projection; injected capacity guards and server-side failures [SP-1–SP-4] | Feature-owned UI/effects, deterministic fake providers, cleanup, safe errors and independently testable HTTP use cases | Voice/WebRTC, interview entities, CV limits, hiring policy or the exact port pair |
| Retrosum | `contracts` plus a pure `money` package; frontend controller issues revision-bound commands and generation tokens; Next fixed server bridge; Express app and explicit server composition; browser-only recovery [RS-1–RS-5] | A pure `spatial` package used by browser and API; one room controller; late-response protection; preview/Apply/Undo; bounded guest recovery | Financial rules, USD/FX, stored PDFs, monetary reservations or historical live signoff flags. Roomedy's two-hour lifetime comes from its owner's later choice, not inherited sibling approval. |
| Retailor | Narrow contract subpaths and pure `commerce`; frontend controller with reviewed actions; fixed Next operation bridge; backend Responses transport with retries disabled and bounded response reading; private API and pinned non-root images [RT-1–RT-5] | Catalogue identity, visual choices, useful chat cards, guarded previews, explicit provider transport, exact release inputs | Stripe, stock/orders, optional logos, clothing/photo restrictions, its owner's account setup or every retained legacy abstraction |

### 3.3 Architecture recommendation after inspection

The draft proposed putting the whole API in Next Route Handlers. All four inspected examples instead separate a public Next application from an Express API, using shared contracts. Retrosum and Retailor add a pure domain package that both applications consume. That is the recommended Roomedy backbone: `apps/frontend`, `apps/backend`, `packages/contracts`, `packages/spatial`.

The dedicated API has a concrete job: photo preparation, provider orchestration, admission, bounded tool execution and server-side spatial validation. Next Route Handlers remain a small same-origin bridge with fixed operations. They do not duplicate business rules or expose an arbitrary upstream proxy. This documented engineering baseline supports the selected product scope; exact dependency/configuration choices and actual deployment verification remain later work.

Roomedy requires no renderer service: its interactive 3D is browser-side. It requires no finance package: its shared deterministic authority is geometry. It requires no permanent photo bucket for the recommended transient photo workflow. Cloud Run, IAM and Secret Manager can follow the sibling delivery pattern without copying project IDs, credentials, budgets or authorization. See sections 14–18 and 23.

## 4. Landing and guest entry

### 4.1 First viewport

Current19October owner revision [RM-015M](tickets/RM-015M-integrate-landing-content-into-the-room.md) asks the room to cover the entire landing, with text smoothly integrated into it, and fixes initial-load stutter. It supersedes L's adjacent desktop/compact narrow scene layout while retaining camera/wall animation and adding purposeful furniture slides/turns from an awkward grounded layout into a window-side workspace and open center. Preserve the liked warm translucent text-card backgrounds and internal decorative rules; feather only their outer seams. Keep the selected earthy palette, exact Roomedy mark/wordmark and brown dot. The former Sample/Preview/Apply/Undo marketing card stays retired; real editing controls remain in the studio.

Use one full-viewport scene behind hero, workflow, motivation, closing CTA and centered footer, with readable semantic copy/actions composed inside that shared space. Camera/room framing and restrained text drift follow normal reversible scrolling. No separate miniature strip, opaque dashboard cards, hijacked scroll or motion-off controls. Preserve the first-fold Start designing action on phone/short layouts. Marketing art never becomes a personal-photo reconstruction or editor/session initialization; photos continue through processing into the editable studio under RM-015AM.

Research uses official examples/sources in [the landing register](references/landing-research-2026-10-19.md). Any motivating statistic needs correct population/context and direct attribution; no invented3D-designer adoption, visitor totals, savings, endorsements or feature equivalence. Professional tools and free competitor tiers do not establish Roomedy pricing. Use actual browser/no-account/use-owned-pieces value instead. Center the footer logo and remove the domain text. Matching browser/search/Apple icons use the existing vector mark on solid token beige, never white/transparent. Local metadata/assets prepare eligibility; Google crawl/display is external, not guaranteed.

The landing may initialize its own bounded client-loaded Three/R3F scene and reuse existing finite furniture/surface definitions, but never the editor controller, session or provider. Latest [RM-015N](tickets/RM-015N-refine-landing-glass-and-scroll-navigation.md) removes the owner-rejected flat SVG starting room: readable content and warm ambient background remain during loading/graphics failure, then only the actual3D room is revealed. Prepare a bounded physical glass environment/transmission pass and a genuine window aperture without external assets. Upload/compile/warm the finite scene and exact initial pose before revealing the moving canvas; no arbitrary delay. Ready entrances settle within five seconds; scroll-driven choreography follows the visitor without hijacking scroll or suppressing motion. Dispose owned resources/listeners/frames and keep performance evidence scenario-specific. Actual owner visual approval and later quality/security/external checkpoints remain separate.

Section actions keep the URL clean and animate through a finite interruptible journey; incoming legacy fragments are cleaned with framework history state retained. Manual wheel/touch scroll stays native. How it works has a beige animated hover/focus underline, and the hero uses a generous circular-arrow Explore the room cue. Remove exact No account needed. copy from the landing and entry; no change to account-free access. Preserve liked warm text backgrounds/feathered edges, not the rejected flat initial furnishings.

Latest [RM-015O](tickets/RM-015O-create-a-warm-photographic-landing-background.md) replaces the empty flat landing backdrop with owner-selected warm interior photography + textures. Two verified free photographs, four locally optimized responsive crops, warm wood/linen/plaster atmosphere and daylight/shadow gradients sit behind the prominent animated room. Keep the liked translucent text treatment/feathered seams, N glass/navigation/cue and original palette/brand; no gallery, filler copy, shop features or competing initial SVG preview. Photographs are decorative inspiration, not visitor-room reconstruction. Reuse the existing bounded scroll measurement for crossfade/translation; no new scene resources, animation loop, canonical writes or external runtime image service. Source/licence/bytes live in [research](references/landing-background-research-2026-10-19.md) and [asset provenance](../apps/frontend/public/landing/LICENSES.md). Actual result approval remains separate.

Latest [P](tickets/RM-015P-restore-smooth-landing-scrolling.md) supersedes O's two-photo/filter/mask/crossfade implementation after the owner reports substantial lag. Retain warm licensed oak/linen photography as one responsive layer, leaf-only parallax and viewport-sized static light; keep the liked chapter shading and3D choreography. Batch geometry reads before cached style writes. Retain actual GPU preparation with a shorter220ms reveal and low-priority decorative photo; center the whole Explore the room group across the hero in normal flow. Earlier callback timings do not establish compositing/physical smoothness. The owner's restrained dynamic warm light/shadow request is recorded in [Q](tickets/RM-015Q-add-restrained-warm-room-lighting.md), held until performance correction/feedback. No animation suppression or new app ports. Latest P follow-ups strengthen cue contrast above chapter shading and add frosted glass only to the small header CTA. Hero copy/cue fade on actual ready or graphics failure (360ms), with focus/no-JS fallback and always available header; no fixed delay or instant-WebGL promise.

### 4.2 Progressive entry

`/` is the landing and `/demo` is the recommended guest workspace route. Inside entry, first choose **Use a sample room** or **Add my room**. Then establish whether it is empty, partly furnished or already furnished. These are separate decisions; six competing hero CTAs would make the first step harder.

Manual room setup opens the main editor with authored dimensions and a purposeful starting arrangement. Photo entry prepares selected photos locally, then explicit Continue opens the processing page and a validated result enters the same studio directly. Correct measurements, walls/openings and furniture in its synchronized3D/2D views. Preserve progress when switching relevant panels.

If live AI is unavailable, the supplied sample and manual editor should still be useful. The assistant can explain its current availability. A public failure must not quietly replace the provider response with a scripted success. Development fixtures use an explicit simulation label.

W lifts the short orientation to accepted-editor scope. Fresh manual and accepted-photo rooms offer a welcome immediately after hydration, with Start/Skip and one Quick tour replay; recovered/imported work stays uninterrupted through existing flags, without new persistent state. Three actual targets, measured responsive placement, existing finite cubic scrolling, synchronized fade/reveal and bounded target/ancestor-motion readiness preserve room/history/proposal/drafts. [W plan](commit-plans/RM-015W.md), [Retailor comparison](references/retailor-tour-2026-10-19.md) and [receipt](validation/RM-015W.md) distinguish actual local evidence from pending browser input/paint/owner approval. Q held, guide paused and RM-016 Planned.

V makes Corner the diagonally opposite corner from the nearest corner of the recorded doorway, sharing Doorway’s relevant-door selection. Ties are deterministic; unknown/invalid anchors remain unavailable, and obstacle fallback stays in the intended opposite quadrant. Existing camera flight and live comparison continuity remain; no semantic data or renderer change. [V plan](commit-plans/RM-015V.md) and [evidence](validation/RM-015V.md) distinguish current pure/code/CPU results from pending native T/U/V interaction and owner visual checks. Q remains held and RM-016 Planned.

U adds direct same-wall window placement in the main editor's 2D/3D views: clamped integer offset, matching glass/aperture preview, canonical/displayed grab identity, one shared command/Undo and estimated visitor-planned offset. Other recorded facts and baseline remain intact. Arrange room is the existing 3D edit mode for furniture and windows; no extra mode or renderer. [U plan](commit-plans/RM-015U.md) and [evidence](validation/RM-015U.md) preserve actual browser/performance limitations while native control is stalled. V implements the selected opposite-doorway Corner; overall visual gate remains pending.

T supersedes the old sample/my-room entry split. Build manually selects empty/partial/furnished presets and opens the editor. Upload photos opens photo preparation directly, then rough 2D correction and accepted 2D/3D. Optional local example photos in fake mode use ordinary decoding/admission/drafting; measurements remain reviewable estimates. Deliberate fresh choices preserve recovered accepted work until an explicit replacement decision, while refresh keeps ordinary recovery. [T plan](commit-plans/RM-015T.md) and [evidence](validation/RM-015T.md) own current implementation/checks and browser limits. U windows and V opposite-door Corner follow; actual visual approval remains pending.

RM-015S editor correction: footprint-aware outward furniture drags clamp to feasible walls/corners in both2D/3D, captured release commits one validated command/Undo, and unknown/impossible dimensions retain honest validation. New furniture defaults to unlocked position/rotation and locked dimensions; explicit imported/restored/user locks stay authoritative. Routine confirmations are accessible but outside layout; genuine failures overlay without shrinking the frame. View names are2D/3D, studio header transparent, furniture inspector basic plus Advanced, warm panel typography, and matching Export/Import row separated from Reset. [S evidence](validation/RM-015S.md) owns current local checks; actual owner approval remains pending. T photo/manual separation, U wall-constrained windows and V door-relative Corner follow before held Q; RM-016 Planned.

Current demo-space correction [R](tickets/RM-015R-fill-demo-flow-with-useful-adaptive-content.md) supersedes K’s small top-aligned entry after direct owner feedback. Use available width and height for larger relevant source/condition previews derived from the actual authored fixtures, without a new controller or visitor measurement claims. A single static locally licensed warm bedroom backdrop persists across the demo; no landing house, parallax, photo filter/blur or new asset. Empty upload uses working height, prepared photos release that space, and action cards keep natural content height. Existing rough 2D correction and room-first 2D/3D studio preserve neutral readable task surfaces and all shared state/provenance/commands. Actual screen-size, functional and build evidence belongs to [R](validation/RM-015R.md); actual visual acceptance stays pending and Q lighting remains held.

## 5. The complete visitor journeys

### 5.1 Sample room: the shortest complete story

1. Select **Try the demo**, then a supplied room.
2. Inspect a ready 2D plan or 3D cutaway with supplied dimensions.
3. See the bed, desk, chair and wardrobe, their ownership and any locks.
4. Choose a suggested request or type a goal, such as moving the work area near the window.
5. See a proposal with affected objects, relevant checks and remaining unknowns.
6. Apply the whole change, or cancel without changing the room.
7. Make a manual adjustment and ask the assistant about the updated scene.
8. Compare Before/Current, undo a complete instruction and export the project if desired.

Samples are authored fictional room records, available for manual use before any AI call. Their geometry must be independently checked when implemented. A sample can intentionally illustrate an access problem, but its baseline issues must be disclosed. Deliberate assistant actions in an eventual live public demo use the configured real provider. Selection alone should not dispatch a paid request.

### 5.2 Empty room from photos

1. Select bounded room/furniture photos with local previews and the illustrated capture guide. Selection prepares inputs only; no provider dispatch.
2. Explicit **Continue** discloses the actual live transfer and opens a dedicated processing page with selected thumbnails, truthful stages and Cancel.
3. One strict admitted operation prepares a validated planning room, then opens the main studio directly in3D. There is no separate rough-draft page or shape-acknowledgement gate.
4. Correct room measurements, openings, inventory and starting condition in the studio. Unknown and estimated values remain so until each explicit confirmation; graphics fallback dimensions are never physical measurements.
5. Choose essential furniture and goals, edit in2D/3D or ask for a bounded reviewed assistant proposal, then Apply/Cancel/Undo/export through the shared authority.

A finite2800ms simulated preview makes the processing design reviewable only when the app selects fake mode and the response is simulated. Live work has no artificial minimum or fabricated percentage. Cancel/failure returns to the selected photos, while expiry/reset/unmount fence late requests and the owned preview wait.

### 5.3 Partly furnished room

Photo processing opens the same studio with supported observed pieces at honest per-value estimates/unknowns, existing ownership and independent locks. Confirm real outer sizes and correct missing/extra pieces, room features, condition and finishes there. The solver cannot shrink owned furniture to make a proposal fit. Retained/proposed identity and explicit replacement remain distinct.

### 5.4 Existing furnished room

Use the studio inventory/properties to keep, replace or remove pieces from the plan, correct poses/measurements and choose the rearrangement goal. Existing baseline collisions and uncertain checks survive admission; they are useful facts to resolve, not transport failures or permission for a worse proposal. Manual and assistant changes share final validation and whole-change Undo. Removing a piece is a planning choice, not a disposal instruction.

### 5.5 Direct editing without successful photo processing

If recognition is unavailable or fails, keep selected photos and useful preparation in the current tab, with concise retry information. Room choices retains the manual empty/partial/furnished path into the same studio. Do not claim manual work was inferred, dispatch automatically or silently fall back from unavailable live mode to fake results.

### 5.6 How photos become an editable room

Current selected transformation is **photos → explicit Continue → processing → one validated planning room → studio with synchronized3D/2D and in-studio correction**. This20October AM direction supersedes the dated review-first decisions. The loading artwork illustrates processing; it is neither a reconstructed preview nor a second3D renderer.

| Step | Application authority | Visitor experience |
| --- | --- | --- |
| Select | Existing bounded PhotoStore/decode/transient URL owner | Local previews, Remove/direct viewer and capture drawings; no request |
| Process | One existing strict/stateless admitted recognition request; identity/revision/deadline fences | Dedicated warm loading composition, actual thumbnails/stage and Cancel |
| Prepare | Existing pure role/evidence reconciliation and structural/catalogue validation; no confirmed inference | A valid supported planning projection; unresolved observations stay contextual |
| Open studio | SessionController accepts once, captures baseline, preserves fixed expiry and releases photos | Default3D with2D available, no separate review/acceptance page |
| Correct and refine | Existing room/furniture/feature/intent/finish commands, locks, checks and whole Undo | Editable dimensions, condition, inventory, openings and layout in the studio |

The canonical rectangle is the supported planning frame, not proof that a photographed shape was rectangular. Unknown/unsupported outlines and unmapped observation labels remain bounded transient Room-panel notes. Dismissing notes does not confirm measurements. Notes clear on reset/import/recovery/expiry/disposal and do not enter project/recovery schemas; raw photos remain transient. Per-value provenance, estimated pose and unresolved checks remain in the accepted semantic document and its exports.

A photographed piece becomes an app-owned identity with supported catalogue representation, independent true dimensions, pose, ownership and locks. No mesh size or inferred perspective becomes confirmed measurement. The same canonical room drives both views and assistant snapshots. Room corrections do not silently rescale deliberately placed pieces; new changes use the shared command authority and preserve the baseline.

The bounded observation/group/role adapter and its correction/merge/split algorithms remain internally tested for reconciliation, including repeated views versus similar distinct pieces. They no longer require a visitor-facing draft page. Unsupported/incomplete but useful observations stay usable through contextual studio notes and manual correction; invalid structured responses remain safe failures. O-01 stays an adapter seam without model/GPU downloads or benchmarking. Actual real-provider quality/device/Linux/hosted evidence remains separate from authored fake examples and local checks.

## 6. Intake and measurement confidence

### 6.1 Accepted inputs and deliberate choices

| Input | Intended use | Treatment |
| --- | --- | --- |
| Authored sample | Immediate complete guest story | Supplied fictional dimensions; known source and disclosed assumptions |
| Room photos | Visible inventory, appearance and feature drafting | Reviewable estimates; multiple views do not certify metric geometry |
| Furniture photos | Identify a category and similar supported representation | Confirm physical dimensions; do not promise exact reconstruction |
| Typed dimensions | Correct a room, object or opening | Contextual labels and unit conversion; explicit confirmation |
| Specification image/pasted dimensions | Reduce furniture data entry | Preserve source and exact variant; outer footprint matters |
| Dimensioned floor-plan image/PDF | Potential future outline/opening intake | Deferred beyond the first release; any later extracted labels would still need review |
| Native scan import | Potential future input | Separate format/device/uncertainty design; no baseline browser capture |

Recommend JPEG, PNG and WebP initially, with HEIC/PDF evaluated separately. Detect content type from validated bytes, bound dimensions before expensive decode, normalize orientation and strip unnecessary metadata before provider transfer. Re-encoding must not be described as removal of private information visible in the image itself. Select exact supported formats and byte/pixel limits before implementation.

GPT vision can help interpret images, but the official guide identifies mistakes in counting and precise spatial reasoning. Roomedy's design therefore requires correction and explicit measurements; this is an application policy, not a calibrated scanning capability. [Official images and vision guidance](https://developers.openai.com/api/docs/guides/images-vision).

### 6.2 Provenance per value

| Status | Meaning | UI and validation behavior |
| --- | --- | --- |
| Unknown | No usable value | Ask or mark the dependent check unassessed |
| Estimated | Draft/default/visual approximation | Show an approximate marker; permit exploration without certainty claims |
| Extracted | Read from labelled evidence | Link the source and request review |
| Scan-derived | Supplied by an eventual supported scan | Preserve source and uncertainty; still correctable |
| Confirmed | Explicit visitor confirmation or authored sample | Eligible for the checks supported by that value and its source |

Use provenance for each dimension and opening location, not one blanket `roomConfirmed` flag. A confirmed room width does not confirm its depth, door hinge or furniture height. Keep source references scoped to available local inputs; missing originals do not become live links after refresh.

For exploration, an unknown value may have a separate estimated display value. Never store the estimate as confirmed merely to satisfy a numeric schema. Only an explicit visitor confirmation action or a clearly authored sample may create confirmed provenance. The assistant may request confirmation but cannot manufacture it.

The same evidence rule applies to pose/rotation/front, wall association, hinge and mechanism, not just dimensions. Store a bounded source/review representation and keep unknown associations explicit. Deliberate **planned** placement is distinct from confirmation of the original photographed position. Each check depends on all relevant facts, including room dimensions, and reports assessed/approximate/unassessed coverage; no emitted issue is not itself proof of a pass. Imported labels or loss of a source image cannot authenticate physical evidence.

### 6.3 Targeted measurement review

Ask “How long is this wall?”, “How wide and deep is the desk?”, “Which side is the hinge?” or “How high is the sill?” next to the highlighted feature. Show metres/centimetres or a selected display unit, while storing one canonical unit. Bed mattress size may differ from the frame footprint; wardrobe depth may exclude handles or open doors.

Correcting a confirmed measurement is an explicit room change. It increments revision and recomputes dependent diagnostics. If furniture no longer fits after an honest correction, show the conflict; do not silently move objects or enlarge the room. Keep recognition drafts separate until accepted into the room.

Use O-03's small deterministic relevance policy: ask for the missing value that affects the current requested decision/check. Sill height matters to a desk under a window; an unrelated unknown need not block a different move. No calibrated confidence percentage or exhaustive questionnaire is added.

### 6.4 Future scan context

Apple RoomPlan and Android depth were research directions in the original draft, not selected integration contracts. RoomPlan uses native capture on supported hardware; a browser photo upload is not that workflow. Recheck official platform/device support if scan import is selected later. Do not imply an Android depth API supplies an equivalent complete reconstruction pipeline without additional work. Original research links are retained in section 27.

## 7. Workspace and manual editing

### 7.1 One room, two views

The main editor's 2D SVG plan and 3D React Three Fiber cutaway read the same room document and object IDs. Photo processing hands off directly to this editor, defaulting to3D; its loading artwork is illustrative SVG without editable geometry. Selection, inventory and properties refer to those IDs. Switching editor views changes presentation only. Camera orbit, zoom and reset must not mutate physical geometry or create Undo entries.

| 2D plan | 3D cutaway |
| --- | --- |
| Clear footprints and dimensions; doors, swing areas, windows, obstacles and clearances | Understandable miniature room with coherent materials, lighting and furniture |
| Drag, snap, rotate, select and inspect | Orbit, zoom, reset, select and inspect |
| Precise numeric placement and keyboard adjustment | Contextual highlight and preview; direct 3D dragging is deferred |
| Text and color-coded check overlays | Consistent proposed/committed visual states and unobstructed room visibility |

The owner selected the 2D plan for precision placement: drag, rotate, snap and numeric/keyboard adjustment. The 3D cutaway supports orbit, zoom, reset, selection and inspection in the main editor. Direct 3D furniture dragging is deferred. Both views use the same room document and selection identity.

### 7.2 Editing controls

Select a piece to see its name/category, size preset and supported finish. Numeric dimension summaries/fields, frame allowance, position, independent locks and less-used ownership/planning preferences remain inside collapsed Advanced. Preset labels distinguish region without showing numeric dimensions in Basic. Rotate and selected Delete belong in the room controls in both views; no duplicate inspector Rotate/Replace/Remove row. Catalogue retains explicit replacement, while Add still starts an addition. Snap is a matching keyboard-accessible switch using the existing placement setting.

Explicit visitor Apply size may deliberately change the chosen dimensions through a narrow visitor-only size-lock override; selected Delete may deliberately remove that piece through a narrow visitor-only lock override. Neither silently changes stored locks, confirms estimates, authorizes an assistant action or bypasses catalogue/final geometry validation. Each is one normal command/Undo. Exact custom estimates and measured corrections remain Advanced; unchanged/omitted axes retain evidence. Generic actions without those explicit flags still enforce starting locks, including same-batch unlock attempts.

Pointer motion updates a transient drag state. Pointer-up produces one validated command; a drag is one Undo step, not one per frame. A rejected drop returns to the last committed pose and highlights the reason. Release pointer capture and transient resources on cancellation or component cleanup.

Door/window editing uses named wall, along-wall offset and dimensions, with a visible hinge/direction choice when applicable. A feature's appearance must agree with its validation geometry. A fixed obstacle is part of room data, not decoration.

Trusted visitor controls add/remove a missed/false opening and correct wall, hinge and mechanism through the shared evaluator, with typed targets and explicit source/review intent. These are physical-description corrections, not assistant-authorized renovation. A true correction can reveal a conflict without being falsified. Pointer/numeric/snap controls preserve half-millimetre centres, and a drag records planned placement rather than measured photo truth.

### 7.3 Layout by viewport

On desktop, use a narrow tool rail, dominant canvas, optional inspector and compact conversational panel. On tablets, collapse secondary panels while retaining the canvas and selected-item summary. On phones, use one focused canvas with bottom sheets/drawers for catalogue, properties, checks and chat; do not compress desktop columns into unreadable strips.

Opening one panel should not cover Apply/Cancel or the selected object without a way to recover context. Preserve state through responsive recomposition. Essential actions must work with keyboard focus, touch and numeric inputs. The visitor does not need to understand the underlying coordinate system.

## 8. Room document and coordinate contract

### 8.1 Recommended canonical conventions

Use finite bounded integer millimetres for physical dimensions and half-millimetre increments for furniture centres. Odd-size objects therefore support exact contact: a 1501 mm span from 0 to 1501 has centre 750.5 mm. Keep the wire value bounded and exact; doubled-integer arithmetic may be used internally. An arbitrary collision epsilon must not conceal a quantization defect. Display conversion belongs at the UI boundary; convert millimetres to Three.js metres once at the rendering boundary. Use the floor plane as X/Z, up as Y, and the room's northwest plan corner as `(0, 0)` for X/Z. Declare positive directions consistently in plan and 3D adapters.

Recommend furniture pose at the footprint center, with `quarterTurns` in `0..3`. Width and depth describe the catalogue's unrotated local axes. Rotate corners around the center; quarter-turns swap world-aligned extents. The local front direction must be recorded for access/swing geometry. Reject unsupported rotations instead of rounding them silently. These coordinate conventions are the engineering baseline; define and test the final contract during foundation implementation.

Visual mesh origin and bounds are not geometry authority. Asset preparation supplies a transform aligning the mesh to the semantic footprint and floor. The browser must not derive fit from whichever decorative mesh happened to load.

### 8.2 Document responsibilities

| Data | Owner and rules |
| --- | --- |
| Version, room ID and revision | Cross-boundary contract; revision increases on committed semantic changes |
| Room dimensions and finishes | Value-level provenance; explicit correction history |
| Wall openings and obstacles | Stable IDs, wall association, along-wall location, dimensions, hinge/mechanism and provenance |
| Furniture | Stable ID, catalogue ID/version, dimensions, center pose, rotation, ownership/preferences/locks, finish references |
| Planning intent | Room purpose, retained pieces, required functions and preferences; revision-bound when used in a proposal |
| Validation issues | Derived from a specific document/rules version; recompute rather than trusting imported pass flags |
| Selection/camera/open panels | Frontend presentation state; not physical geometry |
| Pending proposal/network work | Ephemeral, bound to room identity, generation, revision and operation |

### 8.3 Illustrative schema vocabulary

This abbreviated example describes shape and provenance; it is not a complete validated fixture or final API schema. Additional required catalogue, opening and bounds contracts must be defined together.

```json
{
  "schemaVersion": 1,
  "roomId": "room_sample_bedroom",
  "roomRevision": 7,
  "unit": "mm",
  "catalogueVersion": "sample-v1",
  "rulesVersion": "rectangle-quarterturn-v1",
  "room": {
    "shape": "rectangle",
    "width": { "value": 3600, "status": "confirmed", "sourceId": "authored-sample" },
    "depth": { "value": 4200, "status": "confirmed", "sourceId": "authored-sample" },
    "height": { "value": 2600, "status": "confirmed", "sourceId": "authored-sample" },
    "features": []
  },
  "furniture": [
    {
      "id": "desk_1",
      "catalogueId": "procedural-desk",
      "dimensions": {
        "width": { "value": 1200, "status": "confirmed", "sourceId": "authored-sample" },
        "depth": { "value": 600, "status": "confirmed", "sourceId": "authored-sample" },
        "height": { "value": 740, "status": "confirmed", "sourceId": "authored-sample" }
      },
      "pose": { "centerX": 2900, "centerZ": 2200, "quarterTurns": 0 },
      "ownership": "owned",
      "preference": "keep",
      "locks": { "dimensions": true, "position": false, "rotation": false }
    }
  ]
}
```

The illustrative companion uses a simpler corner-based SVG model inherited from the draft. It is expressly separate from this proposed center-pose runtime contract; do not copy that illustration's coordinates directly into production fixtures without conversion and independent tests.

The abbreviated JSON above shows coordinate fields only; it omits the full bounded pose/feature evidence and must not be copied as the complete current wire contract. Pose evidence includes unknown/estimated/extracted/scan-derived/confirmed and deliberate planned placement; wall/mechanism/hinge evidence and unknown wall association remain explicit. RM-003 documents and tests the selected full fields, rather than treating precise arithmetic as proof of input confidence.

### 8.4 Structural validity versus arrangement quality

Structural validity means supported schema, unique IDs, finite bounds, valid catalogue references and coherent feature relationships. Arrangement validity concerns containment, collisions and modeled access. A structurally valid imported description can still document an awkward real room.

Do not execute imported scripts, remote asset URLs, HTML or embedded code. Reject unsupported schema versions with a useful message. Migrations must be explicit, bounded and tested. Imported provenance is user-supplied evidence, not an authenticated survey or permission to bypass domain locks. Generate a new active workspace identity/generation rather than restoring operation capabilities from an export.

An owned item's bounded true physical size is valid independently of its current asset's supported representation range. Keep geometry, ID, ownership and reviewed dimensions intact; use an eligible procedural representation or explicitly limited semantic placeholder when needed. Offered new/replacement catalogue variants still obey their supported size policy. Never shrink a true measurement or stretch a detailed fixed mesh silently. Targets are explicitly typed or cross-kind IDs unique, including the room, so feature/furniture/room corrections cannot collide.

## 9. Commands, previews, Apply and Undo

### 9.1 One command path

Manual edits, accepted intake corrections and assistant proposals use the same pure command evaluator. The model cannot mutate browser state directly. Commands are allow-listed operations with typed payloads, not arbitrary JSON patches or executable code. Inject identifiers/time where needed; the pure spatial engine performs no network, storage, environment or rendering work.

A command envelope should identify command ID, room ID, expected revision, schema/rules/catalogue versions, origin assigned by trusted application code, and a bounded list of actions. Capture the pre-change state needed for Undo within the history byte budget. Never allow a model to designate its own changes as visitor-confirmed measurements.

Application-owned request scope limits action kinds, target IDs and add/replace/remove permission in addition to locks. An unrelated unlocked item is not implicitly authorized by “move my desk.” Resolve ambiguous references, disclose necessary desk/chair coordination, and preserve unrelated geometry/finishes. Tool arguments cannot widen scope. Recheck scope on Apply; whole-room rearrangement requires the explicit whole-room goal.

### 9.2 Proposal lifecycle

`idle → preparing → preview-ready | clarification | rejected | failed | cancelled`

`preview-ready → applied | cancelled | stale`

1. Capture a bounded semantic snapshot and the visitor's request.
2. Resolve references against that snapshot. Ask one targeted question when needed.
3. Build a candidate batch through supported tools and local layout search.
4. Validate schemas, numeric limits, IDs, catalogue policy and starting locks.
5. Evaluate the complete resulting room atomically, including coordinated moves.
6. Produce a diff, affected IDs, computed checks, remaining unknowns and concise reasons.
7. Show the preview distinctly in both views while preserving committed data.
8. On Apply, recheck current identity/generation/revision and recompute validation.
9. Commit once, increment revision, record the receipt/Undo entry and clear the preview.
10. Report the actual committed result. Preview prose is never a success receipt.

Validating each move separately can falsely reject a coordinated swap. Validate the final state, while enforcing starting-state locks and permissions throughout. A batch cannot unlock a protected piece and move it merely because the model included an unlock action. Explicit visitor authorization must precede that protected change through the normal lock control/confirmation path.

RM-015AN adds two narrow deliberate visitor paths: Apply size can override only that action's size protection and selected Delete can override only that removal's locks. Flags are literal-true and visitor-only; locks stay recorded, ordinary move/rotate/resize/replace rules and final spatial checks remain. Assistant actions cannot contain these flags or borrow their authority for another target/action.

### 9.3 Invalid existing rooms and new changes

Baseline intake may describe existing problems. Preserve and label them. Recommend allowing repair actions that reduce existing conflicts while introducing none; compare issue identities and affected regions deterministically, not just a count. New AI proposals with hard conflicts cannot be applied as a successful arrangement. A room with unresolved baseline issues remains visibly unverified even after an unrelated appearance change.

Unknown measurements produce unassessed checks and explicit limitations, not fabricated passes. A preview may remain explorable when approximate, but its status and Apply wording must not imply confirmed fit. Set the exact acceptance policy at product review and test the baseline-versus-proposal distinction.

### 9.4 Revision, replay and cancellation

Every asynchronous result belongs to a workspace ID, generation, input room revision and operation ID. Room changes, goal changes used by the request, import, reset and expiry invalidate obsolete work. Captured selection can identify the request's target; changing the camera does not invalidate room geometry.

One pending scene proposal is recommended. A manual edit cancels it or marks it stale before committing. A newer request supersedes prior preparation. Abort obsolete requests/solver work where possible and ignore late results even when remote cancellation cannot be confirmed. Cancellation does not guarantee zero provider cost after dispatch.

Applying the same command ID twice returns the existing receipt or a safe already-applied state, never duplicate furniture. Bind the receipt to room identity and exact candidate payload. A browser refresh must not automatically replay a metered request or pending Apply.

Use a finite recent exact-payload replay cache with a monotonic positive command sequence/high-water mark for the active workspace. Retired old sequences reject as stale; they never regain execution authority after cache eviction. Recent same-sequence/same-payload duplicates remain idempotent, including after Undo; a reused sequence with different payload rejects. No-op sequences retire safely without permanently exhausting the editor. Undo does not rewind the high-water sequence. Keep local command retirement separate from metered server-grant accounting.

### 9.5 Undo semantics

One accepted instruction is one Undo entry, including coordinated additions/moves/finish changes. A manual drag is one entry. Undo restores the prior semantic room as a new revision and recomputes diagnostics. It cancels any pending preview. It does not rewind unrelated conversation, restore a cleared photo, reinstate an expired capability or repeat a paid request.

Use bounded history shared by manual and assistant actions, with **Undo last change** labelled by its actual action. Entry count and byte limits remain engineering values to measure; the guest lifetime is fixed at the selected two hours. Redo is deferred. A fresh import/reset starts a new active history.

### 9.6 Before/Current comparison

**20 October temporary presentation override (RM-015AC):** owner requests hiding Before/Current for now, retaining implementation. Current is the visible editable presentation; baseline/comparison/controller/import/export remain intact. The last tour step targets Undo while comparison controls are hidden. Restoration is a later explicit change; the capability below is retained.


Include one read-only baseline captured when the reviewed room first enters the main editor, when an authored sample opens, or from the validated baseline in an imported project. Compare that starting arrangement with the committed current room using the same selected 2D/3D view and camera. Label **Before** and **Current** clearly. The baseline does not update when furniture moves, an AI batch applies or Undo runs.

Before is an inspection state, never an alternate editable room. Return to Current to edit. Resolve an active proposal through Apply or Cancel before entering the comparison, so a proposal preview cannot be mistaken for the committed current layout. Changing the comparison view does not change room revision, create history, issue a provider request or restore deleted photos.

Persist/export the semantic baseline with the current room under the combined finite project budget and fixed two-hour guest lifetime. It contains no raw photos, grants or active operations. Reset replaces the whole workspace/baseline; import validates current and baseline together before replacing anything. Use one renderer/plan adapter with read-only snapshot input, rather than maintaining two independent editable scenes or automatically generating another candidate.

## 10. Geometry and layout generation

### 10.1 Deterministic checks

| Check | Inputs needed | Result and limitation |
| --- | --- | --- |
| Room containment | Room outline, furniture footprint/pose | Identify crossing objects; estimates remain approximate |
| Furniture collision | Semantic footprints, relevant heights | Detect modeled overlap; visual mesh detail cannot override footprint rules |
| Door movement | Door location, leaf width, hinge, swing direction | Check the modeled swept area; unknown mechanism is unassessed |
| Storage access | Furniture front, opening type, access preset | Distinguish hinged/sliding storage; disclose assumptions |
| Chair use | Desk/chair relation and a chosen pull-out area | Report the configured space; not an ergonomic certification |
| Height conflicts | Heights, window sill/obstacle intervals | Check actual supported vertical relationships |
| Entry/access path | Chosen path algorithm and clearance model | Only claim connectivity if implemented; clear floor area alone is insufficient |
| Locks and ownership | Starting state and authorized changes | Reject protected moves/resizing/replacements |
| Missing information | Per-field provenance and rule dependencies | Return unassessed/approximate status rather than a global pass |

Use strict positive-area overlap with an explicit tolerance/contact policy; touching edges and a configured clearance violation are different facts. Test the chosen threshold at exact boundaries and one unit either side. Coarse rectangles can conservatively approximate door sweeps initially only if their limitation is visible and they do not claim exact hinge geometry.

Semantic footprints may intentionally include physical frames/handles. Access zones are additional functional areas, not solid furniture. Vertical relationships matter: a chair can tuck under a desk only if the supported model represents that exception; a blanket 2D non-overlap rule must not silently contradict the intended furniture behavior. Decide whether such relationships belong in the first release.

For O-02, first record false rejection from the disclosed conservative door envelope on independent cases. Retain it unless material failures justify a bounded analytic hinge-sector/rectangle rule with independent boundary tests. No physics engine or automatic scope expansion is needed.

### 10.2 Issue vocabulary

Return machine-readable code, involved IDs, severity, rule version, measured facts, required inputs and provenance status. Useful classes are **blocked**, **warning**, **unassessed** and **passed for the stated inputs**. UI copy maps from fixed codes, with dimensions formatted by the application. The assistant can explain those facts but cannot turn them into a broader compliance claim.

No unexplained overall room score is required. “The wardrobe's modeled opening area overlaps the chair by 80 mm” is more useful than “Layout 74/100.” The UI should focus the relevant pieces and show the region behind the message.

### 10.3 Bounded arrangement search

The model interprets the goal; deterministic application algorithms generate or evaluate placements. Recommend a seeded bounded search for the small first-release catalogue: preserve protected items, enumerate supported orientations and candidate wall/grid positions, prune hard conflicts, score soft preferences, then return a small stable set of candidates with computed trade-offs.

Hard constraints include physical containment, protected dimensions/locks and modeled blocked openings. Soft preferences include desk proximity to a window, useful central space, grouping and visual balance. Room purpose influences priorities. Do not resize an owned bed or enlarge a measured wall to improve the score.

Use a worker to keep local search off the pointer/render path. Bound input size, candidates examined, elapsed time, memory and result count; make work cancellable. The backend must re-evaluate any returned candidate using the same package. A browser is not a trusted validation boundary for metered/tool requests.

“No arrangement found within this search” is not proof that no arrangement exists. Offer concrete alternatives: remove an optional item from the plan, choose a smaller replaceable desk, relax a preference or confirm a missing measurement. Exact solver choice, search limits and quality targets require engineering measurement. The selected UI shows one proposal at a time and a Before/Current peek.

For targeted goals, rank valid candidates by request satisfaction, then fewer changed pieces/lower displacement before decorative preferences. Candidate ordering/pruning should exploit walls, openings and target relationships before a broad grid. The independent corpus includes tight feasible rooms with known valid arrangements and demands relevant goal improvement, not only validity.

A seed guarantees stable ordering and fixed-work results. A deadline run reports the visited prefix and termination reason; hardware-dependent work budgets cannot promise identical best candidates across devices. Use pure incremental state with scheduling outside the spatial package or a measured equivalent. Browser search remains in its worker; backend search must yield or run off the event loop so health checks and cancellation stay responsive.

## 11. Assistant behavior and tools

### 11.1 The assistant's job

The **Roomedy assistant** can explain the room, guide setup, highlight a problem, help choose supported pieces/finishes, prepare edits and explain computed results. It should do useful work, rather than turning every interaction into another question. Suggested request chips and visual object cards reduce typing. Use that generic label for the first release; a separate assistant brand is not required.

Send the smallest useful semantic context: current revision, dimensions/provenance, selected and referenced IDs, supported catalogue, ownership, locks, openings, clearances, goals and relevant computed issues. Do not send every original photo on every chat turn. A screenshot can supplement an appearance question; it is not the primary authority for precise placement.

### 11.2 Proposed tool surface

| Capability | Responsibility | Authority |
| --- | --- | --- |
| Read room | Return a bounded snapshot and diagnostics | Read-only |
| Find furniture | Filter the allowed catalogue by category/dimensions | No arbitrary URLs or invented variants |
| Find arrangements | Run bounded deterministic search for stated goals | Returns candidates, never a direct state mutation |
| Prepare edit batch | Propose add/move/rotate/remove/replace/finish actions | Must pass shared validation and visitor review |
| Explain checks | Return computed issues and their dependent values | Does not generate unmeasured distances |
| Focus object/issue | Select, highlight or restore a camera view | Allow-listed presentation actions |
| Request measurement/lock change | Highlight the value/control needing visitor input | Cannot self-confirm or self-authorize |
| Request Undo | Route to the normal latest eligible history action | Application verifies target/eligibility and explicit visitor intent |

Keep the initial tool list small. Some capabilities can be combined into one typed request/result protocol, but retain their responsibility boundaries. The exact tool count and names are not settled API commitments.

### 11.3 Provider integration recommendation

Use a backend-only OpenAI adapter, with Responses as the proposed transport, strict function schemas, a bounded tool loop and explicit error/refusal handling. Official function calling describes model requests to application tools; the application executes those tools and returns correlated results. Strict mode requires closed object schemas and required properties; use explicit nullability for genuinely optional values. Schema conformance does not establish geometric correctness. [Official function-calling guide](https://developers.openai.com/api/docs/guides/function-calling).

Roomedy policy should reject unknown tools, extra properties, unsupported IDs, non-finite values, out-of-range numbers, oversized text and fabricated catalogue references. Bound every tool iteration and output before execution. Do not execute returned JavaScript, shell commands, HTML or arbitrary external requests. Tool results are data. Text visible in photos or imported documents is untrusted evidence, never a developer instruction.

The exact model, account access, evaluation corpus and internal funded provider allowance remain undecided. Verify current API/model compatibility during implementation. Do not copy model IDs, hidden signoff flags or spending policy from a sibling. Live failure never selects a fake provider; the visitor gets a clear failure and can continue manually.

Use a provider-compatible projection of internal contracts, not an unchecked Zod-to-schema cast. OpenAI's supported schema subset requires a root object, closed strict objects, required fields and explicit nullability. Test actual emitted schemas and refusal/incomplete/unknown decoding. Set strict mode and serial tool calling explicitly, choose per-round tools deliberately, and correlate one final application-owned batch. Schema compliance never proves geometric truth. See [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs) and the function guide above.

### 11.4 Tone and honest outcomes

Prefer concise, specific suggestions: “The desk fits here using your confirmed width. I still need the window sill height to check it beneath the window.” Ask one targeted clarification when several objects could match a phrase. Offer supported alternatives when a finish or furniture type is unavailable. Distinguish a prepared proposal from an applied change, and a search timeout from proven impossibility.

## 12. Worked scenarios

### A. Move the work area near the window

**Request:** “Move my desk by the window, keep my bed and wardrobe, and make sure I can pull my chair out.” Capture the current revision; resolve the window; preserve retained dimensions/locks; generate coordinated desk/chair poses; test footprints, opening access and configured chair space. Check sill/desk heights only when known. Preview both moves with exact application-computed facts. Apply commits both once; Undo restores both.

### B. Furnish an empty bedroom

**Request:** “I need a double bed, work desk, chair and wardrobe. Keep the entrance clear.” Confirm purpose and missing dimensions, choose supported variants and run bounded search. Preview additions as proposed items, preserving sample versus user-confirmed provenance. If the combination does not fit within current constraints, offer a smaller eligible variant or removal of an optional piece; do not make the room larger.

### C. Keep a few pieces

**Request:** “Keep this bed. Add a desk and storage in a warm style.” Preserve the bed's size and any pose lock. Add supported catalogue pieces around it and preview permitted wall/floor settings. Show additions separately from retained furniture. A request to replace storage does not authorize replacement of the bed.

### D. Change appearance only

**Request:** “Keep the layout, but make it feel warmer.” Preview supported room finishes/lighting presets while preserving every pose and physical dimension. Owned furniture finishes remain unchanged unless explicitly editable. Existing access problems remain visible; a palette change does not make the arrangement fit.

### E. A request conflicts with a lock

**Request:** “Put the wardrobe on the left,” while its position is locked. Explain the lock and focus its control. A clear visitor unlock action can authorize a new proposal; the model cannot include `unlock` then `move` to bypass the protection. Dimension and position locks are independent.

### F. A proposed desk blocks the door

Reject the candidate before Apply, highlight the relevant opening/sweep region and show why the placement conflicts. The committed room stays intact. Offer an alternative supported pose or let the visitor cancel. A disabled Apply button also needs a readable explanation.

### G. The room changes while the assistant works

The request starts at revision 12. A manual move commits revision 13 before the response arrives. The response is stale, remains unapplied and cannot overwrite the manual move. Offer a deliberate new request against the updated scene; do not automatically incur another provider call.

### H. Confirmed measurements reveal a problem

The visitor corrects the room width downward. Keep the honest value, recompute containment and highlight affected objects. Preserve confirmed furniture size. Explain the new uncertainty/conflict and let the visitor arrange a repair. The measurement correction is distinct from an assistant's placement proposal.

## 13. Furniture and asset pipeline

### 13.1 Curated catalogue first

Start with a coherent bed, desk, chair and wardrobe, then add only storage/variants that materially help the selected bedroom/workspace story. Each catalogue record needs a stable ID/version, category, display information, nominal dimensions, allowed size range or exact variant, semantic footprint, front direction, opening/access behavior, supported finishes and a prepared visual representation. First-release records have no price, currency, retailer, checkout or affordability fields. Catalogue selection is about function, fit and appearance.

Owned furniture can use a similar visual model at its confirmed dimensions. Label the representation as approximate where appropriate. Do not imply exact reconstruction of hidden surfaces or real-world mechanisms from a photo.

### 13.2 Sources checked for this documentation

| Source | Current page information | Intended role and remaining work |
| --- | --- | --- |
| [Kenney Furniture Kit](https://kenney.nl/assets/furniture-kit) | 140 files, CC0 | Consistent lightweight source; select exact files and verify fit/style |
| [Quaternius Furniture Pack](https://quaternius.com/packs/furniture.html) | 23 models, CC0; listed formats FBX/OBJ/Blend | Essential pieces; convert/prepare GLB if selected rather than assuming runtime-ready GLB |
| [Poly Haven licence](https://polyhaven.com/license) | Library assets are CC0 | Selected materials/models/lighting; choose assets and budget texture cost |

These source pages were opened on 17 October 2026. At documentation time no pack had been downloaded. RM-002 subsequently reviewed/downloaded the exact free Kenney archive and prepared two selected CC0 meshes, with per-file source/license records in [the catalogue policy](design/catalogue.md) and actual checks in [RM-002 evidence](validation/RM-002.md). No purchased asset or device-performance result is claimed. Keep per-file source/licence records; a suitable public library is not proof that the exact needed furniture variant is available.

### 13.3 Procedural versus fixed assets

Procedural beds, desks, shelving and wardrobes can change supported dimensions by rebuilding meaningful parts. Keep leg/frame thickness plausible; avoid stretching a detailed mesh indiscriminately. Curated fixed-size chairs or decorative models can add detail. Catalogue policy must say which dimensions may change and whether doing so creates a replacement proposal.

Physical-size truth and representation eligibility are separate. A retained 680 mm chair remains 680 mm even if its selected fixed asset represents 670 mm. Resolve an eligible procedural representation or a single bounded semantic-box placeholder with a clear limitation; never substitute a different object/size or silently stretch the fixed detailed mesh. Offered proposed additions/replacements remain within their catalogue variant policy. RM-003 owns this refined validation; RM-002's earlier preparation evidence is not retroactive proof of it.

### 13.4 Preparation and runtime delivery

Normalize unit scale, orientation, origin, floor contact, material palette and mesh-to-footprint transform. Define planning geometry independently of mesh bounds. Prefer preprocessed GLB/glTF delivery, bounded textures and reusable geometry/materials. Include thumbnails and a lightweight first-load representation. Store source URL, creator, licence, version and preparation notes with selected assets.

Serve only bundled/approved catalogue assets. Do not let imports or model output cause arbitrary remote downloads. Test asset failure with a clearly identified procedural placeholder that preserves semantic size; visual fallback must never change fit geometry. The stylized quality direction and similar-model approach are selected; exact licensed asset files and their visual/device checks remain engineering/design work.

## 14. Architecture and dependency boundaries

### 14.1 Recommended topology

```text
Browser
  Next/React room workspace
    one session controller + room document
    SVG plan + R3F cutaway + inventory + inspector + assistant
    bounded local recovery + local search worker
       |
       | relative, allow-listed /api/roomedy/v1 operations
       v
Next server-only bridge
  fixed upstream paths, origin checks, request/response bounds, aborts
       |
       | authenticated service identity when hosted
       v
Express private API
  admission -> request validation -> use case -> injected provider adapter
  shared spatial validation + bounded tool/search work
       |
       v
Configured OpenAI API for deliberate recognition/assistant requests

Both applications -> @roomedy/contracts
Both applications -> @roomedy/spatial -> @roomedy/contracts
```

The browser owns the editable scene. The backend validates a bounded submitted snapshot and model output; it is not a hosted room database. Final client Apply rechecks the current room using the same spatial engine. The backend must not trust client-supplied pass flags or model claims. Local state can be user-edited, but it cannot authorize unlimited provider dispatch or change server policy.

### 14.2 Layers and responsibilities

| Layer | Recommended technology/responsibility | Reason |
| --- | --- | --- |
| Browser experience | Next App Router, React, strict TypeScript | Proven portfolio structure and responsive feature composition |
| 3D view | Three.js via React Three Fiber; selected Drei helpers | Spatial rendering/controls, with room rules outside the renderer |
| Precision plan | React-controlled SVG | Dimensions, footprints, keyboard/numeric editing and overlays |
| Cross-boundary contracts | Zod and typed public subpaths | One validated vocabulary for room, commands and API results |
| Spatial core | Pure TypeScript in `packages/spatial` | Same geometry/command authority in browser, worker and backend |
| Application API | Express with injected use cases/adapters | Explicit input, admission, provider and error boundaries |
| Same-origin bridge | Thin Next server Route Handlers | Hide private service configuration and restrict forwarded operations |
| Guest storage | Bounded allow-listed browser projection | Refresh recovery without an account/database |
| AI | Backend-only provider adapter; proposed Responses/tool calling | Keep provider types/keys outside public contracts and browser bundles |
| Delivery | Pinned Docker builds, proposed Cloud Run service pair | Matches the actually inspected sibling release pattern |

All proposed package versions must be verified and pinned with a lockfile during foundation work. Sibling manifests are evidence of their installed choices, not a Roomedy dependency recommendation by exact patch version. The R3F introduction pairs its major 9 with React 19 and major 8 with React 18; verify compatibility when selecting the full React/Next/Three/Drei set. [R3F introduction](https://r3f.docs.pmnd.rs/getting-started/introduction).

### 14.3 Dependency rules

Applications never import each other. Shared packages never import apps. Contracts contain only public schemas/types and truly shared policy; no React, Next, Express, Node globals, environment reads, provider SDKs, storage or fixtures. The spatial package contains pure room/geometry/command calculations, not Three.js components, HTTP or browser APIs. Frontend persistence and worker lifecycle remain in the frontend feature that owns them.

Use public package exports, with no relative cross-app source imports. Keep Next client code away from `server/` and `.server.ts` modules. Build-time and executable boundary checks should prove these directions, rather than relying on comments alone [CB-1, RS-1, RT-1]. Extract reusable implementation only when real consumers share it. Create no generic dumping-ground `utils` or `services` package.

### 14.4 Rendering and work ownership

Drag, camera movement, selection and animation run locally. Do not send model requests per frame. Keep transient pointer state out of persisted room history until a validated drop. Load the heavy3D editor when the visitor reaches the studio, and reuse prepared assets/materials. Photo processing uses lightweight illustrative SVG, with no second editor or renderer. Avoid React state updates for every internal animation frame when local renderer state suffices.

On-demand rendering is a possible idle optimization, provided controls and active animations invalidate frames until they finish. It must not become an animation-off/render-off setting or suppress intended movement. The R3F performance guide explains invalidation, resource reuse and idle rendering; actual Roomedy device behavior still requires measurement. [R3F performance guidance](https://r3f.docs.pmnd.rs/advanced/scaling-performance).

## 15. Proposed repository structure

This is an ownership map, not a scaffold to create during step one. Create directories when real modules arrive, and keep names specific to Roomedy's behavior.

```text
apps/
  frontend/
    src/
      app/                       # /, /demo, layouts, fixed API entry points
      features/
        landing/                 # Public story and lightweight room illustration
        session/                 # Canonical state, effects, restore/reset/export
        room-intake/             # Photos, correction and measurement review
        room-editor/             # Editor composition and command interaction
        plan-view/               # SVG adapters and precision controls
        room-view/               # R3F scene, assets, camera and selection
        catalogue/               # Visual catalogue and variant choices
        assistant/               # Chat, suggestions, proposal cards and explanations
      server/                    # Private fixed bridge and identity/config
      styles/                    # Design tokens and shared visual foundations
    public/catalogue/            # Prepared approved assets/thumbnails
    README.md
    .env.example
    Dockerfile
  backend/
    src/
      server.ts                  # Explicit environment loading and listener
      runtime/                   # Dependency composition, clock, IDs and capacity
      config/                    # Validated settings and deployment modes
      http/                      # Transport, bounded intake and error mapping
      recognition/               # Image preparation and correctable room drafts
      assistant/                 # Bounded tool loop and proposal use case
      providers/                 # Fake/live adapters and bounded transport
      security/                  # Admission, origin/replay and request budgets
    README.md
    .env.example
    Dockerfile
packages/
  contracts/src/                 # Room, catalogue, commands, provenance, API
  spatial/src/                   # Footprints, checks, search, commands, history
docs/
  README.md
  ROOMEDY.md                     # This main authority and canonical progress
  ROOMEDY_OVERVIEW.html           # PM companion, explicitly scripted
  GENERIC REPO GUIDE.html         # Owner's unchanged reusable workflow
  drafts/2026-10-17/              # Original Roomedy source material
  design/                        # Later concrete design decisions/evidence
  engineering/                   # Later owning contracts/operations explanations
  operations/                    # Later release preparation and verified runbooks
  tickets/                       # Approved queue; RM-001/002 committed, RM-003 in progress
  validation/                    # Actual check evidence, when performed
scripts/                         # Named development/release/boundary checks
test/                            # Shared isolation and boundary fixtures
AGENTS.md                        # Current build/feedback rules; real commands added with implementation
package.json
pnpm-workspace.yaml
pnpm-lock.yaml
```

No separate renderer, media worker service, database layer, ORM, general queue, authentication application or speculative asset pipeline service is justified by the current scope. A local search worker is a frontend implementation detail, not a fifth workspace application.

## 16. API and provider contracts

### 16.1 Proposed fixed operations

Names below make the responsibilities reviewable; final wire schemas belong to implementation. Next exposes only the corresponding fixed operations beneath `/api/roomedy/v1`. A path allow-list must still be enforced even if a catch-all route file is used, as Retailor does [RT-3].

| Private API operation | Purpose | Metered or state effect |
| --- | --- | --- |
| `GET /v1/health` | Content-free liveness | No provider request |
| `GET /v1/ready` | Runtime/configuration availability | No provider request; distinguish unavailable AI from dead process |
| `GET /v1/config` | Public capabilities and enforced input limits | Safe allow-listed projection only |
| `POST /v1/admission` | Establish bounded anonymous permission for an operation | No recognition/chat dispatch |
| `POST /v1/recognize-room` | Interpret selected normalized images into a correctable draft | Explicit deliberate provider action |
| `POST /v1/assistant` | Explain or prepare supported room changes | Bounded provider/tool operation |

Manual movement, camera control, local validation, Apply, Undo and project export/import need no metered route. Avoid adding a remote endpoint for every pure operation simply to make the architecture look distributed. A separate non-metered remote solver route requires measured justification; it is not a baseline service.

### 16.2 Request/result envelope

Requests identify a bounded operation ID, room ID, expected room revision, contract/rules/catalogue versions, normalized semantic snapshot, scoped context and visitor input. Recognition additionally identifies selected images and their bounded manifest. The backend assigns trusted policy/origin; browser-supplied approval fields cannot grant server authority.

Results identify the operation and input revision, then return one typed outcome: explanation, clarification, proposed batch, recognition draft, unsupported request, refusal or safe failure. Proposal results include affected IDs, normalized actions and computed check facts. Recognition returns hypotheses/provenance candidates, never confirmed measurements or an automatic committed room.

Return a safe error envelope with stable code, visitor-readable source-controlled message, operation/request reference and an explicit retryability hint where useful. Keep raw provider/exception/schema details in private server diagnostics. Do not put internal model names, stack traces or private service configuration in visitor copy.

Visitor input/tool contracts exclude furniture price, spending-budget and shopping operations. A request such as “keep it under $500” should explain that this demo does not price furniture and offer supported layout/size/style refinement instead. That is separate from backend token, rate, concurrency and internal paid-usage controls, which remain enforced.

### 16.3 Provider transport

Inject the provider, clock, identifiers and admission interfaces into the app runtime. App factories are inert; only explicit startup loads app-local configuration and starts listeners [CB-2, SP-2, RS-2]. Default automated/fresh development paths cannot spend credits. A fake adapter returns authored fixtures through the real application contract, labelled as simulation.

Use an explicit fixed provider endpoint and credentials; reject redirects where the chosen transport permits. Bound request bytes, output bytes/tokens, tool calls, whole-operation time and per-call time. Disable implicit SDK retries unless a separately reviewed bounded retry policy is actually desired. A visitor's new explicit retry is a new operation, not an invisible duplicate. Retailor's inspected Responses transport provides a concrete example of fixed endpoint, zero retries and bounded response reading [RT-2].

Handle refused, incomplete, malformed, oversized, unknown-tool and cancelled outcomes distinctly. Reject a partially valid batch atomically; do not apply the subset that happened to parse. Do not assume provider-side cancellation proves processing or billing stopped. Provider privacy/retention/account settings must be reviewed before transferring personal room photos; local reset cannot recall copies already sent to an external service.

Use foreground stateless requests with explicit `store: false`, bounded supplied context and no persistent provider conversation/file object unless separately justified. Capture these flags in fake transport checks. Response storage disabled does not establish zero retention: verify actual selected-model caching, abuse-monitoring and image/account policies before personal-photo transfer. Local cleanup cannot recall external copies. [Official data controls](https://developers.openai.com/api/docs/guides/your-data).

A server-owned operation deadline applies even when browser disconnect is not propagated; order provider-call, whole-operation, bridge and hosting timeouts with cleanup margin. Test vanished browser without abort propagation, provider ignoring abort, timeout and shutdown. Preserve conservative unresolved-remote accounting: gateway timeout/abort does not prove remote processing or billing stopped.

## 17. Guest lifecycle and privacy

### 17.1 Selected storage policy

The owner selected local refresh recovery for the accepted semantic room, its read-only Before/Current baseline, chosen catalogue references and minimal UI state, with a fixed **two-hour lifetime**. Keep pending proposals, grants, active requests and resource handles ephemeral. Raw room/furniture photos remain in active-page memory only: do not persist them across refresh or include them in the default export. Release them when removed, no longer needed, reset, expired or the page closes. After refresh, restore room data while showing that original photos are unavailable.

An allow-listed projection schema is safer than serializing the entire session object and removing forbidden fields afterward. Retrosum's projection and ScreenPilot's reducer/provider make this ownership concrete [RS-3, SP-3]. If IndexedDB stores accepted semantic room data, identify it as browser storage, with byte bounds, expiry and reset. Do not promise persistence on browsers that deny or evict it.

| Event | Required behavior |
| --- | --- |
| First entry | Create a fresh workspace identity/generation; no metered request automatically |
| Accepted change | Commit semantic state once, schedule bounded persistence, show save failures honestly |
| Refresh | Validate version/expiry/projection; restore accepted data only; no paid operation or preview replay |
| Missing raw photos | Preserve valid room data, show originals unavailable and offer re-add if needed |
| Corrupt/unsupported storage | Ignore unsafe data, offer a fresh workspace and retain a useful explanation |
| Storage quota failure | Continue in memory if possible, show export as recovery; do not claim saved |
| Expiry | Fence obsolete work, clear owned stored data/resources, offer a new room |
| Reset | Confirm an intentional destructive workspace reset; abort/revoke/clear owned resources and create a new generation |
| Import | Validate completely before replacing; warn about unsaved current work; start fresh operation/history identity |
| Another tab | Keep independent room state by default; test namespace/duplication behavior before claiming isolation |

Set expiry two hours from creation of the active guest workspace; ordinary edits and refresh do not extend it. A deliberate new workspace/reset or an explicitly imported project starts a new active identity and lifetime. Enforce expiry on restore and action entry, not just by a timer that can sleep in a background tab. A reset completion must not be reversed by a late persistence write, image decoder or provider response. Use generation-aware storage writes and cleanup. The exact browser-storage mechanism is an engineering choice; the two-hour/transient-photo behavior is an owner decision, not inherited sibling approval.

### 17.2 Export/import

Export/import uses a versioned JSON project containing the current semantic room, the bounded read-only starting baseline, catalogue/rules versions and human-readable provenance labels. Exclude raw photos, chat, active Undo history, pending proposals, provider/grant tokens, keys, blob URLs, server details, executable code and arbitrary remote asset locations. Describe the contents before download. A photo-inclusive export is outside the selected first-release scope.

Import has a strict byte ceiling and structural/semantic validation before replacing the active workspace. Recompute fit diagnostics and build a new active identity. An export's prior revision or claimed confirmation is not a reusable authorization token. Explain missing catalogue versions or unsupported mechanisms instead of silently substituting different physical sizes.

Recovery/project schemas preserve refined half-millimetre poses, physical dimensions and per-fact evidence, never operational replay authority. On a deployment/version update, fence pending work and recover accepted semantics where possible, distinguishing transient photos/drafts/proposals that a reload cannot preserve. No automatic update loop or guaranteed transient-photo recovery claim. The selected non-extensible two-hour expiry has a timing-adjustability limitation; warning/export help usability but alone do not establish WCAG conformance. Its lifetime/extension behavior remains unchanged.

### 17.3 Resource ownership

The session controller owns abort controllers, operation tokens, blob URLs, workers, storage keys, temporary photo buffers and the expiry timer. View components own their controls/subscriptions and GPU resources according to shared cache ownership. Release effects on reset/expiry/unmount; do not dispose shared assets while another live view still uses them. Preserve unrelated browser/app data and other repositories' processes.

Do not log original photos, private filenames, detailed room descriptions, chat transcripts or provider payloads. No background analytics or permanent upload library is required. Reset clears Roomedy-owned local data; already downloaded exports and provider-controlled copies remain outside that local cleanup boundary.

## 18. Bounds, concurrency and costs

### 18.1 Bounds are part of the feature

Except for the owner-selected fixed two-hour guest lifetime, byte/count/time values below are **engineering candidates for measurement**, not approved limits or proven capacity. Their exact values remain open [D-04, D-08]. The foundation/intake plan must identify measurement and enforcement work for one policy and enforce it consistently in contracts, UI, bridge, backend and tests. An unchosen limit must never mean unlimited work.

| Boundary | Candidate starting policy | Evidence needed before final selection |
| --- | --- | --- |
| Selected photos | Up to 6; 8 MiB each; 24 MiB aggregate | Real phone images, comprehension and peak intake memory |
| Image decode | 16 megapixels and 8,000 px per edge; one decode at a time | Supported codecs and decoder memory/failure behavior |
| Normalized provider images | Up to 2,048 px longest edge, 2 MiB each, 6 MiB aggregate | Recognition quality versus transfer/token cost |
| Recognition transport | 24 MiB raw upload ceiling plus bounded framing; separately bounded prepared provider request | Multipart streaming/bridge copies and Base64 expansion |
| Accepted furniture | 40 objects | Useful small-room scope and measured geometry/render work |
| Feature count | 24 openings/obstacles | Real sample needs and check cost |
| Actions in one batch | 32 | Atomic validation time and readable preview size |
| Semantic room and baseline | 512 KiB combined current-room/baseline budget; import/export envelope 1 MiB | Actual records, encoding overhead, migration cost and storage bounds |
| Visitor text | 4,000 characters per request | Product needs and bounded provider context |
| Conversation context | 40 recent turns and 64 KiB serialized semantic/text context | Useful grounding without unbounded transcript growth |
| Undo | 20 entries plus a 2 MiB total snapshot budget | Size distribution; prune oldest entries deterministically |
| Scene proposals | 1 pending proposal; 1 in-flight AI operation per workspace | Supersession, cancellation and mobile behavior |
| Tool loop | At most 4 provider rounds and 16 total tool calls | Coverage of worked scenarios and paid latency |
| Search | At most 20,000 candidates or 250 ms per local search, whichever occurs first; at most 2 returned candidates | Device measurements; result count is not a commitment to comparison UI |
| Deadlines | 60 s assistant / 90 s recognition overall; no hidden retry | Actual provider and bridge timeouts with cleanup margin |
| Provider output | 1 MiB transport cap plus model-specific output-token cap chosen at integration | Error/refusal/tool parsing and selected model |
| Guest expiry | Fixed 2 hours, selected by the owner; raw photos not persisted | Verify restore/action expiry and cleanup; this row is a selected product rule, not an open numeric candidate |
| Backend capacity | 2 expensive operations per instance; no waiting queue; initial hosted max instances 1 | Peak memory and fairness; final cloud limits need approval |

The raw-upload, normalized-image and semantic-JSON ceilings are different boundaries. Base64 can enlarge prepared payloads, and buffering the same body in browser, bridge, parser and provider client multiplies memory. Establish one finite prepared provider-request ceiling after accounting for encoding, image total and semantic context. Reject or downsample deliberately before dispatch; never truncate meaningful input silently.

### 18.2 Shared admission

Recognition and assistant calls share expensive-operation capacity. Acquire an intake slot before accepting large bodies, then a provider/work allowance before dispatch. Return a clear busy result when full. Cancellation releases local resources exactly once; if remote outcome is unknown, retain the relevant in-flight accounting until a bounded completion/deadline policy resolves it. One browser's tabs should not bypass server rate/admission policy.

Recommend scoped short-lived operation grants and a human challenge when opening a public paid demo. Bind operation type, input manifest/revision, expiry and replay protection. Keep a bounded in-memory ledger/counters free of room content if a database is intentionally absent. In-process controls reset on restart and do not enforce a durable account-wide spending cap. A single-instance starting deployment reduces coordination complexity but is not proof of a strict total cost ceiling. Revisit architecture before scaling beyond the assumptions.

Bind a grant to allowed operation and a server-recomputed digest of normalized image bytes/request semantics. Client manifest claims alone are insufficient. Consume atomically before dispatch; bind to boot/process epoch or process-local signing material so restart cannot revive consumed grants. A different runtime can reject safely; document this availability tradeoff. Reject new admissions when the bounded ledger is full rather than evict active replay protection.

Per-process controls and maximum instances=1 are not a durable global spend cap: temporary excess instances and overlapping revisions remain possible. Later paid readiness must explicitly resolve or accept bounded cross-process/account exposure under its own authorization. No database is added by this refinement. Carry restart/scaling/deadline assumptions into local release files and fake two-runtime tests.

### 18.3 Cost policy and external setup

No provider dollar allowance, model tier, funded account, provider key or cloud project has been selected here. Choose a model and image policy using bounded evaluations before public enablement. Record provider usage privately in safe units and correlate with actual account reporting. Visitor-facing furniture prices and budget planning are explicitly deferred, including fictional catalogue prices. This product decision does not remove internal provider/cloud spending controls.

Provider limits, cloud instance caps, operation grants and a paid master are complementary controls. Verify what vendor budget alerts versus enforceable limits actually do; do not call an alert a guaranteed cutoff. The owner must choose funded usage and acceptable outstanding work before paid/public testing. Do not inherit sibling budgets, secret bindings, account sharing settings or spend approvals.

## 19. Visual direction and accessibility

### 19.1 Proposed identity

The owner selected a calm but lively design studio with tactile furniture and deliberate spatial motion. The latest website palette is full of beige/brown/earth/wood tones: oat, sand, beige, walnut and cocoa. Studio chrome may use more neutral black/white. This supersedes the earlier warm ivory/deep green-teal/clay platform direction recorded earlier on 17 October 2026; canonical room/furniture finishes remain independent. The room canvas is the hero. Use clear typography, generous spacing and one consistent icon/material language. This is the selected visual direction; it does not establish a finished logo or actual frontend visual approval. Do not copy Retrosum's vintage brand or Retailor's storefront style automatically.

Offer visually understandable choices, with a room/furniture preview as the visitor selects a variant or finish. Use ghosted proposed positions, affected-object highlights, change summaries and readable check overlays. Proposed furniture must not look indistinguishable from committed pieces. The live app should not need a technical provider-mode switch in the visitor flow.

**Latest owner wording, 17 October 2026:** “color theme should be full of beiges and browns and earthy colors, aka woody colors aka furtnite colors you feel me? color theme of the website .. studio can have more blacks and white ofc”. The selected interpretation is wood/furniture-inspired earth tones for the website and permission for neutral studio tools; it does not change room finish presets, introduce game branding or waive actual visual review.

### 19.2 Motion policy reconciliation

The original Roomedy draft suggested reduced-motion suppression. The supplied generic repo guide and current Retrosum/Retailor operating guidance explicitly require designed motion to remain active and prohibit animation-off/render-off settings or OS-based suppression. This blueprint follows that build direction, replacing the conflicting draft recommendation. The archived draft records the earlier wording; it is no longer current guidance.

Use motion to explain selection, proposals, Apply, Undo and panel changes. Keep it restrained, avoid flashing/parallax or unnecessary continuous camera movement, and preserve readable stable content and keyboard/touch access. Optimize expensive rendering without freezing intended animations. Do not add a user setting that disables the designed experience. Physical-device/accessibility review remains real work, not an automatic claim from a media query or a screenshot.

“Continuous motion” means smooth progress while intended animation is active. Automatic landing movement finishes and settles within five seconds, with stable readable text; avoid perpetual decorative movement/auto-updating text. Preserve active designed transitions without a global off setting. Record criterion-specific findings, not blanket conformance. [Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide).

### 19.3 Interaction requirements

Every important drag action has a numeric/keyboard path. Buttons have clear names and visible focus. Error status uses text/icons as well as color. Selected items and units are announced clearly; live-region messages report meaningful completed changes rather than every pointer move. Keep essential actions reachable at narrow widths, zoom and short viewport heights.

Use semantic groups for view/start choices, readable targets, accessible dialog focus handling and text descriptions for the room/check summaries. For unsupported WebGL or context loss, preserve a usable 2D/numeric route. Test the actual keyboard/screen-reader paths; a canvas label alone does not make a spatial editor accessible.

The fixed two-hour destructive active expiry is not covered by WCAG's over-twenty-hour timing exception. Record this specific timing-adjustability limitation and actual keyboard/focus/zoom/touch evidence. Useful warning/export opportunities do not alone establish conformance. Changing expiry/extension would require an owner product decision and is not selected here. [Timing Adjustable](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html).

### 19.4 Selected product and design refinements

The owner accepted the step-three recommendations on17October2026, explicitly deferring furniture prices and visitor budget planning. These are selected product requirements, not evidence of implementation or actual visual acceptance. Latest20October RM-015AM supersedes the earlier initial-review requirement; P-01/P-07 below now place correction in the studio after processing.

The signature moment is **ask for a useful room change → inspect the coordinated proposal and its reasons → Apply → see the room respond → Undo the whole change if desired**. The photo draft earns trust through correction and honest dimensions. It does not promise automatic exact reconstruction.

| Refinement | Selected experience | Boundary |
| --- | --- | --- |
| P-01. Studio corrections | Studio properties and synchronized3D/2D expose labelled pieces, room features and per-value estimates. Selecting a piece opens its properties; Room owns measurements, condition and openings. | No invented detection boxes or confirmation. Source photos are transient and released at studio handoff; unplaced observations remain contextual notes. |
| P-02. Visual ownership cards | Pair an available source thumbnail with a similar supported furniture representation, dimensions and **Keep / May replace / Remove from plan** choices. | Position and dimension locks are independent. Source photos stay transient; their loss on refresh does not erase accepted room data. |
| P-03. Visual goals and finish directions | Offer relevant goals such as **More desk space**, **Clear the entrance** and **More storage**. Preview the coherent **Warm & simple**, **Light & airy** and **Calm & focused** directions in the main editor. | Establish supported room purpose first. Changes affect supported finishes and eligible proposed pieces while preserving retained furniture/locks. Exact swatches and assets are design implementation work within the selected direction. |
| P-04. Contextual assistant actions | Selecting a desk offers **Move near the window** or **Check chair space**; selecting an issue offers **Explain this** or **Find another arrangement**. Include useful object cards, suggestions and a short skippable tour, with automatic fresh-room welcome under RM-015W. | Selection itself never dispatches a metered request. Deliberate supported actions use the same proposal/command authority. |
| P-05. Explanatory previews | Show affected footprints/ghost positions, a short change list, what stays protected, computed checks and remaining unknowns. Keep Apply/Cancel beside the room. | No invented improvement percentages or quality scores; preserve atomic validation and revision fencing. |
| P-06. Before/Current peek | Include one read-only accepted starting layout and compare it with the committed current room from the same editor view/camera. | This selected refinement uses a bounded baseline, not multiple generated alternatives or a second editable state authority. Undo is separate. See section 9.6. |
| P-07. Photo-to-studio transition | Choose photos, Continue through designed processing, then enter the editable default3D studio directly. Panels adapt around the canvas and corrections use existing commands/Undo. | No redundant draft page, invented progress percentage or inferred confirmation. Fake preview is finite/cancellable; live timing follows actual work. |
| P-08. Lively room demonstration | A lightweight scripted main-editor cutaway on the landing demonstrates desk/chair coordination, a clear access overlay and Undo. Use the selected beige/brown/earth/wood website direction with polished stylized furniture and deliberate motion; studio tools may use black/white neutrals. | Label scripted behavior; load the real 3D editor only at its owning stage. No animation-off/render-off controls or OS suppression. |

Retrosum's coherent workspace/controller and useful assistant are the main interaction reference; Retailor contributes visual choices and reviewed action cards. Roomedy keeps its own visual identity. Section 27.5 records the official product/principle research that informed these ideas; owner selection does not turn that desk research into measured usability evidence.

### 19.5 Selected scope and engineering boundaries

The first release covers rectangular bedroom/home-office combinations and a coherent bed, desk, chair, wardrobe and limited storage catalogue. Keep empty, partly furnished and existing-room journeys. The visitor chooses the supported room purpose; a photo does not silently classify an empty room as a bedroom.

Use procedural adjustable essentials and selected compatible assets with polished stylized cutaway rendering. Similar supported models at reviewed physical dimensions are accepted for owned items; exact photo-to-furniture replicas remain outside scope. The website palette is oat/sand/beige/walnut/cocoa and earthy wood tones. Studio chrome may use neutral black/white; room/furniture finishes remain semantic data independent of platform styling. Use the generic **Roomedy assistant** label; a separate assistant name and finished logo are not prerequisites to tickets. Final artwork/type/material implementation still needs actual visual review.

Precision furniture placement is in 2D, with drag, rotate, snap and numeric/keyboard controls. The 3D main-editor view supports orbit, zoom/reset, selection and inspection. Direct 3D dragging is deferred. One proposal is visible at a time, plus the selected bounded Before/Current peek at the accepted starting arrangement. Multiple generated alternatives are deferred.

Inputs are authored samples, room/furniture photos and typed dimensions. Floor-plan/PDF import, furniture prices, visitor budgets, shopping links/checkout, AR, multi-room plans, additional shapes and photorealistic exports are deferred. Do not introduce price data or budget questions into catalogue, assistant tools, goals, exports or marketing.

Guest recovery restores accepted semantic room data and its read-only baseline locally for a fixed two-hour lifetime. Raw photos stay transient; export/import keeps versioned semantic project data without the original images. Exact package versions, measured byte/count/search limits, selected licensed asset files and low-level module choices remain engineering work. The owner's product choices are settled without requiring them to specify those internals.

### 19.6 Prevention guidelines from prior visual feedback

The owner asked to learn from four actual Retailor chats before implementation. The [evidence-based lessons](references/LESSONS_FROM_VISUAL_FEEDBACK.md) and [review checklist](design/REVIEW_CHECKLIST.md) now govern the existing plan. Their purpose is to avoid repeated preventable corrections, not to import another product's UI. Roomedy's palette, short skippable tour (automatic welcome now explicitly selected in RM-015W), selected export, authored sample and 2D-review/main-editor-3D boundary remain intact.

| Guideline | Roomedy requirement |
| --- | --- |
| Useful and concise | Every new control/copy block serves a documented task; no filler slogans, developer CTAs, duplicate status banners or unasked-for settings |
| Stable and consistent | Fonts/marks/spacing survive refresh; fixes cover relevant component states while room finishes stay independent of platform chrome |
| Room first | The room and next action remain usable on short laptops and narrow screens, without dead columns, oversized chat panels or overlapping scrollbars |
| Smooth and coordinated | Actual panel/preview geometry moves together; entrance motion starts when ready and loading indicators keep running; fresh-room welcome appears immediately; guided targets/cards appear together after actual readiness |
| Clear interaction | Reachable primary actions, field-specific validation/units, accessible Send/Enter behavior and object cards that focus real room IDs |
| Honest correction | Partial usable inference stays reviewable; selected files/corrections are preserved; technical failure and hard arrangement blockers remain distinct |

Each feature owns its affected visual/error/restored states and representative viewport checks. RM-015 consolidates the full matrix and actual owner visual decision. A snapshot file, DOM simulation or declared animation is not proof of a good rendered experience; current browser-policy limits remain respected.

## 20. Failure and recovery

| Situation | Visitor experience | State/resource rule |
| --- | --- | --- |
| Unsupported or oversized image | Explain the format/limit and retain other eligible selections | No provider dispatch; revoke rejected file resources |
| Unclear recognition | Highlight uncertainty; correct features or enter dimensions | Draft remains separate from accepted room |
| Unknown fit-critical value | Focus the relevant measurement question | Dependent checks remain unassessed |
| Impossible/unsolved request | Explain conflicts or bounded search exhaustion; offer supported choices | No silent resizing, unlocked move or fake success |
| Invalid tool output | Safe failure with manual continuation/retry choice | Entire candidate rejected; current room unchanged |
| Provider refusal/unavailability | Short clear explanation and continued manual editing | No fake fallback or automatic new paid operation |
| Timeout or disconnect | Keep current room; show cancellation/unknown remote result accurately | Abort local work; fence late responses; bound cleanup |
| Stale proposal | Explain that the room changed; offer a new deliberate request | Never overwrite a newer revision |
| Duplicate Apply | Already-applied receipt or harmless no-op | No duplicate objects/history/side effects |
| Asset load failure | Identified compatible procedural representation or clear unavailable variant | Semantic dimensions and checks unchanged |
| WebGL failure/context loss | Continue in 2D and preserve room data | Dispose/recreate owned view resources safely |
| Storage unavailable/full | Continue in memory, show unsaved status and export option | Never claim successful refresh recovery |
| Invalid import | Explain version/structure issue; retain active room | No partial replacement or arbitrary resource fetch |
| Reset during work | New empty workspace immediately; clear old resources | Late response/write/decoder cannot resurrect prior data |
| Busy public service | Clear busy status and later deliberate retry | No hidden unbounded queue or retries |

Source-controlled friendly validation is allowed. Raw exceptions/provider payloads must not enter the UI or application browser-console logging. Preserve useful private server/operator diagnostics and source/request correlation. Do not suppress global console/framework logs as a way to hide failures.

## 21. Security and diagnostics

This is proportionate design guidance, not a performed security audit. The later audit phase must inspect the implementation and dependencies and leave findings for owner review.

Protect the provider boundary with fixed operations, same-origin mutation checks, authenticated hosted service identity, scoped grants, finite admission and safe parsing. Bind state-changing local actions to the current room revision and real visitor intent. Secrets remain backend-only. A browser-supplied role, provider setting or `confirmed=true` flag cannot authorize paid calls or unlock protected dimensions.

Bound image bytes and decode dimensions before costly work; validate file signatures and supported codecs; reject archive/bomb inputs and unsupported formats. Keep image preparation isolated from arbitrary paths/commands. Project imports are data and can reference only supported catalogue records; no remote URL fetching, script execution or path traversal. Escape plain-text labels in the real UI and never render provider HTML directly.

Treat room photos, labels, user text and tool output as untrusted. Text embedded in an image cannot alter system policy or introduce a new tool. The assistant sees allow-listed context and returns typed proposals. Validate the complete resulting document and starting locks again on Apply. Neither schema conformance nor the model's explanation supplies action authority.

Private diagnostics should use fixed operation/error codes, request references, durations, byte/count bounds and usage units without original photo bytes, filenames, room descriptions, chat content, tokens or credentials. Readiness/config reveal only public capabilities. Keep existing backend/operator logs when refining the implementation, and document how to diagnose a failure without exposing its private inputs.

Production release checks must verify origin handling, no unintended public backend invocation, no provider key in browser bundles, challenge/grant replay/expiry, out-of-order operations, reset fences, cancellation and dependency/image findings. No cloud scanner or metadata export is authorized by this documentation work.

Surface-specific privacy applies: the active page may show transient source photos and room/chat content; allow-listed current/baseline semantics may recover/export. Original photos, chat/provider payloads, credentials and operational grants do not recover/export. Private input content and raw failures stay out of diagnostic logs, public diagnostic envelopes, URLs and the application browser console. This does not prohibit the product's intended content display or semantic project export.

## 22. Local engineering conventions

### 22.1 Toolchain and command surface

Recommend Node's supported LTS line, pinned pnpm, strict ESM TypeScript, ESLint, Prettier, Vitest and Supertest for the API. Select current compatible supported versions during foundation work, rather than copying sibling patch numbers. Enable strict checking and relevant optional-property/index/catch/fallthrough safeguards. A lockfile is required when packages are created.

The future root command surface should be small and familiar:

```text
pnpm install --frozen-lockfile
pnpm build:shared
pnpm dev:backend
pnpm dev:frontend
pnpm format:check
pnpm lint
pnpm typecheck
pnpm check:boundaries
pnpm test:unit
pnpm build
pnpm check
```

RM-001 establishes these commands; actual results are recorded in [its validation evidence](validation/RM-001.md). `pnpm check` should compose settled formatting, lint, types, boundary checks, isolated tests and builds. Shared packages build before apps. Dev and production Next output should remain separate when both workflows need to coexist, following Retailor's practical separation.

### 22.1.1 RM-001 selected foundation policy

Pinned runtime: Node 24.19.0 (supported 24 LTS line), pnpm 11.25.0; Next 16.4.2/React 19.3.1; Three 0.186.1/Fiber 9.8.2/Drei 10.7.9; TypeScript 6.0.3/Zod 4.6.7/Express 5.3.0; ESLint 10.13.0/typescript-eslint 8.71.2/Prettier 3.9.10/Vitest 5.0.5. TypeScript 7 is deliberately outside this set because the installed linter declares support below 6.1. Public registry peer/engine metadata and official support documentation were checked; see [RM-001 evidence](validation/RM-001.md). This is a reproducible baseline, not a claim of latest-patch security acceptance.

`packages/contracts/src/policy.ts` owns finite enforced starting defaults from §18: 6 photos, 8 MiB each/24 MiB raw total, 16 MP/8000-edge decode sequentially, normalized 2048 edge/2 MiB each/6 MiB total, and a separate **10 MiB prepared provider-request ceiling** (8 MiB Base64 plus 2 MiB context/framing allowance). Furniture/features/actions 40/24/32; current+baseline 512 KiB, project envelope 1 MiB; text 4000 characters, context 40 turns/64 KiB; Undo 20 entries/2 MiB; one proposal and one AI operation; four rounds/16 tools; search 20000 candidates/250 ms/two internal results; assistant/recognition 60/90 seconds; provider output 1 MiB/4096 fragments; two expensive operations per instance. Room edges max 20000 mm, furniture edges 10000 mm, signed centers bounded to ±40000 mm. Foundation public responses are bounded to 16 KiB/256 fragments/3 seconds.

Except the owner-selected fixed two-hour lifetime, these remain **provisional engineering defaults**, not measured capacity. Contracts enforce structure/counts/integers/versions; frontend intake owns decode/normalization (RM-007), bridge/backend transport/admission owns bytes/fragments/deadlines (RM-008), spatial/search owns work/locks/atomic batches (RM-003/009), and the session controller owns history/lifetime/storage (RM-005/012). RM-015 measures practical limits. No metered operation is enabled before admission; the output-token cap/model remain unselected until integration.

Canonical schema version 1 uses X east/Z south/Y up, northwest origin, integer mm, footprint centers, quarter-turns 0–3 and local front +Z. Version labels are `catalogue-v1` and `rectangle-quarterturn-v1`. Unknown measurements carry null value/source; known values carry bounded provenance/source IDs. Confirmation is a semantic label, never authorization. Wire identities cannot carry origin/grants. Model action schemas omit unlock/confirmation; trusted controllers assign command origin, and RM-003 applies starting-state rules. Project/recovery schemas allow only semantic current/baseline and minimal view state, never photos/chat/history/operations/runtime capabilities. Catalogue record resolution and geometry are required in their owning later packets.

**Approved RM-003 implementation decisions:** furniture centres permit bounded numeric half-millimetres while dimensions remain integer millimetres. Pose evidence has `unknown | estimated | extracted | scan-derived | confirmed | planned` status and bounded source ID; trusted moves assign planned placement. Check confidence distinguishes planned geometry from observed confirmation. Features carry wall/mechanism/hinge evidence, including unknown wall. Command envelopes use positive integer `commandSequence`; workspace high-water sequence increases monotonically, a bounded recent exact-payload cache prunes, old retired sequences reject stale, and Undo never rewinds it. Owned physical-size correction is independent of the asset range, with a single bounded-box fallback when needed; proposed variants remain strict. These are selected contracts to implement/test, not evidence that unfinished code already passes them.

### 22.2 Dedicated ports and startup

Recommend frontend `127.0.0.1:4320` and backend `127.0.0.1:4321`, avoiding the reference defaults 3000/3001/4000 and Retailor 4310/4311. No listeners were returned for 4320/4321 during documentation inspection, but ports must be checked again at actual startup. These are proposed Roomedy defaults, not running services or authorization to take an occupied port.

Build shared prerequisites, start backend, verify non-metered liveness/config, then start frontend and verify the actual page. Missing live configuration must leave paid features unavailable without breaking the manual editor. A returned process PID is not readiness. An AI-unavailable readiness response is distinct from a dead process.

Long-lived app startup later follows the run/restart skills and explicit sandbox escalation; documentation preview is separate. Reuse a healthy matching Roomedy instance for a run request. For restart, stop only verified owned launcher/watcher/descendant processes, verify listeners and stable cleanup, then relaunch. Do not kill by executable name or silently select another port. On Windows, detach agent-managed background helpers hidden and track their actual PID/owned resources.

### 22.3 Configuration

Use ignored app-local `.env.local` files and source-controlled `.env.example` schemas with blank secrets/user-owned identifiers. The explicit backend entry point loads its local file; Next owns frontend loading. No root secret file or environment reads inside shared packages. Never read sibling local secrets to diagnose setup.

Proposed settings are `APP_ENV`, `FAKE_MODE`, `PAID_DEMO_ENABLED`, backend-only provider key/model policy, canonical frontend origin and private bridge origin/audience/identity settings. Derive capabilities from actual validated configuration. Avoid duplicate mode flags and project-specific signoff switches copied from a sibling. Numeric work limits live in one owned policy, with only intentional operational overrides.

Fresh local development and all automated tests use fake mode and paid-off defaults. Public production must not disguise fixtures as real processing. A later live mode requires deliberately selected model, credentials, funded usage and explicit authorized testing. Keep the paid master effective regardless of other flags.

### 22.4 Code and delivery discipline

Keep framework routes thin, domain functions pure, provider SDK types inside adapters and side effects under explicit owners. Use named domain modules rather than catch-all helpers. Reuse a component when its behavior is actually shared; do not force unrelated features into a giant generic abstraction. Avoid mirroring room state across panels.

Tests install fake/paid-off configuration and deny external networking before app modules load. Imports must not load local environment, listen or contact providers. Use meaningful boundary/failure behavior tests, rather than tests that merely assert implementation structure. Never point deterministic tests at an already-running live instance.

When implementation is explicitly authorized after ticket-plan review, execute one dependency-ready packet at a time, validate the settled diff read-only, independently confirm findings, fix and revalidate. The [ticket index](tickets/README.md) uses the approved `RM-###` convention. The owner specifically authorized step-six `RM-000` documentation/ticket commits through the [file-level allocation](commit-plans/RM-000.md). The later step-seven instruction separately authorizes local implementation commits after validation, in fake mode only. Push and external actions remain unauthorized.

### 22.5 Efficient iteration, quality and security from prior feedback

Apply [lessons L-18–L-24](references/LESSONS_FROM_VISUAL_FEEDBACK.md) during the owning work. Use normal hot reload and scoped backend restarts for visual iteration, preserve configured manual runtime mode and keep automated fake/paid-off isolation independent. Focused meaningful checks belong during edits; applicable full gates run at the settled ticket/cohesive batch. Do not rebuild the whole stack after every small copy change, write CSS/label mirror tests or inherit a different session's temporary test deferral.

Keep deterministic tests on controlled matching/stale evidence fixtures while the actual release verifier still rejects mismatched source/image bytes. Preserve functionality, designed motion, one state/geometry authority and private operator diagnostics. Refactor only for a demonstrated correctness/ownership/efficiency need; no speculative enterprise service, generic framework or LOC-driven authority split.

Security presentation can be quiet without weakening proof, grants, replay, capacity or failure recovery. Bound retained stream-fragment/object overhead as well as payload bytes. Use safe backend-only decision codes/counts/references, never raw photos/room/chat/provider payloads in public UI/browser logs. Audit actual reachability, patch availability and current candidate evidence proportionately. The referenced security-without-review instruction does not transfer: Roomedy retains its manual finding-selection gate.

## 23. Deployment preparation

### 23.1 Recommended service pair

Follow the inspected ScreenPilot/Retrosum/Retailor pattern: public Next frontend, private IAM-authenticated Express backend, Artifact Registry images, backend-only provider secrets in Secret Manager and dedicated runtime identities. The frontend identity invokes only the intended backend; it does not need the provider key [SP-4, RS-5, RT-5]. The official Cloud Run service-to-service guide describes granting the calling service account the receiver's invoker role and using audience-bound identity. [Cloud Run service authentication](https://docs.cloud.google.com/run/docs/authenticating/service-to-service).

Do not equate ingress configuration with anonymous invocation. Verify actual IAM and network behavior on the deployed pair. The browser uses only relative frontend operations. The Next bridge forwards fixed paths, discards browser-supplied upstream credentials/targets and adds its own hosted identity. No downloaded service-account JSON key is part of the proposed baseline.

No project, region, billing account, service identity, registry, secret binding, domain registration or deployment has been selected/executed for Roomedy. tryroomedy.com is the selected spelling; availability, ownership, DNS and TLS are separate external checks. This document prepares the approach, not cloud resources.

### 23.2 Local release artifacts, later

Prepare two reproducible multi-stage Docker images with supported pinned bases, frozen installs, narrowly packaged runtime output, non-root execution and injected `PORT`. Include selected furniture assets, fonts and workers in the correct runtime package. Exclude `.env.local`, private source material, test outputs, captures, caches and full development dependency trees.

Next standalone output needs deliberate inclusion of static/public assets and monorepo tracing. Verify packaged files rather than inferring success from `next build`. [Next output configuration](https://nextjs.org/docs/app/api-reference/config/next-config-js/output). Backend packages use built public workspace exports, not source-store symlinks. Record actual file bytes, lockfile and image digests; establish LF text checkout policy and preserve binary bytes, applying Retailor's cross-platform release lesson without copying its exact old image [RT-5].

Linux image build/runtime evidence, package inventory, non-root identity, health, shutdown, asset availability and fake/paid-off probes are distinct from Windows source checks. Do not claim hosted/private-IAM/provider acceptance from a successful container build. Scanner findings and vendor patch status are checked on the actual candidate later.

Include verified full CI action commit identities, pinned base-image/platform/tool identities and all relevant bytes in release proof; mutable action tags are insufficient identities for this selected policy. Exercise local two-build old-client/new-server cases, lazy cutaway chunks/search workers, schema/catalogue/rules mismatch and rollback. Choose deliberate compatible-asset/deployment-ID/update behavior, fence pending work and preserve accepted semantics where possible. A framework reload does not guarantee transient photos/drafts survive; prevent reload loops and undisclosed destructive updates. [Next version skew](https://nextjs.org/docs/app/guides/self-hosting#version-skew). Carry process/boot grant and timeout/scaling assumptions into the runbooks without claiming a single instance is a global lock or funded cap.

### 23.3 Authorized rollout sequence

1. Finish local implementation, clean checks, owner visual review and the later security review/fixes.
2. Build and verify a recorded local Linux image pair from exact accepted inputs.
3. Obtain owner choices/authorization for project, billing, region, identities, resources and publication.
4. Prepare the backend private and paid-off; grant only the approved frontend invocation identity.
5. Publish the frontend only after explicit authorization; verify no-cost pages/config/bridge and anonymous backend denial.
6. Verify secrets/model policy, human challenge, operation limits and account controls without assuming they authorize a paid test.
7. Run only a separately approved bounded live/hosted walkthrough; record actual inputs, usage and outcomes safely.
8. Configure the selected domain/HTTPS only within its own authorization; check managed URLs as well as the custom domain.

Keep a known compatible frontend/backend image pair and rollback instructions. Include an emergency paid-off path that preserves manual editing. Changes in contracts/catalogue/rules may affect old browser exports, so version compatibility and failure behavior need explicit checks before traffic moves.

**RM-014 local preparation, 18 October2026:** [Operations](operations/README.md), [exact inputs/proof](operations/release-inputs.md), [stale clients](operations/stale-client.md) and [actual validation](validation/RM-014.md) now exist. Pinned non-root image files, strict conditional probes, fixed future service identity, compatible asset retention and reviewed rollout/rollback files are prepared. Windows production A/B/update/rollback and current API checks ran; the Docker Linux engine is absent, so actual Linux image/runtime/hosted/provider acceptance is not claimed. Owner visual review remains RM-015.

## 24. Testing and acceptance evidence

### 24.1 Layers of proof

| Layer | What it proves | What it does not prove |
| --- | --- | --- |
| Pure spatial tests | Deterministic geometry, commands and history under specified inputs | Accuracy of unconfirmed room measurements or visual recognition |
| Contract/adversarial tests | Input/output bounds, schemas, replay/revision rules and safe rejection | Provider interpretation quality |
| Fake full flow | UI/use-case integration, cancellations and controlled failure paths | Real AI, paid usage or production performance |
| Browser checks | Actual rendered interaction at tested viewport/mode | Physical-device GPU behavior, every assistive technology or owner acceptance |
| Bounded live evaluation | Selected model behavior/latency/usage for specified cases | Broad guaranteed accuracy or hosted capacity |
| Linux packaging/runtime | Actual image contents/startup/assets and selected probes | Hosted IAM, domain/TLS, billing or public abuse resistance |
| Hosted walkthrough | The deployed candidate under the named bounded conditions | Unlimited traffic, full account enforcement or every real room |

### 24.2 Required behavior matrix

| Scenario | Acceptance to verify during implementation |
| --- | --- |
| Empty room | Add essential supported pieces and reach an editable room |
| Partly furnished | Retained dimensions/locks survive additions and styling |
| Rearrange existing | No new purchases; preserve retained pieces and protected poses |
| Photo correction | Missed/misidentified features can be corrected without fabricated confirmation |
| Photo processing sequence | Explicit Continue opens processing, then directly opens the editable default3D studio with2D available; uncertainty and correction authority remain |
| Provenance | Estimated/extracted/unknown values never become confirmed silently |
| View synchronization | Manual and applied AI changes update plan, cutaway, inventory and properties consistently |
| Coordinates | Rotation/center conventions agree in plan, renderer and geometry at boundaries |
| Batch validation | Coordinated moves evaluated atomically; no partial commit on failure |
| Door/storage/chair checks | Actual modeled mechanisms/areas are respected; unsupported checks stay unassessed |
| Baseline conflicts | Real-room issues remain visible; repair policy introduces no hidden new blockers |
| Starting locks | Model cannot unlock then mutate a protected piece without explicit visitor authority |
| Stale result | Manual change/import/reset/expiry/new operation prevents an older result from applying |
| Duplicate Apply | Same command commits once and yields one history entry |
| Undo | Reverses a whole instruction as a new revision without reviving private uploads/requests |
| Before/Current peek | One read-only starting baseline; same editor view/camera; current room, revision, Undo and provider dispatch remain unchanged by inspection |
| Selected lifecycle | Fixed two-hour semantic-room/baseline restore; raw photos absent after refresh; reset/expiry clear owned state and cannot be reversed by late work |
| Deferred pricing | No furniture price/currency/cost totals, budget goals, affordability tools or shopping/checkout flow in the first release |
| Search exhaustion | No-candidate-found is never presented as a mathematical impossibility proof |
| Provider failure | No fake success, hidden retry or discarded committed room |
| Lifecycle | Restore, expiry, quota failure, import/export and reset match the chosen policy |
| Capacity | Expensive routes share finite admission; limits hold at exact boundaries and cleanup releases once |
| Rendering | Responsive canvas/controls, successful asset fallbacks and usable 2D after WebGL failure |
| Accessibility | Actual focus, keyboard/numeric controls, meaningful messages and touch target use |
| Privacy | No raw input/secret leakage to logs, URLs, exports or public bundles |

### 24.3 Geometry and command corpus

Use authored synthetic rooms with independently calculated expected values: exact wall contact, one-millimetre crossing, overlaps at each supported orientation, door hinge variants, known/unknown sill heights, locked pieces, unchanged dimensions, narrow wardrobe access and chair/desk relationships. Include atomic swaps, invalid IDs, non-finite/extreme numbers, duplicate commands and expired/stale tokens. Test permutations and round trips where meaningful; do not merely compare the engine with itself.

Keep sample furniture geometry honest and clearly fictional. Do not use private room photos as source-controlled fixtures. An asset's decorative appearance cannot establish the correctness of its footprint or clearances.

### 24.4 Live and performance evaluation

When later authorized, compare expected actions and computed facts across the worked requests, ambiguous references, contradictory locks, unsupported variants, difficult photos and current-revision edits. Record failures and correction rates as well as successes. Evaluate recognition and geometry separately. Select the model from actual bounded quality/latency/usage evidence, not its name alone.

Measure cold/warm editor load, transferred assets, memory, pointer response, search time, frame behavior during Apply/Undo and provider end-to-end time. Test narrow phones, tablets, small/large laptops, short heights, at least one intermediate width and actual available devices. Start with a small sample, then the proposed maximum room/photos. No performance numbers in this blueprint are achieved results.

Declare case pass/fail before tuning. Zero tolerated unauthorized mutation, false confirmation, stale Apply, silent fake fallback or non-AI provider dispatch in the exact tested corpus. Report category/opening coverage, false merges/splits, uncertainty honesty, manual repair actions, exact n and individual failures separately. Group development/held-out data by physical room/object; add reorder/orientation/missing-view perturbations and independent human-labelled semantics. A tiny corpus supplies no broad accuracy guarantee. [Official evaluation guidance](https://developers.openai.com/api/docs/guides/evaluation-best-practices).

Declare practical performance budgets from first measurements before RM-015 sign-off, with browser/device or throttle, build mode, room/photo count, cold/warm state and repetitions. Measure discrete action latency, continuous drag/orbit frames, decode peak, search/abort latency and Apply/Undo motion separately. Finiteness alone is insufficient, and INP alone cannot establish continuous canvas behavior. Preserve the feature-owned internal visual baseline and the actual later owner visual stop.

## 25. Delivery sequence

The [step-five ticket plan](tickets/README.md) now defines the detailed execution queue. It contains **20 standalone packets**, proposed prefix **RM**, direct dependencies, file responsibility allocation, concrete steps, unchecked acceptance, focused verification and explicit local/owner/external evidence gates. It follows the owner-selected product scope and actual sibling ticket patterns. RM-001/002 have committed local evidence; RM-003 is in progress and unvalidated; RM-004–RM-020 remain Planned. The owner approved the later review refinements and authorized ordered fake-mode execution/validation and per-ticket local commits; result gates and external authority remain separate.

| Delivery stage | Owning packets | Complete outcome |
| --- | --- | --- |
| Foundations | RM-001–RM-003 | Runnable safe workspace; dimensioned licensed catalogue/fixtures; pure spatial checks, commands and Undo |
| Entry and editable room | RM-004–RM-007 | Landing/guest entry; one controller and precision plan; synchronized cutaway; rough 2D photo/manual review |
| Safe intelligent assistance | RM-008–RM-011 | Shared admission/transport; bounded search; correctable recognition; grounded assistant with one reviewed proposal |
| Lifecycle and local proof | RM-012–RM-014 | Before/Current, fixed two-hour semantic recovery/export/import; independent evaluation kit; Linux release files/proof/runbooks |
| Measured product and owner review | RM-015 | Responsive/accessibility/device/performance matrix and actual frontend visual decision |
| Quality and reviewed security | RM-016–RM-018 | Functionality-preserving quality execution, audit-only security report and only explicitly selected remediation |
| Handoff and conditional release | RM-019–RM-020 | Refreshed local evidence; later separately authorized paid/hosted/domain/pre-sharing acceptance |

The [queue](tickets/README.md#dependency-ordered-queue) is dependency-ordered and its [coverage map](tickets/README.md#coverage-map) traces selected features/decisions to packet owners. It avoids a second room/geometry authority and puts finite provider admission before recognition/assistant dispatch. Baseline capture, generation fences and basic expiry start with the controller; RM-012 completes storage/export rather than retrofitting those safety contracts after every feature.

The smallest coherent prototype remains one fictional small bedroom, bed/desk/chair/wardrobe, two views, manual edits, one meaningful assistant command, preview/Apply/Cancel/Undo and basic boundaries/collision/door checks. The full queue covers all selected first-release behavior, not only that prototype. Native scans, complex rooms, AR, photorealistic exports, pricing/budget planning and multiple alternative layouts remain outside it.

The plan's [workflow checkpoint map](tickets/README.md#workflow-checkpoints-and-eligibility) separates ticket-plan approval, future implementation/Git authority, actual frontend visual review and owner security finding selection. Local release files are required even if credentials are absent. Actual paid/provider/cloud/domain work remains conditional; a locally complete ticket never fabricates those results. The current owner instruction is to update these requirements, then resume RM-003 and continue in numeric order in fake mode, validating/committing each completed ticket and stopping at review gates or 0% usage. No paid call or deployment is authorized.

## 26. Decision register

### 26.1 Owner answers to the step-three questions

The owner answered the reviewed Q-01 through Q-09 recommendation set on 17 October 2026: **“ok let's leave prices and budget planning out for now. use your recommendations for the rest and update the docs.”** This records selected product scope and documentation authorization, not ticket creation, implementation, Git, paid/provider/cloud or final interface approval. The prior rough-2D-only initial-review decision remains unchanged.

| Question | Owner-selected outcome | Scope trace |
| --- | --- | --- |
| Q-01. First-release room scope | Rectangular bedroom/workspace combinations, with bed, desk, chair, wardrobe and a few storage additions. Keep room purpose explicit and support empty/partial/existing conditions. | D-02, D-06; sections 2 and 5 |
| Q-02. Visual direction — latest correction | Beige/brown/earth/wood website tones (oat, sand, beige, walnut, cocoa), with black/white studio neutrals permitted; polished stylized furniture and deliberate motion. Earlier teal platform direction is superseded; furniture finishes stay independent. Actual artwork and implemented UI still need visual review. | D-01, D-02; section 19 |
| Q-03. Owned furniture representation | Similar supported models at reviewed dimensions are accepted, with clear representation/provenance labels. Exact arbitrary photo-to-furniture reconstruction is deferred. | D-02; sections 6 and 13 |
| Q-04. Main-editor manipulation | 2D drag/rotate/numeric/keyboard placement; 3D orbit, selection and inspection. Direct 3D dragging is deferred. | D-07; section 7 |
| Q-05. Comparison | One proposal at a time plus one bounded read-only Before/Current peek. Multiple generated alternatives are deferred. | D-09, D-13, P-06; section 9.6 |
| Q-06. Input methods | Samples, room/furniture photos and typed dimensions. Floor-plan image/PDF intake is deferred. | D-03; sections 5 and 6 |
| Q-07. Furniture prices and visitor budget planning | Explicitly leave them out for now, including fictional prices, shopping/cost totals and budget goals. Internal AI/hosting spend controls remain required. | D-10; sections 2, 13, 16 and 18 |
| Q-08. Guest recovery and photos | Fixed two-hour local semantic-room recovery with export/import; original photos remain transient and do not survive refresh through persistence. | D-05, D-13; section 17 |
| Q-09. Product/design refinements | Adopt guided sketch corrections, visual ownership/goal/style choices, contextual assistant actions, explanatory previews, the Before/Current peek, sketch-to-studio transition and lively landing. Use the generic Roomedy assistant label. | P-01 through P-08; section 19.4 |

The selected Before/Current peek is the bounded comparison recommended in Q-05. It is not permission to introduce a multi-candidate workspace. Exact palettes/assets/branding details follow the selected direction; new material product scope requires an explicit later decision.

### 26.2 What is settled, deferred or still requires engineering evidence

| ID | Current disposition | Remaining work |
| --- | --- | --- |
| D-01 | Visual direction and generic assistant label selected | Implement polished artwork/type/materials and a final mark, then obtain actual frontend visual approval |
| D-02 | Furniture scope, similar-model representation and stylized quality direction selected | Select/prepare exact licensed assets and confirm dimensions, rendering and device behavior |
| D-03 | Floor-plan image/PDF intake deferred | No first-release importer or intake CTA |
| D-04 | Finite room/upload/project bounds required; numeric candidates remain engineering values | Measure and fix one enforced policy in the owning foundation/intake packets |
| D-05 | Two-hour local semantic recovery and transient raw photos selected | Implement the storage mechanism, generation/expiry fences and honest quota/missing-photo recovery |
| D-06 | Rectangular bedroom/workspace first release selected; quarter-turn rotations are the engineering baseline | Define/test supported mechanisms, tolerances and clearances; do not claim code/compliance certification |
| D-07 | Precision 2D editing with 3D orbit/selection/inspection selected | Implement shared selection and accessible numeric/keyboard controls; defer direct 3D dragging |
| D-08 | Server-side GPT integration remains the documented direction; exact model/funded evaluation undecided | Select a compatible model with bounded authorized evaluation; no paid call is authorized here |
| D-09 | One proposal and a read-only Before/Current baseline selected | Implement one canonical current room and finite baseline storage; defer alternative-layout comparison |
| D-10 | Furniture prices and visitor budget planning deferred by explicit owner decision | Exclude monetary catalogue fields, affordability goals, totals and shopping features |
| D-11 | Use the documented Next/Express/contracts/spatial engineering backbone to plan this product | Pin compatible dependencies; prepare Cloud Run locally later. Actual project, identities, region, account and deployment remain separate |
| D-12 | Preserve disclosed baseline issues, reject new hard conflicts and label approximate/unassessed checks | Define/test deterministic repair acceptance and explicit measurement corrections without inventing dimensions |
| D-13 | Bounded shared Undo and read-only baseline selected; Redo deferred | Measure history/byte limits; preserve baseline through selected recovery/export without restoring expired operations/photos |
| D-14 | No external resource/account/domain operations selected or authorized | Obtain actual owner inputs and authorization only when their owning release/live work requires them |

The owner has answered the product question set; no further product answer is required to describe this scope. Recognition accuracy, geometry, actual visual quality, device performance and provider/hosted outcomes remain unverified. The later step-five request now has an owner-approved [detailed 20-ticket plan](tickets/README.md) with the approved feedback guidelines. Its exact engineering/model/asset choices are evidence-bearing implementation work, not invented owner answers. The separate step-six request authorized RM-000 docs only; the subsequent step-seven request now authorizes ordered fake-mode implementation/validation and per-ticket local commits. RM-001 is implemented locally; hosted CI is unverified.

**D-15 — Approved review refinements:** PR-01–PR-15 are adopted into their existing owners, with unchecked new acceptance. O-01 preserves only an uncertain-draft adapter seam and defers model downloads/GPU/runtime/benchmark execution; O-02 measures conservative door false rejection before considering precision geometry; O-03 adopts deterministic decision-relevant guided questions. The [review](reviews/2026-10-17-plan-review.md), [exact documentation allocation](commit-plans/PLAN-REFINEMENT-2026-10-17.md) and [documentation checks](validation/PLAN-REFINEMENT-2026-10-17.md) record adoption separately from execution. RM-001/002 receipts remain dated evidence, not proof of new downstream criteria.

## 27. Primary research and source register

### 27.1 Roomedy source material

- [Root README](../README.md): original concise product promise.
- [Original Roomedy Markdown](drafts/2026-10-17/ROOMEDY.md): supplied detailed draft and historical research links.
- [Original concept HTML](drafts/2026-10-17/ROOMEDY_OVERVIEW.html): source SVG interaction and warm studio exploration.
- [Generic repo guide](GENERIC%20REPO%20GUIDE.html): owner's step-one documentation prompt and later workflow; unchanged.
- Human messages in this chat: request to start step one and explicit approval of the filled phase prompt. The exact approval and scope are preserved in canonical progress; no separate approvals are inferred.

### 27.2 Actual sibling files inspected

Paths below are repository-relative links into adjacent local checkouts. They describe working-tree observations on 17 October 2026; unavailable sibling Git metadata means no exact clean-commit guarantee. No sibling test/build/live result was independently reproduced during this inspection.

| Key | Files inspected | What the evidence supports |
| --- | --- | --- |
| CB-1 | [ClipBuilder AGENTS](../../ClipBuilder/AGENTS.md), [docs index](../../ClipBuilder/docs/README.md), [package](../../ClipBuilder/package.json), [playbook](../../ClipBuilder/docs/reference/PORTFOLIO_DEMO_BUILD_PLAYBOOK.md) | Authority, package boundaries, safe tests, process ownership and reusable methodology |
| CB-2 | [app factory](../../ClipBuilder/apps/backend/src/app.ts), [startup](../../ClipBuilder/apps/backend/src/server.ts), [backend package](../../ClipBuilder/apps/backend/package.json) | Express construction, explicit composition/environment and provider isolation |
| CB-3 | [frontend reducer](../../ClipBuilder/apps/frontend/src/features/session/session.reducer.ts), [provider](../../ClipBuilder/apps/frontend/src/features/session/session.provider.tsx), [edit-plan schema](../../ClipBuilder/packages/contracts/src/edit-plan.schema.ts), [contracts package](../../ClipBuilder/packages/contracts/package.json) | One workflow owner, revision-aware operation handling and runtime schemas |
| CB-4 | [frontend package](../../ClipBuilder/apps/frontend/package.json), [frontend Dockerfile](../../ClipBuilder/apps/frontend/Dockerfile), [frontend Cloud Build](../../ClipBuilder/apps/frontend/cloudbuild.yaml), [backend Cloud Build](../../ClipBuilder/apps/backend/cloudbuild.yaml) | Real dependency choices, standalone packaging, non-root runtime and offline image probes |
| SP-1 | [ScreenPilot AGENTS](../../screen-pilot/AGENTS.md), [README](../../screen-pilot/README.md), [frontend package](../../screen-pilot/apps/frontend/package.json), [backend package](../../screen-pilot/apps/backend/package.json) | Product/technical map, feature ownership, contracts, fake test isolation and cleanup |
| SP-2 | [app factory](../../screen-pilot/apps/backend/src/app.ts), [startup](../../screen-pilot/apps/backend/src/server.ts), [OpenAI client](../../screen-pilot/apps/backend/src/providers/openai/openai-client.ts) | Injected providers/admission, explicit startup and bounded failure classification |
| SP-3 | [session reducer](../../screen-pilot/apps/frontend/src/features/session/demo-session.reducer.ts), [session provider](../../screen-pilot/apps/frontend/src/features/session/demo-session-provider.tsx), [tool contracts](../../screen-pilot/packages/contracts/src/interview/client-tools.ts), [contracts exports](../../screen-pilot/packages/contracts/package.json) | One reducer, allow-listed persistence/effect ownership and narrow public schemas |
| SP-4 | [frontend Dockerfile](../../screen-pilot/apps/frontend/Dockerfile), [backend Dockerfile](../../screen-pilot/apps/backend/Dockerfile), [manual deployment](../../screen-pilot/docs/operations/manual-google-cloud-deployment.md) | Two images/services, private bridge identity and separated operator authorization |
| RS-1 | [Retrosum AGENTS](../../Retrosum/AGENTS.md), [README](../../Retrosum/README.md), [docs map](../../Retrosum/docs/README.md), [ClipBuilder lessons](../../Retrosum/docs/LESSONS_LEARNED_FROM_CLIPBUILDER.md), [root package](../../Retrosum/package.json) | Shared pure domain authority, source/decision discipline and settled checks |
| RS-2 | [HTTP factory](../../Retrosum/apps/backend/src/http/app.ts), [startup](../../Retrosum/apps/backend/src/server.ts), [provider](../../Retrosum/apps/backend/src/providers/openai.ts), [backend package](../../Retrosum/apps/backend/package.json) | Bounded routes, explicit composition, injected runtime and server-only AI |
| RS-3 | [session controller](../../Retrosum/apps/frontend/src/features/session/session-controller.ts), [projection](../../Retrosum/apps/frontend/src/features/session/projection.ts), [command schemas](../../Retrosum/packages/contracts/src/commands.ts), [pure commands](../../Retrosum/packages/money/src/commands.ts) | Revision/generation fencing, shared commands, Undo and allow-listed recovery |
| RS-4 | [Next bridge](../../Retrosum/apps/frontend/src/server/backend.server.ts), [frontend package](../../Retrosum/apps/frontend/package.json) | Fixed private paths, canonical origin handling, bounded reads and hosted identity |
| RS-5 | [frontend Dockerfile](../../Retrosum/apps/frontend/Dockerfile), [backend Dockerfile](../../Retrosum/apps/backend/Dockerfile), [manual deployment](../../Retrosum/docs/operations/MANUAL-DEPLOYMENT.md) | Packaged runtime, non-root injected ports, invoker scope, paid-off probes and rollback |
| RT-1 | [Retailor AGENTS](../../Retailor/AGENTS.md), [README](../../Retailor/README.md), [docs map](../../Retailor/docs/README.md), [Retrosum lessons](../../Retailor/docs/references/LESSONS_LEARNED_FROM_RETROSUM.md) | Current boundaries, one state owner, motion policy, evidence and functionality preservation |
| RT-2 | [HTTP factory](../../Retailor/apps/backend/src/http/app.ts), [Responses transport](../../Retailor/apps/backend/src/providers/responses-client.ts), [backend package](../../Retailor/apps/backend/package.json) | Explicit origin/admission, fixed provider endpoint, retries off and bounded responses |
| RT-3 | [Next operation route](../../Retailor/apps/frontend/src/app/api/retailor/v1/%5B...operation%5D/route.ts), [session controller](../../Retailor/apps/frontend/src/features/session/controller.ts), [frontend package](../../Retailor/apps/frontend/package.json) | Thin transport entry, reviewed actions and shared workspace state |
| RT-4 | [command schema](../../Retailor/packages/contracts/src/commands.ts), [commerce commands](../../Retailor/packages/commerce/src/commands.ts) | Version/revision/identity-bound typed actions and pure domain enforcement |
| RT-5 | [frontend Dockerfile](../../Retailor/apps/frontend/Dockerfile), [backend Dockerfile](../../Retailor/apps/backend/Dockerfile), [current AGENTS release notes](../../Retailor/AGENTS.md) | Pinned bases, non-root packaging and exact-byte cross-platform release policy |

Only the relevant sections and representative modules were inspected; this is architecture research, not a comprehensive audit of those applications. Sibling domain-specific settings, temporary exceptions, secret/config values, paid approvals and test acceptance never transfer to Roomedy.

### 27.3 Primary technical pages opened for this revision

| Source | Use in Roomedy | Verification boundary |
| --- | --- | --- |
| [OpenAI function calling](https://developers.openai.com/api/docs/guides/function-calling) | Application-executed tools and explicit strict schemas | Not evidence of a selected model or geometric correctness |
| [OpenAI images and vision](https://developers.openai.com/api/docs/guides/images-vision) | Reviewable image drafting with counting/spatial limitations | Not calibrated room measurement |
| [R3F introduction](https://r3f.docs.pmnd.rs/getting-started/introduction) | React renderer role and major-version compatibility | Recheck complete package compatibility at build time |
| [R3F performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance) | Resource reuse and active-frame invalidation/idle optimization | No measured Roomedy speed claim |
| [Next output](https://nextjs.org/docs/app/api-reference/config/next-config-js/output) | Standalone runtime and monorepo asset/tracing care | Must inspect actual built output later |
| [Cloud Run authentication](https://docs.cloud.google.com/run/docs/authenticating/service-to-service) | Service-account invocation and identity audience | No deployed IAM verification |
| [Kenney kit](https://kenney.nl/assets/furniture-kit), [Quaternius pack](https://quaternius.com/packs/furniture.html), [Poly Haven licence](https://polyhaven.com/license) | Candidate free asset sources and preparation requirements | Exact files/licences/quality still need selection |

These pages were opened on 17 October 2026. This blueprint's architecture choices, room policies, proposed limits and application contracts are project recommendations inferred from these sources and the inspected code; they are not claims that a source prescribes Roomedy's design.

### 27.4 Retained research leads from the draft

The original discussion included qualitative interest/portfolio sources and platform leads. They are retained as history and were not revalidated in step one; they do not establish market size, current product availability or implementation acceptance.

- [Reddit room-planning request](https://www.reddit.com/r/InteriorDesignAdvice/comments/1tvw7jf/websitesapps_to_model_room/), [interior-design software discussion](https://www.reddit.com/r/InteriorDesignHacks/comments/1hklrk0/software_for_interior_designers/) and [portfolio discussion](https://www.reddit.com/r/webdev/comments/1sf7jrm/what_do_hiring_managers_look_for_in_portfolio/).
- [Historical RoomGPT creator thread archive](https://threadreaderapp.com/thread/1635334863518859264.html): creator-reported 2023 context, not current performance evidence.
- [Apple RoomPlan](https://developer.apple.com/augmented-reality/roomplan/), [capture-session support](https://developer.apple.com/documentation/RoomPlan/RoomCaptureSession/isSupported), [ARCore depth](https://developers.google.com/ar/develop/depth): later scan research only.
- [Drei controls](https://drei.docs.pmnd.rs/controls/introduction), [Three.js model loading](https://threejs.org/manual/pages/loading-3d-models.html), [R3F releases](https://github.com/pmndrs/react-three-fiber/releases), [Next Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers), [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs): follow-up implementation references; no latest-release assertion is carried forward from the draft.

### 27.5 Step-three product/design research

Official product/principle pages below were opened on 17 October 2026. This was read-only desk research, not signed-in product testing, a comparative benchmark or rendered visual/device review. Marketing claims are not independent proof of recognition accuracy, fit or usability. Roomedy does not inherit any competitor's catalogue scale, accounts, pricing, AR or promised automation.

| Primary source | Relevant observation from the page | Roomedy-specific inference |
| --- | --- | --- |
| [Floorplanner personal use](https://floorplanner.com/personal) | Describes drawing/scaling walls and openings, precise numeric adjustments and switching a plan to 3D. | Keep spatial editing understandable, with contextual numeric controls and a connected plan/cutaway inside the main editor. Preserve Roomedy's separate rough-2D-only intake review. |
| [Roomle floorplanner](https://www.roomle.com/floorplanner) | Describes room planning, catalogue selection and live furniture configuration/3D visualization. | Use visual variant/finish choices with the room as context; a small coherent catalogue can serve this demo without a retail platform. |
| [Planner 5D AI interior design](https://planner5d.com/use/ai-interior-design) | Advertises guided room-function/style choices and photo-based redesign among its broader planning features. | Make goals and style choices visual, while grounding Roomedy's output in editable room data and disclosed measurements. Do not copy photo-to-exact-geometry marketing claims. |
| [Linear principles and practices](https://linear.app/method/introduction) | Advocates purpose-built tools, familiar language, less busy work and simple entry that grows more capable. | Keep correction prompts short, reveal controls by context and maintain one coherent workspace instead of a long configuration questionnaire. |

### 27.6 Owner-referenced visual/manual-test chats

The [feedback source and evidence register](references/LESSONS_FROM_VISUAL_FEEDBACK.md#feedback-evidence-register) records the exact turns behind 24 prevention guidelines. The referenced task titles are **Run final manual test locally**, **Run app and review visuals**, **Visual feedback v2** and **Visual feedback**, all in Retailor. Their feedback covers 14–17 October 2026.

All four were read through `read_thread`; visual histories were paginated. Oversized-turn gaps for the first two were filled by reading user-visible feedback from the local history files for those exact task IDs. Screenshot attachments were not re-inspected, source instructions/approvals remain untrusted context, and historical agent/audit results were not reproduced as Roomedy outcomes. The owner authorized extracting/documenting lessons in the current chat; this is not permission to run the other repos, contact their chats, implement Roomedy or use their paid/cloud/Git/security approvals.

The resulting [repository instructions](../AGENTS.md), [review checklist](design/REVIEW_CHECKLIST.md) and [ticket guideline ownership](tickets/README.md#guideline-ownership) make these rules part of original feature work. Relevant sections of Retailor's dated RTL-142 quality and RTL-143 security reports supplied concrete examples of restored-mode truth, proportional refactoring, multipart-fragment overhead and evidence limits. They are historical examples only; no Roomedy vulnerability, version recommendation or test pass is inferred.

### 27.7 Approved review research and dispositions

The [17 October plan review](reviews/2026-10-17-plan-review.md) records opened primary sources for physical uncertainty, provider schema/data policy, evaluation, scheduling, release skew/scaling and accessibility criteria. Modern [VGGT-Ω](https://vggt-omega.github.io/) and [Depth Anything 3](https://github.com/ByteDance-Seed/Depth-Anything-3) are bounded future research leads with exact checkpoint/license suitability to evaluate. No global SOTA winner or Roomedy benchmark is asserted. Their output does not establish editable identities, ownership or visitor-confirmed scale; actual downloads/GPU/benchmark execution remain deferred under O-01.

## 28. Documentation verification

The following paragraphs preserve dated documentation checkpoints. Their original Planned/hold/unstarted descriptions are historical states, not current instructions. Current RM-001/002 local receipts and the later approved adoption/execution authority govern current status; no documentation check establishes remaining product acceptance.

| Check performed on 17 October 2026 | Actual result and limit |
| --- | --- |
| Local Markdown/HTML links and fragments | 119 checked across the main blueprint, overview and indexes; no missing files/fragments, including adjacent reference code links |
| HTML structure | Balanced element nesting, 23 unique IDs, one inline script and no external runtime resources |
| JavaScript syntax and offline interaction checks | V8 compiled the actual inline script; 13 behavior scenarios passed in Node with a minimal synthetic DOM |
| Scripted scenarios | Initial actions, plan/cutaway output, uncommitted preview/Cancel, atomic Apply/double-click protection, Undo, blocked doorway, palette Cancel, manual preview invalidation, empty/partial rooms, starting-point reset and bounded history |
| Source-level layout/motion checks | Responsive breakpoints at 1,000/760/520 px; balanced CSS braces; no OS-based motion suppression in the current overview; these are not rendered viewport measurements |
| Documentation/state coherence | All 28 numbered sections, no unfilled guide placeholders, one readable canonical progress block and exact phase approval preserved |
| Scope check | No tickets, package manifests, application services, provider calls, cloud actions or Git staging/commits created by step one |

The Node harness used the overview's actual event handlers and generated SVG, with no network or browser engine. It does not establish browser rendering, focus behavior, accessibility or viewport quality. The browser tool rejected the local `file:` URL under its security policy. No alternate serving/browser workaround was attempted. Actual browser screenshots, responsive visual inspection and physical-device checks therefore remain unperformed; open the HTML locally for owner review. Source-level checks must not be reported as those missing visual results.

The core-flow explanation and rough-2D-only initial-review clarification are incorporated in section 5.6. The owner subsequently selected the reviewed step-three recommendations and explicitly deferred prices/budget planning. Sections 19.4–19.5 and 26 now record selected requirements and actual answers, while section 27.5 preserves their research provenance. The HTML and documentation index reflect the same scope; exact assets, measured engineering limits and actual visual/provider/hosted evidence remain separate work.

At step three, the source check passed **125 local links/fragments**, balanced HTML with **24 unique IDs**, retention of every existing script control, and no external runtime resources. The eight proposals and nine questions were labelled, and the confirmed rough-2D-only initial review was preserved. The owner's later answer is now reflected as selected refinements and an answered decision register. These updates change documentation/markup; the existing interaction script is unchanged. Actual rendered browser/device review remains unperformed under the limitation recorded above.

After applying the owner's answers, the source checks again passed **125 local links/fragments**, balanced HTML with **24 unique IDs**, all existing script controls and no external runtime resources. The nine answers are recorded, the initial 2D-only review is preserved, and the selected comparison, two-hour recovery, transient photos and pricing deferral agree across the blueprint, HTML, index and root overview. The inline illustration script is unchanged; no application, visual-browser, provider or hosted result is claimed by these documentation checks.

Step-five planning prepared **20 detailed packets (RM-001–RM-020)** using actual ticket indexes/packets from all four reference repos. Planning checks passed **271 local links/fragments**, agreement between the queue and **35 earlier-only dependency edges** (no cycles), required standalone packet structure, **164 unchecked acceptance criteria** and all statuses Planned. The overview retains **24 unique IDs**, balanced markup, every existing script control, no external runtime resource and the unchanged illustration script. These are documentation/plan checks only; no application test, install, build, service, asset preparation, provider request, cloud action or Git mutation ran. Original drafts and the generic guide were preserved. At that step-five checkpoint, the plan awaited owner review and implementation was on hold; later approvals supersede that hold.

The owner-requested feedback-guideline revision adds 24 evidence-based lessons, 27 feedback references and two attributed historical audit examples, concise root AGENTS.md instructions and a reusable review checklist. All twenty packets now link their relevant lessons and include targeted prevention requirements, adding 24 acceptance checks for a total of **188 unchecked ticket criteria**; all statuses remain Planned and the original **35-edge** dependency order is unchanged. Source checks passed **344 local links/fragments**, 24 unique ordered lesson IDs with valid cited evidence, 22 unchecked reusable checklist items and the existing balanced HTML/24 IDs/controls/no-external-runtime checks. The illustration script is unchanged. This verifies documentation structure and consistency only; no application implementation, install, app build/test/run, screenshot session, paid request, scanner export, cloud change or Git mutation occurred. Source-chat reading limits and the exact-thread history fallback are documented; prior screenshots and audit outcomes were not reproduced as Roomedy evidence.

Step six records the owner's approval of the updated plan/guidelines and authorization for RM-000 documentation/ticket commits only. The reviewed 28-file fingerprint was independently matched before status bookkeeping. The exact allocation contains 33 Markdown/HTML files; working-document checks passed 388 current local links/fragments, unchanged Planned ticket/dependency/unchecked-criteria counts, HTML/script integrity, three original-source hashes and scoped credential/path review. Staged-content and actual commit receipts are recorded in RM-000's verification document when performed; no commit is claimed by these pre-commit checks.

The initial RM-000 planning snapshot is committed as `b97db4b927036e9f82d1ab4e44a876797d9ec1c3`. All 33 committed file blobs independently matched the reviewed staged/working bytes and the recorded manifest digest; the worktree was clean immediately afterward. The scoped completion record changes only this blueprint/progress, the RM-000 file-level plan and RM-000 verification. At that step-six checkpoint, all twenty implementation tickets and phase seven were unstarted; later RM-001/002 commits and current RM-003 work supersede that status. No push, install, app run/build/test, paid request or external action occurred.

Current outstanding evidence includes final RM-003 geometry/command validation and all amended criteria, actual R3F/device behavior, provider interpretation/evaluation, measured limits, full recovery/privacy implementation, owner visual approval, security audit, Linux/hosted/account/domain proof. RM-001/002 have their own dated local evidence. The owner approved the full review recommendations and requested adoption before resuming ordered fake execution. The [adoption allocation](commit-plans/PLAN-REFINEMENT-2026-10-17.md) and [documentation receipt](validation/PLAN-REFINEMENT-2026-10-17.md) describe this update; no new implementation result follows from it.


RM-005 is committed as `85c7362` and RM-006 as `f73ce2e`. RM-007 adds bounded transient photos and manual rough 2D review; [intake policy](engineering/image-intake.md) and [actual validation](validation/RM-007.md) distinguish local evidence from later recognition/recovery/device/owner acceptance. The ordered fake-mode guide goal remains active.

<!-- build-progress:start -->
## Build command progress

Current phase: **09-visual-review**
Next action: Await actual owner visual review of validated composer divider/visible-label removal and earlier corrections; Q held, guide goal paused, RM-016 Planned. No paid/live/delegation/push/deploy.
Active ticket: RM-015BC
Phase prompts: manual approval before each phase
Local commits approved: yes

- [x] 01-docs — Documentation (complete)
- [x] 02-flow — Core flow (complete)
- [x] 03-product — Product and design (complete)
- [x] 04-decisions — Product decisions (complete)
- [x] 05-tickets — Ticket plan (complete)
- [x] 06-plan-commit — Planning commit (complete)
- [x] 07-build — Execute and validate tickets (complete_local)
- [x] 08-performance — Performance investigation (complete_local)
- [ ] 09-visual-review — Frontend visual approval checkpoint (awaiting_owner)
- [ ] 10a-quality — Quality audit and fixes (pending)
- [ ] 10b-security-review — Security audit and manual review (pending)
- [ ] 11-security-fixes — Approved security fixes (pending)
- [ ] 12-handoff — Final local handoff (pending)

This checklist records local work. Human approvals and unresolved external checks are preserved below; it does not authorize paid calls or deployment.

```json
{
  "schema_version": 2,
  "repo_root": "C:\\Users\\minat\\Work\\Roomedy",
  "main_document": "docs/ROOMEDY.md",
  "updated_at": "2026-10-20T17:01:53+00:00",
  "context": {
    "TARGET_AUDIENCE": {
      "value": "Renters and people furnishing/rearranging small rectangular bedrooms/home-office combinations, plus potential clients evaluating the portfolio demo. Empty, partly furnished and existing-room conditions remain supported.",
      "source": "Owner-selected Q-01 and Q-09; docs/ROOMEDY.md sections 2, 5 and 26",
      "confidence": "confirmed"
    },
    "MAIN_INPUT": {
      "value": "Authored sample rooms or room/furniture photos, reviewed dimensions, retained furniture, locks and visitor goals",
      "source": "docs/ROOMEDY.md sections 5-6",
      "confidence": "confirmed"
    },
    "PROJECT_NAME": {
      "value": "Roomedy; selected domain tryroomedy.com",
      "source": "README.md and docs/ROOMEDY.md sections 1-2; original drafts preserved",
      "confidence": "confirmed"
    },
    "OUT_OF_SCOPE": {
      "value": "Mandatory accounts/database, professional CAD/compliance, native scans/AR, multi-room planning, arbitrary exact reconstruction and live retail purchasing; step one creates no tickets or application code",
      "source": "docs/ROOMEDY.md sections 2, 25-26; human-approved documentation-only phase prompt",
      "confidence": "confirmed"
    },
    "ARCHITECTURE": {
      "value": "Recommend pnpm workspace: Next/React/TypeScript frontend with thin fixed server bridge, private Express API, browser-safe Zod contracts and a pure spatial package shared by browser/API; R3F/Drei cutaway plus SVG plan; browser-owned bounded guest state. Replaces draft single-app API recommendation after actual four-repo inspection; product acceptance remains pending.",
      "source": "docs/ROOMEDY.md sections 3, 14-16 and inspected files CB-1 through RT-5 in section 27.2",
      "confidence": "inferred"
    },
    "MAIN_OUTPUT": {
      "value": "One editable canonical room shown in 2D/3D with feasibility feedback, preview, atomic Apply, Cancel, Undo and guest export/import",
      "source": "docs/ROOMEDY.md sections 7-12 and 17",
      "confidence": "confirmed"
    },
    "REFERENCE_REPOS": {
      "value": "C:\\Users\\minat\\Work\\ClipBuilder; C:\\Users\\minat\\Work\\screen-pilot; C:\\Users\\minat\\Work\\Retrosum; C:\\Users\\minat\\Work\\Retailor",
      "source": "Actual read-only guidance, manifest, frontend/backend/contracts and deployment inspection on 2026-10-17; file evidence in docs/ROOMEDY.md sections 3 and 27.2; sibling Git metadata unavailable",
      "confidence": "confirmed"
    },
    "DEMO_PURPOSE": {
      "value": "Guest AI-assisted 2D/3D room planning for empty, partly furnished and existing rooms; editable, validated and reversible arrangements",
      "source": "docs/ROOMEDY.md sections 2, 5, 7-12",
      "confidence": "confirmed"
    },
    "PRODUCT_CHOICES": {
      "value": "Reviewed product question set resolved. Remaining work is exact licensed assets/artwork and later visual acceptance, compatible model and authorized evaluation/account setup, measured limits/search mechanisms and actual live/hosted verification. No pending product answer is invented for prices, inputs, main-editor manipulation, comparison or retention.",
      "source": "Human default selection for Q-01 through Q-09 plus explicit Q-07 deferral; docs/ROOMEDY.md section 26.2 separates decisions from engineering/evidence",
      "confidence": "confirmed"
    },
    "DEPLOYMENT_PLATFORM": {
      "value": "Recommend later two-service Google Cloud Run pattern with public Next frontend, private IAM-authenticated API, pinned non-root images and backend-only secrets; no project/account/region/domain/deployment selections or authorization established",
      "source": "Actual sibling Dockerfiles and deployment runbooks; docs/ROOMEDY.md section 23",
      "confidence": "inferred"
    },
    "PHASE_DELIVERABLES": {
      "value": "Expanded docs/ROOMEDY.md with 28 sections; responsive scripted docs/ROOMEDY_OVERVIEW.html; docs/README.md; linked root README; original drafts preserved under docs/drafts/2026-10-17",
      "source": "Human-approved phase 01-docs prompt and actual completed files; docs/ROOMEDY.md section 28 records verification scope",
      "confidence": "confirmed"
    },
    "DOCUMENTATION_VERIFICATION": {
      "value": "Current RM-000 documentation checks passed: exact 33-file allocation, 388 current local links/fragments, 20 Planned packets/35 acyclic earlier-only edges/188 unchecked criteria, 24 lessons/27 evidence entries/22 unchecked reusable checks, HTML 24 IDs/controls/no external runtime and unchanged script. Three archived-source hashes preserved. Scoped credential/path/staged-byte checks passed; authored whitespace passed with documented Markdown/archive treatment. No fresh app/browser/provider/Linux/hosted acceptance.",
      "source": "docs/validation/RM-000.md; actual pre-commit/staged/post-commit checks on 2026-10-17",
      "confidence": "confirmed"
    },
    "INITIAL_REVIEW_PRESENTATION": {
      "value": "Owner-confirmed: uploaded rooms are initially reviewed as a rough, editable 2D sketch only, with labelled footprints/openings and uncertain measurements. 3D is available only after reaching the main editor; the main editor retains synchronized 2D/3D views. This clarifies the existing flow without starting phase 03.",
      "source": "human:current-chat/2026-10-17: 'ok then keep it like that, a rough 2d sketch for the initial review and 3d only when we get to the main editor'; reflected in docs/ROOMEDY.md sections 1.2, 4.2, 5, 7.1, 14.4, 24.2 and 26, docs/ROOMEDY_OVERVIEW.html and docs/README.md",
      "confidence": "confirmed"
    },
    "PRODUCT_IDEAS": {
      "value": "Reviewed P-01 through P-08 selected: guided rough-2D corrections, visual ownership/goal/style cards, contextual assistant actions, explanatory atomic previews, bounded Before/Current baseline, sketch-to-studio transition and lively lightweight landing. Prices/budget planning excluded; source research remains inference/evidence provenance, not proof of implementation.",
      "source": "Human accepted the recommendations and explicitly deferred Q-07; docs/ROOMEDY.md sections 19.4-19.5 and 26.1; PM HTML updated",
      "confidence": "confirmed"
    },
    "WOW_FACTOR": {
      "value": "A natural-language request becomes a useful, checked, visible coordinated room change that can be applied and undone. Initial review stays a rough 2D sketch; 3D appears only in the main editor.",
      "source": "Established room/command direction and owner-confirmed review sequence; step-three recommendation in docs/ROOMEDY.md section 19.4",
      "confidence": "inferred"
    },
    "BEST_REFERENCE_PROJECT": {
      "value": "Retrosum for coherent workspace/state and useful assistant behavior, with Retailor for visual choices/reviewed action cards; preserve Roomedy's own visual identity.",
      "source": "Actual sibling source inspection in sections 3/27.2 and step-three design inference in section 19.4",
      "confidence": "inferred"
    },
    "NUMBERED_ANSWERS": {
      "value": "Q-01 rectangular bedrooms/workspaces; Q-02 warm ivory/green/clay and polished stylized furniture; Q-03 similar supported models at reviewed dimensions; Q-04 2D precision editing and 3D orbit/selection/inspection; Q-05 one proposal with a bounded read-only Before/Current baseline, alternative layouts deferred; Q-06 samples/photos/typed dimensions, floor-plan/PDF intake deferred; Q-07 prices and visitor budget planning explicitly deferred; Q-08 fixed two-hour local semantic-room/baseline recovery and export/import, raw photos transient; Q-09 adopt all reviewed guided/visual/assistant/preview/transition/landing refinements and generic Roomedy assistant label.",
      "source": "human:current-chat/2026-10-17/answers-to-step-three-recommendations: exact quote preserved in phase 04 and docs/ROOMEDY.md section 26.1",
      "confidence": "confirmed"
    },
    "PRODUCT_DESIGN_RESEARCH": {
      "value": "Opened official Floorplanner personal-use, Roomle floorplanner, Planner 5D AI interior-design and Linear principles pages on 2026-10-17. Read-only desk research; no signed-in product, recognition accuracy, visual/device or comparative performance verification.",
      "source": "docs/ROOMEDY.md section 27.5 and actual web page reads in this turn",
      "confidence": "confirmed"
    },
    "GUEST_LIFECYCLE": {
      "value": "Fixed two hours from active workspace creation; edits/refresh do not extend expiry. Restore current semantic room and bounded read-only baseline locally; raw room/furniture photos remain active-page transient and do not persist across refresh. Export/import contains versioned semantic room/baseline, without raw photos, chat, active Undo history or operation capabilities.",
      "source": "Accepted Q-08 recommendation elaborated consistently in docs/ROOMEDY.md sections 9.6, 17, 18 and 26; engineering mechanism/evidence still pending",
      "confidence": "confirmed"
    },
    "PRICING_SCOPE": {
      "value": "Furniture prices, currency/cost totals, visitor spending budgets, affordability goals, retail sourcing and checkout are deferred, including fictional prices. Internal provider/cloud spend, token/rate/concurrency controls remain required.",
      "source": "Human explicitly leaves prices and budget planning out; docs/ROOMEDY.md sections 2, 13, 16, 18 and 26",
      "confidence": "confirmed"
    },
    "TICKET_PREFIX": {
      "value": "RM-###; RM-000 for the explicitly authorized initial-documentation/ticket commits",
      "source": "human:current-chat/2026-10-17/approve-plan-and-rm-000-commit; approved ticket plan and direct RM-000 instruction",
      "confidence": "confirmed"
    },
    "VISUAL_FEEDBACK": {
      "value": "Owner-requested RM-015A–J loop: motion-first UI and hero, interior cameras/quality, 3D editing, designer assistant/sample parity, concise copy, permanent active motion and final integrated evidence. Actual joint visual approval remains pending.",
      "source": "human:current-chat/2026-10-19/pre-review-todo-loop",
      "confidence": "confirmed"
    },
    "RELEVANT_IMPLEMENTATION": {
      "value": "RM-001 local outcome verified: Next/Express foundation, strict browser-safe contracts/pure spatial interfaces, fixed bounded bridge, fake/paid-off isolation and startup. 26 unit tests plus 5 boundary regressions, all local root gates and real local smoke passed. Exact 68-file allocation awaits commit; actual hosted CI/Linux remains unverified.",
      "source": "docs/validation/RM-001.md; final pnpm check and test:smoke outputs on 17 October 2026",
      "confidence": "confirmed"
    },
    "LOCAL_COMMIT_SCOPE": {
      "value": "Owner authorizes exact-path local staging and ticket-prefixed commits after each completed validated ticket. Required audit artifacts remain unstaged until security review. No push.",
      "source": "human:current-chat/2026-10-17/start-step-seven-ordered-fake-build",
      "confidence": "confirmed"
    },
    "IMPLEMENTATION_AUTHORIZATION": {
      "value": "Approved refinements adopted into blueprint and existing tickets; owner explicitly resumes RM-003 then numeric-order execute/validate/exact-path local commit loop in fake/paid-off mode. Stop at manual visual/security gates or 0% usage. No paid calls/deployment/push/reset-credit consumption.",
      "source": "human:current-chat/2026-10-17/approve-review-and-resume-ordered-build",
      "confidence": "confirmed"
    },
    "USAGE_STOP_POLICY": {
      "value": "Stop at first required owner visual/security gate or reported0% remaining Codex usage. Latest actual reading21%used/79%remaining, ordinary usage allowed. Do not consume resets or paid credits beyond cutoff. Current stop is the required RM-015 owner visual gate.",
      "source": "human:current-chat/step-seven-stop-policy; actual get_usage_limits2026-10-18 before owner presentation",
      "confidence": "confirmed"
    },
    "PLAN_REVIEW_STEERING": {
      "value": "Owner requested a full deeper-reasoning review of the existing plan for meaningful modern/SOTA improvements. Implementation is on hold during this review; RM-001 and RM-002 are committed, RM-003 is partial, unvalidated and uncommitted. Recommendations do not represent approved new product scope.",
      "source": "human:current-chat/2026-10-17/deeper-plan-review",
      "confidence": "confirmed"
    },
    "PLAN_REVIEW_RESULT": {
      "value": "Full twenty-ticket review documented in docs/reviews/2026-10-17-plan-review.md: fifteen proposed refinements and three bounded research opportunities; five foundation contract/liveness issues should be settled before RM-003 signoff. Four narrow read-only probes reproduced measurement rejection, odd-centre boundary violation, missing pose provenance and receipt exhaustion. Recommendations remain distinct from approved criteria. No code edits/staging/commits/paid calls/deployment during review.",
      "source": "human:current-chat/2026-10-17/deeper-plan-review; docs/reviews/2026-10-17-plan-review.md",
      "confidence": "confirmed"
    },
    "PLAN_REFINEMENT_APPROVAL": {
      "value": "ok i approve the recommendations. update the docs and tickets, then resume RM-003 and continue in order. use fake mode, validate and commit each ticket, and stop at review gates or 0% usage. no paid calls or deployment.",
      "source": "human:current-chat/2026-10-17/approve-review-and-resume-ordered-build; reviewed docs/reviews/2026-10-17-plan-review.md PR-01..15/O-01..03",
      "confidence": "confirmed"
    },
    "ACTIVE_GOAL": {
      "value": "Registered unbudgeted Roomedy ordered execute/validate goal is paused at the explicitly required RM-015 visual result gate. The owner-authorized checkpoint Git action is separate and does not resume automatic implementation. Goal objective and remaining account usage are distinct; no completion or visual acceptance is inferred.",
      "source": "get_goal verified paused; direct human stop-at-review instruction and 2026-10-18 visual-refusal/checkpoint-commit messages",
      "confidence": "confirmed"
    },
    "CODEX_USAGE_CHECK": {
      "value": "2026-10-18 latest read: 3% used / 97% remaining weekly; ordinary usage allowed; no reset consumed by agent.",
      "source": "get_usage_limits:current-turn/latest-pre-RM-005-commit",
      "confidence": "confirmed"
    },
    "WEBSITE_PALETTE": {
      "value": "Oat, sand, beige, walnut, cocoa and earthy wood tones. Studio may use black/white; room finishes independent. Supersedes earlier teal platform direction.",
      "source": "human:current-chat/latest-website-palette; docs/ROOMEDY.md section19.1",
      "confidence": "confirmed"
    },
    "RM_CHECKPOINT_AUTHORITY": {
      "value": "Owner: \"didnt approve visuals yet, but you are allowed to create file commit plan for current unstaged work and tomorrow i will review them\", followed by \"and you can stage and commit\". Authorizes the current exact15-file RM-015 local checkpoint plan/stage/commit before visual approval; no result approval, waiver, ticket completion or RM-016. Subject: RM-015: record performance and pending visual review. Earlier presentation-prompt/evidence statements holding the commit until visual approval are historical and superseded only for this specific Git action.",
      "source": "human:current-chat/2026-10-18/visuals-unapproved-checkpoint-plan-and-stage-commit; docs/commit-plans/RM-015.md",
      "confidence": "confirmed"
    },
    "LANDING_VISUAL_REVIEW": {
      "value": "RM-015P performance-first background correction plus centered/clear cue, small frosted CTA and actual-readiness text fade implemented and locally verified.414tests/36files/root/both builds,188inputs/1495693bytes/BUILD_ID6f760018a29ea875ae511e5d436267795d3b490efba94ae68f1f3373ace47e65. Actual13-size/normal-reverse-rapid/3startup/readyfade/entryBack and clean whole20-path read-only pass1. Exact local checkpoint next; actual owner smoothness/visual feedback pending. Q restrained warm dynamic room lighting held, guide goal paused, RM-016 Planned.",
      "source": "docs/validation/RM-015P.md; human:current-chat/2026-10-19/lag-first-cue-glass-readiness-fade",
      "confidence": "confirmed"
    },
    "LIVE_REVIEW_URL": {
      "value": "http://127.0.0.1:4320/demo sole hot-reloaded browser URL; existing private4321 behind same origin. No4390/4391 listeners; original old-origin visitor tabs untouched. Actual dev review distinct from production artifact.",
      "source": "docs/validation/RM-015R.md",
      "confidence": "confirmed"
    },
    "DEMO_VISUAL_REVIEW": {
      "value": "R adaptive demo space/static photo background plus matching glass header and relocated step Back locally validated.414tests/36files/seven boundary cases/root/both builds,191inputs/1500858bytes/BUILD_IDdee4dd163ab4881a2f4f313551f4bbce852d16dfbefd681efde416ebb985f8c8; actual15-size header/nine-size flow/photo/2D/3D/panels/fake lifecycle evidence and clean whole22-path read-only pass2. Owner supplied further S editor feedback; actual visual acceptance pending.",
      "source": "docs/validation/RM-015R.md; human:current-chat/2026-10-19/demo-space-glass-header-and-editor-feedback",
      "confidence": "confirmed"
    }
  },
  "prompt_preapproval": null,
  "prompt_mode_history": [],
  "git": {
    "local_commits_approved": true,
    "approval_source": "human:current-chat/2026-10-17/approve-plan-and-rm-000-commit"
  },
  "active_ticket": "RM-015BC",
  "next_action": "Await actual owner visual review of validated composer divider/visible-label removal and earlier corrections; Q held, guide goal paused, RM-016 Planned. No paid/live/delegation/push/deploy.",
  "phases": [
    {
      "id": "01-docs",
      "name": "Documentation",
      "gate": null,
      "status": "complete",
      "prompt": {
        "text": "This is step one for Roomedy: build the documentation first.\n\nUse README.md, docs/ROOMEDY.md, docs/ROOMEDY_OVERVIEW.html and step one of docs/GENERIC REPO GUIDE.html as the source material. Roomedy, with the selected domain tryroomedy.com, is a portfolio demo for furnishing empty rooms or rearranging existing furniture through a shared editable 2D plan and 3D cutaway, manually or with an AI assistant.\n\nThe audience includes renters and people making small rooms work for sleeping, working and storage, as well as potential clients evaluating the demo. The central result is an editable room arrangement with honest measurement confidence and useful fit checks. The assistant proposes supported changes through validated tools; the visitor can Preview, Apply, Cancel and Undo a whole instruction.\n\nInspect the actual code and documentation in these local reference repos, read-only:\n- C:\\Users\\minat\\Work\\ClipBuilder\n- C:\\Users\\minat\\Work\\screen-pilot\n- C:\\Users\\minat\\Work\\Retrosum\n- C:\\Users\\minat\\Work\\Retailor\n\nRead their guidelines, documentation indexes, lessons learned, package/workspace structure, representative frontend/backend/shared-contract code and deployment files. Base Roomedy's structure, framework, architecture, infrastructure and development conventions on patterns demonstrated there, unless Roomedy has a concrete reason to differ. Cite the inspected files and explain each adopted pattern or deliberate departure. Do not assume the repos all share one architecture.\n\nRebuild docs/ROOMEDY.md into a comprehensive, coherent main specification and docs/ROOMEDY_OVERVIEW.html into a concise, attractive, responsive PM-language overview. Preserve existing product requirements, selected branding and the canonical build progress. Clearly distinguish documented decisions, recommendations, open choices and capabilities that still need implementation or measurement.\n\nThe Markdown must explain the landing and guest entry, sample-room journey, empty/partly furnished/existing-room photo journeys, correction and dimension confirmation, inventory and ownership/locks, shared 2D/3D state, manual controls, furniture asset strategy, geometry and clearance checks, assistant tools, atomic previews and Apply, revision conflicts, cancellation and Undo. Cover failure/recovery states, privacy and guest retention/reset/export/import, responsive and accessible interaction, bounded requests/search/storage, testing/evaluation, proposed folder/package boundaries, local development conventions, and deployment preparation.\n\nEvaluate the draft's Next.js/React/TypeScript, React Three Fiber/Drei, SVG plan, shared domain/geometry/command system and server-side GPT recommendations against the references. Evaluate Google Cloud Run from their actual deployment files. Explain recommendations and unresolved decisions without inventing selected models, budgets, credentials, performance results or live infrastructure.\n\nKeep the final visual identity and assistant name, exact licensed catalogue, floor-plan/PDF intake, numeric limits, photo retention, supported geometry/clearances, model and funded budget, layout comparison and priced catalogue visibly unresolved wherever the evidence does not settle them. The HTML should explain the product and main journeys visually, with any interactive illustration clearly labelled as a scripted concept.\n\nThis is a bounded single-room guest demo. Accounts, a mandatory server database, professional CAD or construction compliance, native scanning/AR, multi-room planning, exact arbitrary furniture reconstruction and live retail purchasing remain outside the baseline. Produce the documentation and overview only. Do not create tickets, implement the application, stage or commit changes, invoke paid providers, purchase assets/domains, deploy or publish.",
        "sha256": "1144e768a198578d7e708b3b5fc3f838519c8518d3c8d5dba9bb90ad939cb43f",
        "context_sources": [
          "README.md",
          "docs/ROOMEDY.md",
          "docs/ROOMEDY_OVERVIEW.html",
          "docs/GENERIC REPO GUIDE.html step 1",
          "Verified local reference repo directory/file inventory, 2026-10-17",
          "human:current-chat request to start step one; no filled-prompt approval yet"
        ],
        "status": "approved",
        "approval": {
          "scope": "The displayed 01-docs prompt with SHA 1144e768a198578d7e708b3b5fc3f838519c8518d3c8d5dba9bb90ad939cb43f; reference inspection and documentation only.",
          "quote": "Approved, go ahead with step one. Use the docs and check the actual reference repos, then create the detailed Markdown and HTML overview.",
          "source": "human:current-chat/2026-10-17/approval-after-filled-step-one-prompt",
          "question_context": "Approve this filled prompt, or what should change?"
        }
      },
      "evidence": [
        "docs/ROOMEDY.md: 28-section product/engineering blueprint with inspected source register and open decisions",
        "docs/ROOMEDY_OVERVIEW.html: self-contained scripted SVG product overview; no live provider behavior claimed",
        "docs/README.md and README.md: current document map and portfolio links",
        "docs/drafts/2026-10-17/ROOMEDY.md and ROOMEDY_OVERVIEW.html: preserved original source history without duplicate progress block",
        "docs/ROOMEDY.md#28-documentation-verification: 119 local links/fragments passed, HTML structure and JS syntax passed, 13 offline synthetic-DOM behavior checks passed; actual browser/viewport review explicitly unperformed",
        "human:current-chat/2026-10-17/approval-after-filled-step-one-prompt: exact step-one prompt approved; no later phase, Git, paid or cloud authorization inferred"
      ],
      "blockers": [],
      "approval": null,
      "decision": null,
      "reviews": []
    },
    {
      "id": "02-flow",
      "name": "Core flow",
      "gate": null,
      "status": "complete",
      "prompt": {
        "text": "Okay, let's move to step two. Explain the main core flow step by step, especially how we turn room photos into an editable 2D and 3D room.",
        "sha256": "76300e5572ad956a0f782e0a74d65d7090daf2f75f4d96a3933c51f5d17de85b",
        "context_sources": [
          "human:current-chat/2026-10-17/direct-step-two-request-and-exact-task-prompt",
          "docs/GENERIC REPO GUIDE.html step 2",
          "docs/ROOMEDY.md sections 4-12, 14 and 17"
        ],
        "status": "approved",
        "approval": {
          "quote": "Okay, let's move to step two. Explain the main core flow step by step, especially how we turn room photos into an editable 2D and 3D room.",
          "source": "human:current-chat/2026-10-17/direct-step-two-request-and-exact-task-prompt",
          "scope": "The owner directly authored this exact executable phase prompt and explicitly instructed moving to step two. This authorizes this explanation only; no general prompt pre-approval, product acceptance, tickets or implementation is inferred."
        }
      },
      "evidence": [
        "docs/ROOMEDY.md#56-how-photos-become-an-editable-room: step-by-step photo-to-room pipeline, object reconciliation, scale confirmation and shared-view construction",
        "docs/ROOMEDY.md sections 4-12 and 17: landing, room-condition paths, manual/assistant edits, Apply/Undo and recovery; recommendations and unknowns remain explicit",
        "human:current-chat/2026-10-17/direct-step-two-request-and-exact-task-prompt: exact phase prompt authored and directly requested by the owner; scope limited to the core-flow explanation"
      ],
      "blockers": [],
      "approval": null,
      "decision": null,
      "reviews": []
    },
    {
      "id": "03-product",
      "name": "Product and design",
      "gate": null,
      "status": "complete",
      "prompt": {
        "text": "ok let's move to step three. what product and design ideas would you add, and what questions do you need answered before we create the tickets?",
        "sha256": "42c3d91833bc285a15d2552446bbbb95d4df81f6570b52c0a3f949df140f9251",
        "context_sources": [
          "human:current-chat/2026-10-17/direct-step-three-request-and-exact-task-prompt",
          "docs/GENERIC REPO GUIDE.html step 3",
          "docs/ROOMEDY.md sections 1.2, 5.6, 19 and 26",
          "human:confirmed rough 2D initial review; 3D only in main editor"
        ],
        "status": "approved",
        "approval": {
          "quote": "ok let's move to step three. what product and design ideas would you add, and what questions do you need answered before we create the tickets?",
          "source": "human:current-chat/2026-10-17/direct-step-three-request-and-exact-task-prompt",
          "scope": "The owner directly authored this executable phase request and explicitly instructed step three. Recommendations, supporting research and aligned documentation are authorized; recommendations are not product acceptance, ticket permission, Git permission or paid/cloud authorization."
        }
      },
      "evidence": [
        "docs/ROOMEDY.md#194-step-three-product-and-design-proposals and #195-recommended-scope-discipline: eight explicitly proposed refinements, bounded optional comparison and scope recommendations",
        "docs/ROOMEDY.md#261-questions-needed-to-settle-the-product-before-tickets: nine product questions with recommendations, no invented owner answers",
        "docs/ROOMEDY.md#275-step-three-productdesign-research: four official product/principle pages opened; recommendations identified as inferences",
        "docs/ROOMEDY_OVERVIEW.html#ideas and docs/README.md: aligned PM summary and document links",
        "docs/ROOMEDY.md#28-documentation-verification: 125 local links/fragments passed; HTML balanced with 24 unique IDs, existing script controls retained, no external runtime resources; browser visual review remains unperformed",
        "human:current-chat/2026-10-17/direct-step-three-request-and-exact-task-prompt: recommendations/questions authorized, not product results, tickets, Git or paid/cloud actions"
      ],
      "blockers": [],
      "approval": null,
      "decision": null,
      "reviews": []
    },
    {
      "id": "04-decisions",
      "name": "Product decisions",
      "gate": "product",
      "status": "complete",
      "prompt": {
        "text": "ok let's leave prices and budget planning out for now. use your recommendations for the rest and update the docs.",
        "sha256": "9117a92664f64546bf10047fd91fa3f2df60b0f88a2b70f4ce77876a8117327a",
        "context_sources": [
          "human:current-chat/2026-10-17/answers-to-step-three-recommendations",
          "docs/ROOMEDY.md sections 19.4-19.5 and 26.1: reviewed P-01 through P-08 and Q-01 through Q-09",
          "docs/GENERIC REPO GUIDE.html step 4",
          "human:rough 2D initial review and 3D only in main editor already confirmed"
        ],
        "status": "approved",
        "approval": {
          "quote": "ok let's leave prices and budget planning out for now. use your recommendations for the rest and update the docs.",
          "source": "human:current-chat/2026-10-17/answers-to-step-three-recommendations",
          "scope": "Owner directly supplies the phase-four documentation task and accepts the reviewed recommendation set, explicitly excluding prices/budget planning. No ticket creation, implementation, Git, paid or cloud action is authorized."
        }
      },
      "evidence": [
        "docs/ROOMEDY.md#261-owner-answers-to-the-step-three-questions: all nine actual owner answers/default choices, including explicit pricing deferral",
        "docs/ROOMEDY.md#194-selected-product-and-design-refinements and #195-selected-scope-and-engineering-boundaries: accepted refinements and scope",
        "docs/ROOMEDY.md#96-beforecurrent-comparison and section 17: bounded baseline, fixed two-hour recovery, transient photos and semantic export/import",
        "docs/ROOMEDY_OVERVIEW.html, docs/README.md and README.md: aligned selected scope with no stale pre-ticket questions or open pricing choice",
        "docs/ROOMEDY.md#28-documentation-verification: 125 links/fragments and HTML structure/controls checks passed; actual rendering/provider/hosted tests not claimed",
        "human:current-chat/2026-10-17/answers-to-step-three-recommendations: owner accepted the reviewed defaults and explicitly deferred prices; no new acceptance request is needed for those same choices"
      ],
      "blockers": [],
      "approval": {
        "quote": "ok let's leave prices and budget planning out for now. use your recommendations for the rest and update the docs.",
        "source": "human:current-chat/2026-10-17/answers-to-step-three-recommendations",
        "scope": "The reviewed step-three Q-01 through Q-09 recommendations/P-01 through P-08, with Q-07 explicitly deferred, as reconciled in the listed document versions. This is the owner's direct answer to the immediately preceding recommendation/question set and Q-07 explanation. It approves that product scope, not implementation, tickets, Git, paid/cloud activity, final visual quality or unverified engineering outcomes.",
        "question_context": "The assistant presented nine pre-ticket product questions with recommended answers and invited using the recommendations with exceptions; the owner clarified Q-07 then accepted the remainder.",
        "reviewed_artifacts_sha256": {
          "docs/ROOMEDY.md": "afdd2a9e4742e060757ea9195445b7733c079996b0b670c7564f6d5044c521d1",
          "docs/ROOMEDY_OVERVIEW.html": "89ec11989893b48b465b95e41f4926b68173de7b56790741ecb09189ebe88394",
          "docs/README.md": "439e6f7310d6ed90401926953b49fc88b03778071bd3eb70084cfd7accb1ccf7",
          "README.md": "e9b29faf45166358237e071ac36a1ae6ff411892a349721b0d4e8c43ff9ea5a1"
        },
        "version_note": "The owner reviewed the recommendation set in the chat. The document versions faithfully apply that selection; the main-document hash excludes only its progress block.",
        "recorded_at": "2026-10-17T16:59:43+00:00"
      },
      "decision": "approved",
      "reviews": [
        {
          "decision": "approved",
          "approval": {
            "quote": "ok let's leave prices and budget planning out for now. use your recommendations for the rest and update the docs.",
            "source": "human:current-chat/2026-10-17/answers-to-step-three-recommendations",
            "scope": "The reviewed step-three Q-01 through Q-09 recommendations/P-01 through P-08, with Q-07 explicitly deferred, as reconciled in the listed document versions. This is the owner's direct answer to the immediately preceding recommendation/question set and Q-07 explanation. It approves that product scope, not implementation, tickets, Git, paid/cloud activity, final visual quality or unverified engineering outcomes.",
            "question_context": "The assistant presented nine pre-ticket product questions with recommended answers and invited using the recommendations with exceptions; the owner clarified Q-07 then accepted the remainder.",
            "reviewed_artifacts_sha256": {
              "docs/ROOMEDY.md": "afdd2a9e4742e060757ea9195445b7733c079996b0b670c7564f6d5044c521d1",
              "docs/ROOMEDY_OVERVIEW.html": "89ec11989893b48b465b95e41f4926b68173de7b56790741ecb09189ebe88394",
              "docs/README.md": "439e6f7310d6ed90401926953b49fc88b03778071bd3eb70084cfd7accb1ccf7",
              "README.md": "e9b29faf45166358237e071ac36a1ae6ff411892a349721b0d4e8c43ff9ea5a1"
            },
            "version_note": "The owner reviewed the recommendation set in the chat. The document versions faithfully apply that selection; the main-document hash excludes only its progress block.",
            "recorded_at": "2026-10-17T16:59:43+00:00"
          }
        }
      ]
    },
    {
      "id": "05-tickets",
      "name": "Ticket plan",
      "gate": "tickets",
      "status": "complete",
      "prompt": {
        "text": "ok let's move to step five and create the detailed tickets from the docs. use the reference repos for the ticket structure, and don't start implementing yet.",
        "sha256": "90cfddbcf2f6db45e41f02bfa633edd07e318fa679aaf21f0e21b740faddf9ff",
        "context_sources": [
          "human:current-chat/2026-10-17/direct-step-five-request-and-exact-task-prompt",
          "docs/ROOMEDY.md sections 1-28 and approved product choices in section 26",
          "docs/GENERIC REPO GUIDE.html step 5",
          "Read-only ticket files in ClipBuilder, screen-pilot, Retrosum and Retailor"
        ],
        "status": "approved",
        "approval": {
          "quote": "ok let's move to step five and create the detailed tickets from the docs. use the reference repos for the ticket structure, and don't start implementing yet.",
          "source": "human:current-chat/2026-10-17/direct-step-five-request-and-exact-task-prompt",
          "scope": "The owner directly authored this exact phase task and explicitly requests the detailed documentation-derived ticket plan using actual reference ticket structures. Creation and review preparation only; implementation is explicitly prohibited. No result approval, Git permission, paid call, deployment or blanket prompt pre-approval is inferred."
        }
      },
      "evidence": [
        "docs/tickets/README.md and RM-001 through RM-020: unchanged twenty-packet/35-edge queue, each with lesson references and prevention requirements; 24 new acceptance items, 188 unchecked total; all Planned",
        "AGENTS.md: concise documentation-first build rules and required feedback/checklist reading before feature work; actual commands remain future RM-001 work",
        "docs/references/LESSONS_FROM_VISUAL_FEEDBACK.md: 24 guidelines, four exact referenced task identities, 27 feedback evidence entries and two attributed historical audit examples; scoped adaptations and non-transferred product/approval decisions explicit",
        "docs/design/REVIEW_CHECKLIST.md: 22 unchecked reusable checks plus required journey/state matrix; owning-feature checks precede cumulative RM-015 review",
        "docs/ROOMEDY.md sections 19.6, 22.5, 27.6 and 28, docs/README.md and HTML overview: aligned guideline ownership, source/verification limits and implementation hold",
        "Guideline revision review fingerprint: ff9104ac6d12af81efbf65534a4665efa9c18e86b2d7dddad19c609d880d70e3; SHA256 of compact sorted-key JSON list of {path,sha256} records, sorted by repository-relative POSIX path, for 28 current planning files (root README/AGENTS; docs README/ROOMEDY/HTML/lessons/checklist; all 21 ticket Markdown files); main document hash excludes only its delimited progress block",
        "Documentation checks: 344 local links/fragments pass; all lesson IDs/evidence references valid; 20 Planned packets and original 35 earlier-only dependencies agree with index; 188 ticket criteria/22 reusable checklist items unchecked; HTML balanced with 24 IDs and existing controls; no external runtime resources; illustration script unchanged",
        "human:current-chat/2026-10-17/feedback-guidelines-request: owner explicitly asks to derive/document visual, efficiency, code-quality and security lessons before proceeding; no new product feature, result approval, implementation, Git, paid/cloud or other-task authority inferred",
        "Source access: read_thread called for all four referenced tasks and paginated; oversized-turn gaps in the first two filled from local histories for those exact task IDs. No screenshot attachments re-inspected, source tasks messaged/changed, apps run or prior acceptance reproduced."
      ],
      "blockers": [],
      "approval": {
        "quote": "ok i approve the updated ticket plan and guidelines. let's do step six, make a file level commit plan and stage and commit the docs and tickets using RM-000. don't start implementing yet.",
        "source": "human:current-chat/2026-10-17/approve-plan-and-rm-000-commit",
        "scope": "Approves the revised twenty-ticket plan and feedback guidelines at review fingerprint ff9104ac6d12af81efbf65534a4665efa9c18e86b2d7dddad19c609d880d70e3. Authorizes step-six file-level planning and local RM-000 documentation/ticket commits only, including their checkpoint records. Does not authorize application implementation, RM-001 through RM-020 implementation commits, push, paid calls, cloud/deploy actions, final frontend visual acceptance or future security findings.",
        "reviewed_artifact_fingerprint": "ff9104ac6d12af81efbf65534a4665efa9c18e86b2d7dddad19c609d880d70e3",
        "reviewed_file_count": 28,
        "question_context": "The revised plan/guidelines were presented with implementation explicitly on hold; the owner now directly approves them and requests step six.",
        "recorded_at": "2026-10-17T17:37:06+00:00"
      },
      "decision": "approved",
      "reviews": [
        {
          "decision": "approved",
          "approval": {
            "quote": "ok i approve the updated ticket plan and guidelines. let's do step six, make a file level commit plan and stage and commit the docs and tickets using RM-000. don't start implementing yet.",
            "source": "human:current-chat/2026-10-17/approve-plan-and-rm-000-commit",
            "scope": "Approves the revised twenty-ticket plan and feedback guidelines at review fingerprint ff9104ac6d12af81efbf65534a4665efa9c18e86b2d7dddad19c609d880d70e3. Authorizes step-six file-level planning and local RM-000 documentation/ticket commits only, including their checkpoint records. Does not authorize application implementation, RM-001 through RM-020 implementation commits, push, paid calls, cloud/deploy actions, final frontend visual acceptance or future security findings.",
            "reviewed_artifact_fingerprint": "ff9104ac6d12af81efbf65534a4665efa9c18e86b2d7dddad19c609d880d70e3",
            "reviewed_file_count": 28,
            "question_context": "The revised plan/guidelines were presented with implementation explicitly on hold; the owner now directly approves them and requests step six.",
            "recorded_at": "2026-10-17T17:37:06+00:00"
          }
        }
      ]
    },
    {
      "id": "06-plan-commit",
      "name": "Planning commit",
      "gate": null,
      "status": "complete",
      "prompt": {
        "text": "ok i approve the updated ticket plan and guidelines. let's do step six, make a file level commit plan and stage and commit the docs and tickets using RM-000. don't start implementing yet.",
        "sha256": "90c564e77c5aaca2b2652b5aa798d9fa6b2dfe0ccb492241551e8993147e0b5f",
        "context_sources": [
          "human:current-chat/2026-10-17/approve-plan-and-rm-000-commit",
          "docs/GENERIC REPO GUIDE.html step 6",
          "docs/ROOMEDY.md canonical progress and approved phase-five fingerprint",
          "README.md, AGENTS.md and full current documentation/ticket inventory; Git status and initial commit inspected"
        ],
        "status": "approved",
        "approval": {
          "quote": "ok i approve the updated ticket plan and guidelines. let's do step six, make a file level commit plan and stage and commit the docs and tickets using RM-000. don't start implementing yet.",
          "source": "human:current-chat/2026-10-17/approve-plan-and-rm-000-commit",
          "scope": "The owner directly authored this exact step-six instruction. It authorizes a file-level plan plus local RM-000 documentation/ticket staging and commits only. No general prompt pre-approval or implementation authority is supplied."
        }
      },
      "evidence": [
        "commit:b97db4b927036e9f82d1ab4e44a876797d9ec1c3 — RM-000: document product blueprint guidelines and ticket plan; 33 exact allocated files, independently verified against reviewed bytes",
        "docs/commit-plans/RM-000.md: all file allocations, two scoped RM-000 batches and explicit prohibition on implementation/future implementation commits/push/paid/cloud actions",
        "docs/validation/RM-000.md: 388 local links, 20 Planned tickets/35 acyclic edges/188 unchecked criteria, 24 guidelines/27 evidence entries/22 unperformed checklist checks, balanced HTML/24 IDs/script integrity, source hashes and scoped credential/content/whitespace checks",
        "Reviewed/committed 33-file sorted path/SHA-256 manifest digest: ba62eaae59f233c77502004a8033a2f26a9ac2ee64a49d14e7f8ea0b62f95826; initial snapshot worktree independently confirmed clean",
        "Phase-six completion record is restricted to docs/ROOMEDY.md, docs/commit-plans/RM-000.md and docs/validation/RM-000.md in the planned RM-000 checkpoint commit",
        "human:current-chat/2026-10-17/approve-plan-and-rm-000-commit: updated plan/guidelines and documentation-only local commits explicitly approved; implementation still explicitly withheld"
      ],
      "blockers": [],
      "approval": null,
      "decision": null,
      "reviews": []
    },
    {
      "id": "07-build",
      "name": "Execute and validate tickets",
      "gate": null,
      "status": "complete_local",
      "prompt": {
        "text": "ok let's start step seven. execute and validate the tickets in order, follow the guidelines, and stage and commit after each. use fake mode and stop at the required review gates. no paid calls or deployment.\n\ndo this till u hit 0% codex usage then u must stop.",
        "sha256": "de39f37a60901030e652540c667516b426afdbaaf95908e36d044a7c9566189e",
        "context_sources": [
          "human:current-chat/2026-10-17/start-step-seven-ordered-fake-build",
          "docs/tickets/README.md ordered queue and named gates",
          "docs/ROOMEDY.md sections 8,14-18,21-24; AGENTS.md and feedback guidelines",
          "build/references/prompts.md phase 07, execute/SKILL.md and validate/SKILL.md"
        ],
        "status": "approved",
        "approval": {
          "quote": "ok let's start step seven. execute and validate the tickets in order, follow the guidelines, and stage and commit after each. use fake mode and stop at the required review gates. no paid calls or deployment.\n\ndo this till u hit 0% codex usage then u must stop.",
          "source": "human:current-chat/2026-10-17/start-step-seven-ordered-fake-build",
          "scope": "Direct owner-authored phase-seven instruction authorizes ordered local execution, validation and ticket-prefixed staging/commits in fake mode. Stop at required result review gates or reported 0% remaining Codex usage. No paid calls, deployment, push, reset-credit consumption or delegation."
        }
      },
      "evidence": [
        "commit:56b7d0fb8b97ed77b8f495460308a3778538ef95 — RM-001 verified local foundation; actual hosted CI unverified",
        "commit:dc07101324ce91f7066abc34243ef218eebe80c4 — RM-002 complete local catalogue/asset/fixture outcome, 33 tests and all root gates passed",
        "RM-003 selected in numeric order; clean worktree, both committed dependencies confirmed, full ticket and blueprint sections 8–10/24.3 read. Codex remaining 13%.",
        "Owner approved all review recommendations and resumed ordered fake execution; approved documentation refinements written across exact allocated paths before RM-003 source/test edits resumed. docs/reviews/2026-10-17-plan-review.md and docs/commit-plans/PLAN-REFINEMENT-2026-10-17.md.",
        "commit:3cf041b95fb12645a902aceae05bf8a2606ed805 - RM-000 approved plan refinements: 28 exact documentation paths; 20 packets/35 original dependency edges, 52 new unchecked criteria and 386 local links/fragments checked; source excluded. RM-003 resumed under amended authority; revised shared build passed, independent corpus/final gates pending.",
        "RM-003 required local outcome verified: 70 focused tests and test types; pnpm check passed format/lint/all types, six executable boundary cases, exact two GLB/eight SVG asset checks, 84 unit/integration tests and shared/backend/frontend production builds. Read-only review has no actionable findings; 18-source manifest independently matches 5966599a0e245d8f5cad520d659cf54f62641883f92bbeb6694793fbfec43164. docs/validation/RM-003.md records limits. Exact-path commit next.",
        "commit:bc349f5b546d3668a762155fed1877afee3d1f3a - RM-003 complete local outcome; exact35changedpaths staged from36allocatedpaths, reviewed source manifest matched, all gates passed and worktree clean immediately aftercommit. RM-004 selected next in numeric order; full amended ticket/linked scope read and dependencies verified. Latest usage97%used/3%remaining.",
        "RM-004 local outcome verified 2026-10-18: actual five-size landing and mobile entry screenshots, keyboard/refresh/fallback, finite scripted sequence; final pnpm check passed 91 tests, six boundary cases, exact assets, format/lint/types and all builds. Settled eleven-source read-only review has no actionable findings; manifest c0d4fc7094e793a2d5be1201eb3bf5097acc2a6e69f4ef666bd444b92f1692ce. docs/validation/RM-004.md. Exact commit next. Active guide goal registered; 100% remaining at latest read.",
        "commit:bd0bf78debd743b212ae5a1cf2308e2690c9f46e - RM-004 landing/entry and earthy palette locally complete; 25 exact allocated paths, eleven source blobs matched review identity; final gate 91/91 tests and all builds passed, worktree clean after commit. RM-005 selected next; full ticket and precision references read; exact pre-edit allocation docs/commit-plans/RM-005.md.",
        "RM-005 in progress 2026-10-18: one controller/resource registry and precision SVG UI written within allocation; 20 focused session/adapter tests pass; frontend/test types, lint and executable boundaries pass at scoped checkpoints. Actual browser verified half-mm numeric placement, field focus/errors, scaled/panned drag to 3400 mm, outside drop cancellation, single drag Undo, keyboard nudge, palette Apply/whole Undo and catalogue insertion. Focus/navigation refinements and remaining browser matrix/settled full gate/read-only validation remain; no completion or commit claim. Latest usage1%used/99%remaining.",
        "RM-005 complete local outcome 2026-10-18: final pnpm check passes112tests/11files, six boundaries, exact assets, format/lint/types and all builds; focused36tests pass. Actual furnished/partial/empty browser states cover half-mm placement, scaled/panned drag, outside/overlap rejection, lock/rotate/resize/measurements, catalogue/owned replacement/removal/Undo, previews and five viewport sizes. Native Change room interaction blocked by automatic browser approval and preserved; separate fixtures used safely, no bypass. OS pointer-cancel/physical/hosted/provider/owner acceptance limits explicit. Final read-only review clean;23source/config/test manifest b1d06ea3a28a19b72b0fe8d1b9e2dee9be407eb85074625df3a60a3953f28a1b;35allocatedpaths/217local linked files checked. docs/validation/RM-005.md. Exact scoped commit next.",
        "RM-005 committed 85c73620a0bc6d36bbe3559676a94238b4c43ffc; exact 23 source/test/config blobs SHA b1d06ea3a28a19b72b0fe8d1b9e2dee9be407eb85074625df3a60a3953f28a1b; root gate 112/112 tests and builds passed.",
        "RM-006 read fully and exact paths allocated in docs/commit-plans/RM-006.md before feature edits.",
        "RM-006 docs/validation/RM-006.md: final 9-file source SHA 29669d8011eebde4c2fb2e482223d376080d6d85b950ffb07123e2267d8b5d80; read-only pass 2 no actionable findings; settled pnpm check passed 120 tests, six boundaries, exact assets, types/builds; actual browser controls/candidate/Undo, missing asset, empty/partial and responsive evidence with unperformed device/context limits.",
        "RM-006 committed f73ce2e65c3d5e2954ecad523cb477c5bed3760a; clean worktree; 20 exact paths, final 9-file source SHA 29669d8011eebde4c2fb2e482223d376080d6d85b950ffb07123e2267d8b5d80; 120-test root gate and read-only pass 2 complete.",
        "RM-007 packet and precision references read; 33 exact paths allocated in docs/commit-plans/RM-007.md before feature edits. Codex usage latest 4% used / 96% remaining; no reset consumed.",
        "RM-007 final24-path source/config/test/fixture SHA809d6de1a53b51e7ba121ecded614e69e98fef8d97a94a757d7007342bc3bc2e;34 exact allocated paths; final147/147 tests, six boundaries, exact assets/types/builds passed. Read-only pass2 no actionable findings after independently reproduced position-lock and manifest/Undo fixes. Actual empty/partial/furnished intake/review/editor and responsive screenshots are in docs/validation/RM-007.md. Latest usage7% used /93% remaining; goal active; no reset consumed.",
        "RM-007 committed d1d8c302909e85f052b66b37a70520354a8aa976; clean worktree after34-path commit; final147 tests/root/build gate and read-only pass2 complete. RM-008 full packet/precision sections and current OpenAI schema/function/data docs read;40 exact paths allocated before feature edits.",
        "RM-008 allocation extended before shared test fixture creation to41 exact paths. Final31-path source/config/test SHA f202eec39a0a1e84c0ec2e9ebd6ec87160e6df5ba1cb1251fa3a898525371a3d; final170/170 tests in18 files (7.24s), six boundaries, exact assets/types/builds passed. Read-only pass2 no actionable findings after independently reproduced cancellation, empty output, active replay TTL and persistent provider file-reference corrections. Actual local no-cost probes and measured packed-body allocation are recorded in docs/validation/RM-008.md. Latest usage8% used/92% remaining; no reset consumed.",
        "RM-008 committed3e6d4c102678f38828122421d7202eaf990ea5f6; clean41-path commit, source SHA f202eec39a0a1e84c0ec2e9ebd6ec87160e6df5ba1cb1251fa3a898525371a3d, final170-test/root gates and read-only pass2 complete. RM-009 full ticket/precision references and dependencies read;28 exact paths allocated before edits for incremental search, trusted scope, one owned worker and yielding backend adapter.",
        "RM-009 allocation extended before lazy session-entry edit to29 paths. Final21-path source SHA db5ae4b95fb64ce0df67824bda14e5001f190151badc4f6c5b2497c6b1ad8c66; final190/190 tests in21 files (10.88s), six boundaries, exact assets/types/builds passed. Read-only pass3 no actionable findings after independently reproduced captured-scope, clean-estimate flag and irrelevant dimension-unlock advice corrections. Final-source native15 runs returned one candidate each; tight work-area distance3014.96->300mm with aligned chair, owned central area5227500->6250000mm2, maximum40-piece/24-feature loopback health14/2/2ms. Native browser search UI remains unperformed until RM-011; full receipt docs/validation/RM-009.md. Latest Codex9% used/91% remaining; no reset consumed.",
        "RM-009 committed bfd9e6d524b4a58cfbc3768b127118db1a1fda32 after final190-test/root/native/read-only validation; clean worktree. RM-010 exact allocation docs/commit-plans/RM-010.md before feature edits.",
        "RM-010 final235-test/root/build/browser gate and read-only pass3 passed;21-path source SHA256 2d3e65fe53c9796a4db0489228b1f2ebf25c0a08d3f2d2378e191bab9213b401; exact30-path commit next. Fake HTTP0/1/1 observations; actual photo correction/acceptance tests; live/device/owner evidence separate. Usage last10used/90remaining.",
        "RM-010 committed 526a6b3c84670074fe4542b9c5f76e2c992c424d; clean worktree. RM-011 exact33-path allocation before feature edits. Usage11used/89remaining; no reset consumed.",
        "RM-011 final274tests/26files, all root/build/asset/boundary gates and clean read-only pass1. Actual native worker/fake HTTP,2D/3D, Apply/Cancel/whole Undo, responsive composer/tour checked.32-path source SHA9ddb4990a285f1e964fc27c64d38819b637506ac34ad5abcbea04f33c5580fb6;41 exact allocated paths. Exact authorized local commit next; live/physical/hosted/owner limits in docs/validation/RM-011.md. Usage13used/87remaining; no reset consumed.",
        "RM-011 committed7580870ca7430d82329b58e304ccd443cf10fe3c after274-test/root/browser/read-only validation; clean worktree. RM-012 exact25-path allocation before feature edits in docs/commit-plans/RM-012.md.",
        "RM-012 allocation extended before renderer edits to31paths. Final314tests/28files, all root/build/boundary/asset gates and clean read-only pass3. Actual same-scale Before/Current2D/3D, refresh with unchanged expiry, project download/import/Cancel/reset and independent tabs checked; copied storage and load-failure/expiry clocks are controlled evidence.23-path source SHA5f1ae9b30a80041813e5c4e9e0f8b48e94130327ef879619d624198b1316326d; exact authorized local commit next. Limits in docs/validation/RM-012.md. Usage14used/86remaining, no reset consumed.",
        "RM-012 committedb53dc8a40903020ff019c599fba41f8b7788b951 after314-test/root/native/read-only pass3; clean worktree. RM-013 exact39-path allocation before edits in docs/commit-plans/RM-013.md.",
        "RM-013 final local329tests/30files and all root/build gates passed;23offline cases/27fake adapter calls/0paid,11original synthetic images/6room groups. Native chooser covered three conditions and EXIF/repeated views; accepted furnished editor3D follows rough2D. Read-only pass2 clean after independently reproduced settlement fix. Final15-path LF source SHA e99c16d9ad75f29028c8996edf4aee3455460dc9cfce5da4ea805e0487799735;39 allocated paths; exact local commit next, then RM-014. Live/model/privacy/funding/hosted/owner evidence unperformed.15%used/85%remaining; no reset.",
        "commit:f5149b2c8b188bab67e2d6359b29e0fc9fbf3db1 - RM-013 exact39-path local commit; clean worktree. RM-014 full packet/precision refs read and49paths allocated before edits. Official Node linux/amd64 digest and CI action SHAs/pnpm integrity checked. Docker Linux daemon unavailable; actual Linux proof remains unperformed. No paid/deploy/push/reset/delegation.",
        "RM-014 local outcome final346tests/33files, seven boundaries, all root/build gates, Windows A/B/update/rollback and final raw-input-ID production cases passed. Read-only pass3 clean after independently reproduced probe-stream/header/test-env fixes.53allocated paths;39owned source/config/test raw SHA 90ca59b863b449aaf8e6d3dbc422a6e8dd23a9b873128b2d8c1b0bdd7f0aac90;166-file raw input digest7a60eb17e8d4d14deec85db56a1f67923e36d120fcf6e6569c0d351876ab7ba3. Docker Linux engine absent; actual Linux/image/hosted/CI/live evidence unperformed, fail-closed checks preserved. Exact local commit next, then RM-015 performance and actual owner visual stop.17%used/83%remaining; no reset.",
        "Final preflight adopted unchanged Next-generated frontend AGENTS.md after verifying its generator and reading matching bundled guides.54exact allocated paths; final166-input identity and39-source SHA/346-test gate unchanged. No feedback/export action. Exact local commit next.",
        "commit:2e27f79b5aa912685b027b76e0c990bf0b0b4998 - RM-014 exact54-path validated local commit; clean worktree. RM-001 through RM-014 local outcomes prepared. Next RM-015 under the explicit numeric execution authority."
      ],
      "blockers": [
        {
          "kind": "external",
          "reason": "Actual hosted GitHub/Linux workflow execution is unverified; no push was authorized.",
          "reference": "docs/validation/RM-001.md"
        },
        {
          "kind": "external",
          "reason": "Actual Docker Linux engine unavailable; Linux images/runtime/nonroot/probes remain unperformed. Hosted CI/IAM/live/model/funding/privacy also unperformed; no external mutation authorized.",
          "reference": "docs/validation/RM-014.md"
        }
      ],
      "approval": null,
      "decision": null,
      "reviews": []
    },
    {
      "id": "08-performance",
      "name": "Performance investigation",
      "gate": null,
      "status": "complete_local",
      "prompt": {
        "text": "Continue the approved Roomedy numeric fake/paid-off ticket loop with RM-015, after committed RM-014. Explore landing/editor load and bundle splitting, native photo preparation and cleanup, discrete manual/Apply/Undo actions, active drag/orbit/transition frames, bounded search/cancellation, history/project growth and shared admission/concurrency. Check the already-inspected Retrosum workspace/controller and Retailor bounded-intake examples for inspiration only where relevant; current Roomedy implementation and the feature receipts govern, and sibling authority/secrets are excluded. Read the full RM-015 packet, blueprint sections7/18-20/24, feedback lessons and internal visual baseline. Inspect and document actual owning code before adding scoped fixes. Allocate exact paths before edits. Use controlled representative and40-piece/24-feature rooms and bounded synthetic photos; record Windows/browser/build/viewport/counts/cold-warm/repetitions and practical failure thresholds. Separate discrete latency from continuous frame intervals and preserve unperformed browser-native peak/physical/live/Linux evidence. Use permitted native browser interactions and existing development DOM observations without state injection or alternate rendering. Reconcile the full320x568,390x844,430x932,768x1024,1024x768,1280x720,1366x768,1440x900,1920x1080 plus orientation/short-height matrix; test keyboard/numeric/focus/error/status/contrast/motion. Retain rough2D review only and3D solely in the main editor, earthy website palette, fixed two-hour expiry with its criterion-level timing limitation and all authority/security/resource bounds. Use focused meaningful regressions, one settled applicable gate and read-only validation with independent defect confirmation. Prepare actual runnable frontend/screenshots and exact evidence, then stop at the RM-015 owner visual result gate before RM-016. Do not invent approval or new capabilities, delegate, spend, deploy, push or consume a reset. Stop at reported0% remaining usage.",
        "sha256": "5148f3aad673885c43f9f91386571678dbfbdc2efa3b67ad091959d29160e69f",
        "context_sources": [
          "docs/tickets/RM-015-verify-responsive-accessible-and-performant-experience.md",
          "docs/tickets/README.md workflow mapping",
          "docs/ROOMEDY.md sections7/18-20/24",
          "docs/design/visual-direction.md",
          "human:current-chat/ordered-fake-loop-and-resume",
          "build/references/prompts.md section08"
        ],
        "status": "approved",
        "approval": {
          "quote": "ok let's start step seven. execute and validate the tickets in order, follow the guidelines, and stage and commit after each. use fake mode and stop at the required review gates. no paid calls or deployment.\n\ndo this till u hit 0% codex usage then u must stop.",
          "source": "human:current-chat/2026-10-17/start-step-seven-ordered-fake-build",
          "scope": "Existing direct owner authorization for numeric tickets expressly includes RM-015 performance and stops at its actual visual result gate. This records prior authorized ticket scope, not a new owner review of the generated wording or blanket future prompt preapproval. Latest owner instruction keep going confirms continuation. User scope takes precedence over the skill default new-phase prompt pause."
        }
      },
      "evidence": [
        "docs/commit-plans/RM-015.md -12initial exact paths allocated before edits; full ticket/precision refs and feature baseline read. Existing346-test production candidate available4390/4391; dev4320/4321 untouched.",
        "docs/validation/RM-015.md; docs/design/performance.md; docs/design/visual-review.md. Exact15-path local scope, five-source raw SHA b298c0f2080f2706e1f7feaf0779647c046051838a4885169529bc3746820fd1;214-input benchmark SHA2c00c300d679fde161edad5bebee44abab46e9e09aa3472dde420b14e133321e. Final346tests/33files/seven boundaries/root/builds and clean read-only pass1;263local file links and diff whitespace checks pass. Actual nine-size matrix,18native16MP decodes, named Node/frame measurements and final production three-condition/keyboard/drag/worker/3D ApplyUndo covered. Fixed200-node maximum throughput miss retained; actual yielding deadline/abort measurements pass. Current166-file input/BUILD_IDcfa9981ac3e270627870311bdd0a0fe19cd8663c5bc09fbd76bf2954e8c0428e; review pair4390/4391 ready fake/off. RM-015 uncommitted pending actual owner gate. Latest21used/79remaining; no reset."
      ],
      "blockers": [
        {
          "kind": "external",
          "reason": "Permitted browser tooling exposes no native/GPU decode-peak profiler or effective200%/400% browser zoom; physical touch/virtual keyboard/IME/AT/GPU/long heap, production continuous/paint and cold-network evidence remain unperformed. Compound measurement criteria stay unchecked. No alternate renderer/tool bypass.",
          "reference": "docs/design/performance.md"
        }
      ],
      "approval": null,
      "decision": null,
      "reviews": []
    },
    {
      "id": "09-visual-review",
      "name": "Frontend visual approval checkpoint",
      "gate": "visual",
      "status": "awaiting_owner",
      "prompt": {
        "text": "Present Roomedy’s actual frontend for the RM-015 owner visual checkpoint. The runnable Windows standalone fake/paid-off candidate is http://127.0.0.1:4390/ with exact input/BUILD_ID cfa9981ac3e270627870311bdd0a0fe19cd8663c5bc09fbd76bf2954e8c0428e and matching private review backend4391. Show the actual final studio/proposal screenshot and link the visual/performance/validation evidence. Preserve the owner tab and original services. State the real nine-size, short-height, native keyboard/numeric/drag, rough2D-to-main-editor3D, grounded fake worker, Apply/Undo, lifecycle and measured evidence; distinguish desktop emulation, native-memory/production-frame/paint/physical/AT/zoom/cold-network/Linux/hosted/live limitations. Keep the recorded fixed-work throughput miss visible without raising runtime bounds. Owner visual feedback is pending; no approval or waiver has been supplied for this candidate. Ask whether it is approved as-is, which specific changes are wanted, or whether review is explicitly waived/deferred. Stop here. If approved, skip unsolicited design changes and resume the authorized ordered loop with the scoped RM-015 commit and RM-016. If feedback is supplied, allocate exact owners before that round, preserve functionality/quality/security/efficiency, earthy website palette, independent finishes, rough2D-only initial review, deliberate motion and responsive room geometry; validate only the requested round and re-present for actual owner approval. No animation-off/render-off setting, OS suppression, paid call, deployment, push, reset consumption, delegation or inferred result approval. RM-015 remains awaiting owner and its changes unstaged/uncommitted; no RM-016 or security work now.",
        "sha256": "cfcf2b7ef79b84e06119c071e5bea51c3edb8c5aaa98d26acc31931f918a6629",
        "context_sources": [
          "docs/tickets/RM-015-verify-responsive-accessible-and-performant-experience.md",
          "docs/design/visual-review.md",
          "docs/design/performance.md",
          "docs/validation/RM-015.md",
          "human:current-chat/ordered-fake-loop-stop-at-review-gates",
          "build/references/prompts.md section09"
        ],
        "status": "approved",
        "approval": {
          "quote": "ok let's start step seven. execute and validate the tickets in order, follow the guidelines, and stage and commit after each. use fake mode and stop at the required review gates. no paid calls or deployment.\n\ndo this till u hit 0% codex usage then u must stop.",
          "source": "human:current-chat/2026-10-17/start-step-seven-ordered-fake-build",
          "scope": "Prior direct owner authority includes preparing and presenting RM-015 at its required visual gate. This records authorization to present the already-approved ticket scope, not new human review of generated prompt wording, visual approval/waiver, future quality work or blanket prompt preapproval. Latest keep-going instruction continues only up to that stop."
        }
      },
      "evidence": [
        "docs/validation/RM-015A.md",
        "docs/validation/RM-015B.md",
        "docs/validation/RM-015C.md",
        "docs/validation/RM-015D.md",
        "docs/tickets/RM-015E-edit-furniture-directly-in-3d.md",
        "docs/validation/RM-015E.md: direct floor-plane3D editing, one command/Undo, desktop/phone interaction checks,360tests and both builds; clean read-only pass1.",
        "docs/commit-plans/RM-015F.md: exact22-path refined plan; E dependency committed66c4dca.",
        "docs/validation/RM-015F.md: conversational scoped designer, typed interpretation/clarification, explicit owned finish, computed space/style proposals,384tests/both builds and clean read-only pass2.",
        "docs/commit-plans/RM-015G.md: exact15-path plan; current sample baseline finds valid empty/partial/work candidates, without geometry/limit changes.",
        "docs/validation/RM-015G.md: actual3 sample conversations,5 injected Responses parity cases, zero actual metered dispatches,399tests/both builds; two reference/constraint findings fixed and read-only pass2 clean.",
        "docs/commit-plans/RM-015H.md: exact17-path plan; actual visible-mode/copy inventory and preservation rules, with G dependency clean.",
        "docs/validation/RM-015H.md:21 paths, concise honest product copy, actual review/error/chat/recovery,399tests/both builds and clean read-only pass1.",
        "docs/validation/RM-015I.md:11 paths, permanent motion/copy authority, animated retained floor/wall materials, actual1280/390 checks,401tests/both builds and clean read-only pass1.",
        "docs/validation/RM-015J.md; docs/design/visual-review.md: all ten local outcomes, current173-input/BUILD_ID8acd4dbbb784766d1d02e082708af184d31cdf46ec4d7e054b91527612feea11,401tests/both builds, production9-size/full-flow/three-condition/export/recovery/3D checks, current repeated measurements,305local links and clean read-only pass1. Actual owner decision remains unchecked.",
        "docs/commit-plans/RM-015K.md; docs/tickets/RM-015K-review-and-rebalance-page-layouts.md: exact26-path allocation, actual1280 canvas y429.5/document948 and wide entry/intake/review baseline.",
        "docs/validation/RM-015K.md; docs/design/layout.md; docs/design/visual-review.md: exact27-path all-page space correction, final173-input/BUILD_ID fdb8f63c2b37669c8111cbdf0787d243900b54077ff94ee6c0a5344d0908e3fd,401tests/33files/root/both builds,63 exact-production size/state observations, expanded-chat and tour fixes independently verified; read-only pass2 clean. Actual owner visual decision pending.",
        "docs/tickets/RM-015L-create-a-scroll-driven-furniture-landing.md; docs/commit-plans/RM-015L.md; docs/references/landing-research-2026-10-19.md: owner-selected assembling/rotating/opening room, exact31-path plan, credible sources and icon requirements.",
        "docs/validation/RM-015L.md; docs/design/visual-review.md: final182inputs/1,224,315bytes/BUILD_ID7fbe666c7fefbfc1a0698def8e8e3eb4108e0158d66fc93e153ca7933480e248,404tests/34files/root/both builds, actual production9-size/short/native scroll/corrected hash-entry-back/icon checks, bounded measurements and clean read-only pass3. Exact31-path local checkpoint; actual owner decision pending.",
        "docs/tickets/RM-015M-integrate-landing-content-into-the-room.md; docs/commit-plans/RM-015M.md: exact22 paths, direct owner full-scene scope and three measured old entrances with54.7â€“72ms maxima.",
        "docs/validation/RM-015M.md; docs/design/visual-review.md: final183inputs/1,232,196bytes/BUILD_ID3a6e49439c60a76d2de5be606498c6d45a2b44e5d6a1b36910076e078b01ec36,412tests/35files/root/both builds; purposeful clear grounded furniture paths, preserved warm text backgrounds with feathered seams; actual nine-size/short/native forward/reverse/hash-entry-back and3prepared startup runs; read-only pass2 clean. Sole browser URL4320, private4321 and stopped4390/4391. Exact22-path local checkpoint, actual owner decision pending.",
        "docs/tickets/RM-015N-refine-landing-glass-and-scroll-navigation.md; docs/commit-plans/RM-015N.md: exact22-path direct owner refinement planned before source edits.",
        "docs/validation/RM-015N.md; docs/design/visual-review.md: final185inputs/1,239,238bytes/BUILD_ID8e70695c2cee49e613961da3b6609c924abdadadc6250ba29909782de017677c,414tests/36files/root/both builds; glass/depth, no flat initial room, clean smooth section/skip/legacy navigation, beige underline/refined cue/account-copy removal. Actual13sizes/3startup/3entryBack cycles, measured local material cost and read-only pass1 clean. Exact24-path checkpoint; actual owner visual decision pending.",
        "docs/tickets/RM-015O-create-a-warm-photographic-landing-background.md; docs/commit-plans/RM-015O.md: exact21-path owner-selected warm photographic background, local licensed crops and bounded existing motion planned before feature edits.",
        "docs/validation/RM-015O.md; docs/design/visual-review.md: final190inputs/1760035bytes/BUILD_IDaa8d66aed1327592fde2b075ca3bc5db78b227bae1d70ccb31d93863894a0fd4,414tests/36files/root/both builds; licensed responsive515164byte background, actual13-size/photo-ready/3startup/3warm moves/clean section-legacy-skip/entryBack evidence and clean whole-ticket read-only pass1. Exact21-path local checkpoint; actual owner visual approval pending.",
        "docs/commit-plans/RM-015P.md; docs/tickets/RM-015P-restore-smooth-landing-scrolling.md: exact19-path performance-first allocation before feature edits. Q lighting recorded Planned.",
        "docs/validation/RM-015P.md; docs/design/visual-review.md: final188inputs/1495693bytes/BUILD_ID6f760018a29ea875ae511e5d436267795d3b490efba94ae68f1f3373ace47e65,414tests/36files/root/both builds; one local photo/batched scroll work, centered clear cue, small scoped frosted CTA and actual-ready text fade. Actual13-size/3startup/normal-reverse-rapid/loading/entryBack evidence, explicit limits and clean whole20-path read-only pass1. Exact20-path local checkpoint; actual owner performance/visual feedback pending, Q held.",
        "docs/commit-plans/RM-015R.md; docs/tickets/RM-015R-fill-demo-flow-with-useful-adaptive-content.md: exact22-path demo-space/background allocation before source edits.",
        "docs/validation/RM-015R.md; docs/design/visual-review.md: exact22-path adaptive demo/photo/glass header correction,191inputs/1500858bytes/BUILD_IDdee4dd163ab4881a2f4f313551f4bbce852d16dfbefd681efde416ebb985f8c8,414tests/36files/seven boundaries/root/both builds and whole-ticket read-only pass2 clean. Actual owner visual approval pending; newer direct S editor feedback queued; Q held.",
        "docs/commit-plans/RM-015S.md; docs/tickets/RM-015S-stabilize-and-simplify-room-editing.md: exact39-path plan before implementation; actual22px frame shrink baseline. T/U/V direct requests recorded Planned before held Q.",
        "docs/validation/RM-015S.md:39allocated paths;429tests/36files/seven boundaries/root/both builds;191inputs/1505081bytes/BUILD_ID9666cc877a51ac2f3cab79db5169ca484ef213e2c6d6cf20b4b6cc6f2a58d039, actual partial/furnished/outside drag+Undo/locks/fieldfocus and45nine-size DOM rows. Actual owner acceptance pending; read-only review next.",
        "docs/validation/RM-015S.md: settled39-path read-only pass1 clean; no actionable findings.429tests/root/exact191inputs and build current. Exact local checkpoint authorized separately from pending owner visual approval.",
        "docs/commit-plans/RM-015T.md:29-path source/recovery/example-photo plan, no source edits yet.",
        "docs/validation/RM-015T.md:28-path current code review has no actionable source findings;432tests/37files/seven boundaries/root/both builds,193inputs/1516490bytes/BUILD_ID3cad8f3e95adb084212e0d4d5daf668d6e43b593e73b981551c4680ec2103ccf. Final actual browser checks remain unverified after native dialog/control failure; local code checkpoint only, no visual approval.",
        "docs/commit-plans/RM-015U.md:17exact paths, same-wall window offset/preview/command/provenance/cancellation plan before edits.",
        "docs/validation/RM-015U.md:17paths,451tests/38files/seven boundaries/root/both builds,194inputs/1537856bytes/BUILD_ID85b702b15a070758551b4d37a170f3719b4b3550ca9dd95ac081abd4a258cf58; corrected canonical/display identity, clamp and finite motion. Read-only source review no actionable findings; actual browser/visual checks remain unverified after pending dialog/control failure.",
        "docs/commit-plans/RM-015V.md:14exact paths and deterministic doorway/opposite-quadrant/safe-motion plan before edits.",
        "docs/validation/RM-015V.md:14paths,469tests/39files/seven boundaries/root/both builds,194inputs/1539995bytes/BUILD_ID0a8b96b4f6afcba4d093684584dfedd7fb54ff32579ec306522e9c5b7ef230e7; same-door opposite-corner target and safe intended-area fallback. Read-only pass1 no actionable source findings; pure CPU timing distinct from pending actual T/U/V browser and owner visual checks.",
        "docs/commit-plans/RM-015W.md:21paths allocated before source edits; direct default-tour scope and read-only Retailor comparison.",
        "docs/validation/RM-015W.md:21paths,496tests/40files/seven boundaries/root/assets/both builds,197inputs/1561335bytes/BUILD_ID62bea8751b242ebb505a93b513f5f48e9a4ff3ce3c5649870773493317798e8b; immediate default fresh-room welcome and real-target guide. Ten actual welcome-size observations. Medium guide-event finding independently fixed; read-only pass2 no actionable source findings. Actual T/U/V/W guided/browser motion and owner acceptance remain unverified; automated Start unchanged, no JS dialog, manual check pending.",
        "docs/commit-plans/RM-015X.md:25paths allocated before edits; snapshot GLB, branded raster-presentation PDF and semantic project preservation plan.",
        "docs/validation/RM-015X.md:27allocated paths;525tests/42files/seven boundaries, actual four-format native downloads and JSON reimport, all latest native PDF/edge layout pages inspected, three responsive export sizes. Pass1 metadata finding independently corrected, read-only pass2 has no actionable findings. Actual owner approval/external limits stay pending.",
        "docs/commit-plans/RM-015Y.md:25paths allocated before edits; direct owner photo/gallery/glass/capture-guide requests.",
        "docs/validation/RM-015Y.md:25paths,526tests/42files/seven boundaries/root/assets/both builds,212inputs/1800508bytes/BUILD_ID41637f229a95a7e2c9b5a0f269106f1a1e2f6afeace2f509116f7e740ad1347d;26fresh empty/six-photo responsive observations,4viewer sizes, keyboard/focus/error/reorder/guide/fake2D journey; read-only pass1 no actionable findings. Exact local checkpoint separately authorized; actual owner/external limits pending.",
        "docs/commit-plans/RM-015Z.md:27paths allocated before source edits, latest direct owner simpler cards/automatic photo role requirements; Y27b0130 committed.",
        "docs/validation/RM-015Z.md:27paths,539tests/43files/seven boundaries/root/assets/both builds;212inputs/1800640bytes/BUILD_IDca0265f57ee524c5b79a4527a44301609be7403d2da269a97681535762d20827.26native empty/six-photo responsive states, guide/viewer/error and automatic fake2D journey; read-only pass1 Meets ticket, no actionable findings. Exact local checkpoint separately authorized; actual owner/external proof pending.",
        "docs/commit-plans/RM-015AA.md:24paths allocated before source edits; direct owner popular bed/other useful furniture sizing request, primary sizing research. Z59dae0a committed.",
        "docs/validation/RM-015AA.md:24paths;555tests/44files/seven boundaries/assets/root/both builds,214inputs/1815760bytes/BUILD_ID4d678008fd6e9befe7510bdf959e5f2976ea1efae73a47879100368324801a3d.13native sizes with44px controls/0horizontal overflow, actual2D/3D size/Undo/rejection/Add/Replace/photo-review checks. Read-only pass1 Meets ticket, no actionable findings. Exact checkpoint separately authorized; actual visual/physical/live/external limits pending.",
        "docs/commit-plans/RM-015AB.md:16 paths allocated before source edits; AA a8f1c02 committed. Latest owner removes bottom copy and extends canvas/rail.",
        "docs/validation/RM-015AB.md:16paths,555tests/44files/seven boundaries/assets/root/both builds;214inputs/1816197bytes/BUILD_ID2d590b7ce6e856fa1bcb0a0aa976bd820d602b432567910cef3bd166d8d9e996.26native responsive states, actual2D/3D full height, camera/move/Undo/Before/Checks/rejection;1280frame+rail gain72.5px to footer. Read-only pass1 Meets ticket, no actionable findings. Exact local checkpoint separately authorized; actual owner/external limits pending.",
        "docs/commit-plans/RM-015AC.md:14paths allocated before source edits; AB6db513e committed. Owner hides Before/Current temporarily, retains implementation.",
        "docs/validation/RM-015AC.md:14paths,555tests/44files/seven boundaries/assets/root/both builds;214inputs/1816467bytes/BUILD_ID5abdfe2d55dc3851d721a033511e7d88fddce7da008415094438c70af8c9dd7d.13native sizes hide comparison with original buttons retained; full3step tour targets Undo, real2D/3D editing/Undo, full frame preserved. Read-only pass1 Meets ticket, no actionable findings. Exact local checkpoint authorized, actual visual/external evidence pending.",
        "docs/commit-plans/RM-015AD.md:35paths allocated before source edits; AC42b400a committed; direct owner wall/floor colour/texture/photo-estimate selection.",
        "docs/validation/RM-015AD.md; docs/tickets/RM-015AD-pick-and-infer-wall-and-floor-surfaces.md: exact39-path wall/floor appearance implementation, shared Room/rough2D controls, visitor-only command/Undo and source-bound photo hypotheses; actual1280/390 hot-reloaded fake photo-review-to-3D/custom-hex/error/Undo observations,7 owned maps/finite texture blend. Earlier68focused tests/type checks predate the owner test deferral; no final root/current-build/read-only/checkpoint pass claimed. Latest direct owner says skip routine tests until queued tasks finish, fix observed errors and keep going. Changes remain unstaged/uncommitted; actual visual approval pending.",
        "docs/validation/RM-015AE.md; docs/commit-plans/RM-015AE.md:16-path shared landing/editor/export glass correction, original physical/daylight parameters and one finite prepared reflection per scene. Actual editor Overview/Doorway/click-to-select and landing render inspected on4320, captured browser errors empty. AD/AE47-path union remains unstaged, whitespace/allocation housekeeping clean. No routine tests/type/root/build/final read-only/checkpoint pass; latest owner test deferral remains, actual visual approval pending.",
        "docs/validation/RM-015AF.md; docs/commit-plans/RM-015AF.md:16-path larger dot-free browser icon on existing soft beige#e7ddcc, one SVG regenerates96/192/512/Apple180 PNG and16/32/48 ICO. Actual source/served96px art and all six revised head metadata links inspected on4320. AD/AE/AF58-path union remains unstaged, allocation/whitespace housekeeping clean; no routine suite/root/build/final read-only/checkpoint pass or owner/indexing acceptance claimed.",
        "docs/validation/RM-015AG.md; docs/commit-plans/RM-015AG.md:12-path removal of obstructing plan selection dot, shared-command clockwise/counterclockwise90deg controls and local shortest-angle CSS footprint/arrow motion. Native wardrobe180deg arrow visibility/90deg counterturn/Undo-to180deg observed; desktop frame retained480.578125px,390px controls76x44 and no horizontal overflow. Captured browser errors empty. ADâ€“AG61-path union unstaged with allocation/whitespace housekeeping clean; routine final tests/root/build/read-only/checkpoint and actual owner acceptance remain pending.",
        "docs/validation/RM-015AH.md; docs/commit-plans/RM-015AH.md:10-path correction after owner clarifies horizontal dragging. Native Corner100px right drag reproduced old room-left/yaw-0.4004rad, corrected room-right/yaw+0.4002rad; equal left drag returns direction with fixed3750/1600/450mm eye, captured errors empty. One horizontal sign change in existing shared interior owner, same smooth motion/capture/edit guards; no camera/room authority expansion. ADâ€“AH64-path union unstaged with allocation/whitespace housekeeping clean; routine final tests/root/build/read-only/checkpoint and actual owner approval remain pending.",
        "docs/validation/RM-015AD-AI.md â€” settled ADâ€“AI queue completed before578tests/45files +7boundaries/root/both builds; current216-file source/BUILD_ID0b9b5d4f8871d848efa21e195d3cf9afd171a48b8919e8ff94260aec02a2a88d; clean full-scope read-only pass1; actual native GLB/OBJ downloads and4PDF pages inspected; exact70-path authorized local checkpoint prepared. Actual owner visual acceptance and explicit external/device/full-matrix limits remain pending.",
        "docs/validation/RM-015AI.md â€” Undo/Project glass-control follow-up: actual enabled/disabled Undo, native disclosure/keyboard/focus,1280Ã—720/390Ã—844/320Ã—640/1280Ã—600 fit; scoped format/lint/frontend types passed; clean eight-path read-only pass1 and264local links. Current hot-reload source692380139950ee927d68d5b3450360f09d9d502bb8c44c7a0ccb40b1046340bb differs from prior production artifact; exact local checkpoint prepared.",
        "docs/validation/RM-015AJ.md â€” chat-owned proposal decisions and4s notices:52focused tests,586tests/45files +7boundaries/root/both builds passed;217inputs/1852400bytes/BUILD_ID6c06309495135fa86ab9afe0ab66370945057ca12afbd43ab8374b38538e6d0c; actual1280/390/320/short3D/chat Apply/Cancel/Undo, notice expiry and visitor palette observed; unchanged frame; clean15-path read-only pass1/425local links; exact local checkpoint prepared. Actual owner visual approval pending.",
        "docs/validation/RM-015AK.md â€” primary catalogue drag in2D/3D and useful Work area:62focused tests; final599tests/46files +7boundaries/root/both builds passed;222inputs/1880272bytes/BUILD_IDe80a8f900a290a2fc3c82e3eeae7614c575ea63fd2c13295f00ced4dc4c85876. Actual native drags, invalid/retry/outside/Cancel/keyboard/Undo and1280/390/320/short states inspected; final source drags rechecked. Two input review findings fixed, clean21-path read-only pass2/449local links. Exact local checkpoint prepared; actual owner visual approval pending.",
        "docs/validation/RM-015AK.md#panel-corner-follow-up--20-october-2026 â€” shared panel18px corner follow-up on618add8: CSS format passed, actual catalogue scroll/3D/390phone/short Assistant corners and Send checked; no browser errors. Exact eight-path read-only pass1 clean/442local links, local checkpoint prepared. Current hot-reload inpute264681384caeaf4198bbefffab89b7db85d60eb030ca7233c141252df9d9cca differs from prior production build; no fresh root/build/device claim. Actual owner approval pending.",
        "docs/validation/RM-015AL.md â€” new-room main-editor3D default:125focused tests; final602tests/46files +7boundaries/root/both builds passed;222inputs/1880286bytes/BUILD_ID1e94dc09455fba3db4489bc72dce787acb551c3e8ebc959ca00b8102cd1b7a58. Actual fresh3D entry, native2D switch/refresh recovery, fake photosâ†’rough2D reviewâ†’accepted3D observed; error logs empty. Clean12-path read-only pass1/459local links; exact local checkpoint prepared. Actual owner visual approval pending.",
        "docs/commit-plans/RM-015-VISUAL-REVIEW-CHECKPOINT.md and docs/reviews/2026-10-20-visual-feedback-checklist.md â€” owner explicitly approved staging/committing and will review all feedback later. Git was already clean at65048e2; 19 existing commits/211 historical paths inventoried. Exact five-file documentation-only checkpoint, clean read-only pass1/480local links/fragments; executable input/production identity unchanged from passed602-test gate. This is no actual visual approval or waiver; Q held, guide paused, RM-016 Planned.",
        "docs/validation/RM-015Z.md#continue-cta-follow-up--20-october-2026: eight-path presentation follow-up reuses landing global button primary for Continue; scoped format/lint/frontend types passed; actual desktop390px/short/focus/Enter-to-rough2D and identical landing style observed on4320. Historical production gate remains distinct; owner visual approval pending.",
        "docs/validation/RM-015Y.md#furniture-capture-follow-up--20-october-2026: 13-path paired room/furniture SVG guide and four-image sample set; actual desktop/390px/short/replay/viewer/fake Continue-to-rough2D observations, all602tests/46files,7boundaries and pnpm check/both builds passed. Built-in imagegen prompts/asset hashes recorded. Default production build identity and current inventory recorded separately; no Linux/live/owner approval claim.",
        "docs/validation/RM-015Y.md#photo-control-cleanup--20-october-2026: seven-path thumbnail View/order cleanup, full-width Remove, four-example public capacity and atomic admission. Scoped format/lint/frontend types and24photo tests passed; actual desktop/390px/short viewer click+Enter/Escape/focus/removal/two+four=six checks passed, console empty, viewport reset/tab closed. Existing recognition prompt forbids role inference from upload order; no live quality/current production-build claim.",
        "docs/validation/RM-015AM.md â€” photos Continueâ†’designed processingâ†’default3D studio directly; no separate review page or inferred confirmation. Native1280Ã—720/390Ã—844/1280Ã—600 loading, Cancel/retry, actual3D, measurement/condition correction and Undo; browser errors empty. Final624tests/47files,7boundaries/root/both builds;226inputs/2154759bytes/BUILD_ID4022549203fefb78d703d3320f4b811df1e900fa03fc2c6f42b62f6b99e2dcb6. Clean24-path read-only pass2,620local links/missing0; exact local checkpoint prepared. Actual owner visual approval pending, Q held, guide paused, RM-016 Planned.",
        "docs/validation/RM-015AN.md â€” basic selected preset/finish, numbers/details Advanced, room-side Delete beside Rotate and shared Snap switch in2D/3D. Narrow explicit visitor protected size/Delete with unchanged locks, strict assistant/final checks and one Undo. Native1440Ã—900/1280Ã—600/390Ã—844 basic/Advanced/preset/error/finish/rotation/Delete/Undo/Snap/catalogue/recovery; errors empty. Initial test-JSX boundary corrected without compiler expansion; final630tests/47files,7boundaries/root/both builds and229inputs/2158848bytes/BUILD_ID4c291864c79665f2fca09aca28787e5c4f7431e6b3146544e0bd21235b3b41fe passed. Clean27-path read-only pass2,606local links/missing0; exact local checkpoint prepared. Actual visual approval pending, Q held, guide paused, RM-016 Planned.",
        "docs/validation/RM-015AO.md â€” only selected3D furniture has a non-pickable front arrow attached to its displayed group; no new state/frame loop/export geometry. Native1440Ã—900/1280Ã—600/390Ã—844 selection/rotation/Undo/cleared/bed-vs-wardrobe/Corner/view-switch/nudge checks, errors empty. Focused52tests; final630tests/47files,7boundaries/root/both builds and229inputs/2160618bytes/BUILD_ID3dae2a99e36f6caae562ca91611840994377cb1bbbf49fcb028e3effee21cb7b passed. Clean nine-path read-only pass1/588local links/missing0; exact local checkpoint prepared. Actual visual approval pending; Q held, guide paused, RM-016 Planned.",
        "docs/validation/RM-015AP.md â€” Design Studio tool row, no top Add piece, live count/view switch in-frame bottom right and aligned shared2D/3D rail. Common Explore/Arrange/navigation/two-way Rotate/Delete/Snap, contextual camera controls, protected plan Explore and gesture cleanup retain commands/locks/motion/Undo. Native18 responsive geometry states, desktop/short/phone/tablet/edit/Undo/catalogue/recovery checks; errors empty. Focused53tests; final631tests/47files,7boundaries/root/both builds and231inputs/2160868bytes/BUILD_ID01f2d5a79a37d70b49aa2049f2e3886fc142a9865546fa19354a5b449a4671c0 pass. Full18-path read-only pass2 clean/603local links/missing0; exact local checkpoint prepared. Actual visual approval pending; Q held, guide paused, RM-016 Planned.",
        "docs/validation/RM-015AQ.md â€” sensible fresh wardrobe facing/backing, bounded four-turn new-piece suggestion until explicit rotation, numeric Add and target-scoped AI access/back-wall preferences. Existing/recovered/replacement poses, locks, complete hard checks and unknown/photo evidence preserved; assistant/recognition prompt versions updated. Native fresh partial/furnished2D/3D, fake essentials Apply/Undo, keyboard/numeric/manual override/recovery, short/phone; errors empty. Focused97+40tests; final646tests/48files,7boundaries/root/both builds,232inputs/2167159bytes/BUILD_IDd3043747df39ced0246bce6e1aff6acd0e07400cfa67b5ec73f5aae07736b702 pass.22-path read-only pass2 clean/628local links/missing0; exact local checkpoint prepared. Actual visual approval pending; Q held, guide paused, RM-016 Planned.",
        "docs/validation/RM-015AI.md â€” single-class Project Start a new room now uses shared brown styles.primary; native1280x720/1280x600/390x844,44px/focus/confirmation/Cancel/error checks and scoped format/lint/frontend types pass. Six-path read-only pass1 clean; exact local checkpoint prepared. No fresh full-root/build claim; prior AQ646 tests/artifact historical. Actual visual approval pending; Q held, guide paused, RM-016 Planned.",
        "RM-015X cover follow-up: docs/validation/RM-015X.md; native furnished4/empty3 pages rendered and inspected; final651tests/48files/seven boundaries/root/both builds; current232hashes/BUILD_ID aa72fff1d6053151ce32de3abb24c6197581057b6a6e5ecdff2ca46ff22288fa; final exact nine-path read-only review and local checkpoint. Actual visual approval pending.",
        "RM-015AF rounded icon follow-up: docs/validation/RM-015AF.md; exact SVG mark/Apple bytes, six decoded PNG/ICO frames, actual five served-asset bytes/head links, final651tests/48files/seven boundaries/root/both builds/current232hashes/BUILD_ID 2c85881e9b23195521d009a5c8f2daec5ab85092509499d8a062e5df69ca8a96; exact13-path local checkpoint, actual owner visual approval pending.",
        "RM-015AB footer follow-up: docs/validation/RM-015AB.md; actual37px reclaimed/18settled responsive2D+3D observations/edit+Undo/reload/short+phone composer; final651tests/48files/seven boundaries/root/both builds/current232hashes/BUILD_ID e026073238defa4eabebf43ccc1e26f3b03375006537a68bb7ea6154431b0317; exact10-path local review/checkpoint; actual owner visual approval pending.",
        "RM-015AR: docs/validation/RM-015AR.md; fact-owned named access toasts/removed access regions/shared4s timer, native import/selection/resolution/Undo/2D+3D/five-size no-overlap checks, final674tests/49files/seven boundaries/root/both builds/current233hashes/BUILD_ID 07d5abf467318520133c68b62cee6c66e21e44e75ae4129d3309d9bb791f782c; exact15-path local review/checkpoint. Actual owner visual approval pending.",
        "RM-015AP scrollbar follow-up: docs/validation/RM-015AP.md; native5px transient overflow reproduced, same entrance retained inside stable clipped frame; five-size active switch samples without false overflow, actual properties scrolling/edit/Undo/rejection; final674tests/49files/seven boundaries/root/both builds/current233hashes/BUILD_ID c43cc5cb207d00e65dd270dd4f394d6a2e33735928076f4e27d7715822d6f262. Exact nine-path local review/checkpoint; actual owner visual approval pending.",
        "RM-015AP single-header follow-up: docs/validation/RM-015AP.md; visible title/separate row removed, actual auto header/remaining room and card height/independent assistant panel sizing; native28 settled responsive states/tour/focus/menu/edit/Delete/Undo/chat/3D overflow checks; final674tests/49files/seven boundaries/root/both builds/current233hashes/BUILD_ID 703a59bebb5cb4ed26f538f1c0dd4a773e0d2f701466f7ac911ec6deb8402c2e. Exact eleven-path local review/checkpoint; actual owner approval pending.",
        "RM-015AS: docs/validation/RM-015AS.md; verified CC0 sources/eight local PNGs/912545bytes, stable bounded PBR material ownership/editor+landing+exports, actual before/after/responsive/finish+Undo/native downloads/all4PDF pages; final693tests/50files/seven boundaries/root/both builds/current245hashes/BUILD_ID 80a23557163f23aa8eeda19175aefb5a6b367ee280754a91dc7f69b5c43bbd44; clean34-path read-only pass1 and exact local checkpoint. Actual owner visual approval pending.",
        "docs/validation/RM-015AT.md",
        "docs/validation/RM-015AP.md:20October animated exclusive2D/3D shared pill and count removal; canonical/MEDY selection and focus retained across view/loading changes. Native phone/tablet/short/desktop, keyboard and hover observations; final798tests/53files, seven boundaries, both builds and current250input identity. Actual owner visual approval pending. Full twelve-path read-only pass1 clean; exact authorized local checkpoint prepared.",
        "docs/validation/RM-015AU.md: right-card3D open/close/slide previews with transient context fencing, shared finite demand motion, cloned cabinet door and tested drawer support. Native hinged/sliding/cabinet/window/keyboard/Undo/loading and six-size observations; final807tests/54files/seven boundaries/both builds/current254input identity. Full eighteen-path read-only pass2 clean after independently verified visual backing and preserved selection-tint corrections; exact authorized local checkpoint prepared. Actual owner visual approval pending.",
        "RM-015AV: 19-entry catalogue/TV elevation/bathroom door implemented; 822 tests/55 files,7 boundaries,both builds; native six-size/manual/MEDY/export/import and4PDF-page observations;267 exact inputs BUILD_ID570ba31247edb3a7475e3b6b6504496402ba239ba5c7e5ec7dc870e6ae0d6a43; read-only pass3 clean. docs/validation/RM-015AV.md. Actual owner approval pending; Q held, guide paused, RM-016 Planned.",
        "docs/validation/RM-015AW.md",
        "docs/validation/RM-015AX.md",
        "docs/validation/RM-015AY.md",
        "docs/validation/RM-015AZ.md",
        "docs/validation/RM-015BA.md",
        "docs/validation/RM-015BB.md",
        "docs/validation/RM-015BC.md"
      ],
      "blockers": [],
      "approval": {
        "quote": "remove the line and ask medy text",
        "source": "human:current-chat/2026-10-20/remove-composer-divider-label",
        "scope": "RM-015BC composer divider/visible-label follow-up only; no visual approval",
        "recorded_at": "2026-10-20T17:00:20+00:00"
      },
      "decision": "changes-requested",
      "reviews": [
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "we will tackle all these before our visual feedback session together ... for each todo you will plan it thoroughly, document it in a ticket ... then execute then validate ... fix any findings ... validate again ... continue to next todo till u finish all my todos thats ur goal",
            "source": "human:current-chat/2026-10-19/pre-review-todo-loop",
            "scope": "Ten agreed pre-review todos, implemented and validated in lettered tickets before the joint visual decision. No visual approval or external authority.",
            "recorded_at": "2026-10-19T07:44:08+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "Before I do any visual feedback ... so much dead empty space not utilized ... take that into consdering fully do a big review on all our pages, and fix that and document that.",
            "source": "human:current-chat/2026-10-19/all-page-space-review",
            "scope": "Review and fix all-page space use in RM-015K before the actual joint visual review; no visual acceptance, paid/live/external/delegation authority.",
            "recorded_at": "2026-10-19T12:07:15+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "Landing is way too boring ... a room assembles, rotates and opens up as you scroll (recommended) ... remove try RoomED.com from our footer ... centralize the logo ... same beige background ... same icon in Google search",
            "source": "human:current-chat/2026-10-19/landing-visual-feedback-and-selected-scroll-room",
            "scope": "Implement researched richer scroll-driven furniture landing, preserve palette/logo/dot, centered footer and opaque beige icon family. No actual result approval or paid/live/external/delegation authority.",
            "recorded_at": "2026-10-19T12:59:20+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "i think i want the room to cover the whole landing and the text to be integrated inside it in a smooth way, also upon page lage the 3d design stutters fix that",
            "source": "human:current-chat/2026-10-19/full-landing-room-and-startup-stutter",
            "scope": "Replace the adjacent/compact landing with full-viewport spatial composition and correct actual initial stutter. No result approval, RM-016 or paid/live/external/delegation authority.",
            "recorded_at": "2026-10-19T13:54:06+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "can the window use good glass texture? ... looks too cartoonish ... remove any routes like this ... scroll is SMOOTh not instant ... on hover for how it works animate a beige underline ... remove this weird starting screen ... initial furniture look weird ... remove No account needed. and this has to be way better designed",
            "source": "human:current-chat/2026-10-19/glass-clean-smooth-scroll-underline-first-reveal-cue",
            "scope": "Implement RM-015N landing glass/reveal/navigation/cue and exact copy refinement under the existing local execution/commit loop. Preserve liked text background style, motion and one app URL4320. No result approval, RM-016, delegation or paid/external authority.",
            "recorded_at": "2026-10-19T14:39:37+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "What can we do about the white background? It feels a bit like it is empty ... a really cool background ... pictures of furniture or something? Warm interior photography + textures (Recommended)",
            "source": "human:current-chat/2026-10-19/empty-background-and-selected-warm-interior-photography-textures",
            "scope": "Implement RM-015O researched local photographic/material background while preserving the animated room and liked palette/text treatment. Existing local execute/validate/commit loop only; no actual visual approval, new app ports, delegation or paid/external authority.",
            "recorded_at": "2026-10-19T15:05:51+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "its very laggy now tho after the recent additions of background, tackle that first",
            "source": "human:current-chat/2026-10-19/lag-after-background-fix-before-lighting",
            "scope": "Execute and validate RM-015P landing performance correction before held restrained warm dynamic-lighting request Q. Existing exact local commit loop only, no result approval or other authority.",
            "recorded_at": "2026-10-19T15:25:22+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "too much dead space literally in the first part of the demo flow ... demo flow should always try to DYNAMICALLY fill the screen as much as possible with content that makes sense, no filler ... maybe use the same background from landing (without the house ofc)",
            "source": "human:current-chat/2026-10-19/demo-dead-space-dynamic-useful-content-warm-background",
            "scope": "Execute/validate R whole-demo layout/background correction before held Q lighting. Existing exact local checkpoint loop; no actual visual approval or new external authority.",
            "recorded_at": "2026-10-19T15:53:45+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "if i drag it outside frame ... corner ... frame gets smaller ... remove these ... remove this from navbar ... not letting me drag and move furniture in3d ... just2D and3D ... simplified version with an advanced ... typography and colors dont fit ... navbar no background ... Export Import same row ... position and rotation unlocked by default, only dimensions locked",
            "source": "human:current-chat/2026-10-19/continued-editor-visual-feedback",
            "scope": "Execute S editor correction then separately selected T photo/manual entry, U window drag and V door-relative Corner. Existing exact local checkpoint loop; no actual visual approval or external authority.",
            "recorded_at": "2026-10-19T16:43:22+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "either you upload pictures and we extract and produce a2d3d ... or you do it manually ... empty ... few pieces ... already furnished ... for upload pics we should have pics for fake mode ... fix design ... misalignments wrong background inconsistencies",
            "source": "human:current-chat/2026-10-19/photo-manual-and-upload-feedback",
            "scope": "Execute T under existing local ticket loop, then U and V; no actual visual approval.",
            "recorded_at": "2026-10-19T17:09:39+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "window is not draggable, fix that",
            "source": "human:current-chat/2026-10-19/window-drag-feedback",
            "scope": "Independent U window correction under existing local execute/validate/checkpoint loop; actual T/U browser checks and visual approval remain pending.",
            "recorded_at": "2026-10-19T17:32:21+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "\"corner\" view is always the corner opposite to the door way nearest corner",
            "source": "human:current-chat/2026-10-19/door-relative-corner",
            "scope": "Execute V target/camera correction with existing local verification/checkpoint loop; no actual visual approval.",
            "recorded_at": "2026-10-19T17:59:58+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "the quick tour should be on by default, but check what i did in retailor to make sure the tour is programmed and animated smoothly.",
            "source": "human:current-chat/2026-10-19/default-tour",
            "scope": "Execute W under existing exact local execute/validate/checkpoint loop; actual visual acceptance remains pending.",
            "recorded_at": "2026-10-19T18:16:40+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "export should not in json it feels off, is it usable in json ? is there no 3d object we can export as? also i wanna be able to export a pdf portfolio of our design",
            "source": "human:current-chat/2026-10-19/design-exports",
            "scope": "Execute X useful3D/PDF/editorial export correction under existing exact local verification/checkpoint loop; no actual visual approval.",
            "recorded_at": "2026-10-19T18:41:08+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "sample photos should be clickable to be viewed, the 2 cards in this page should be same height ... add a horizontal scroll ... not consistently matching according to screen size ... on hover of room choices is bugged ... shareable class ... sample photos ... 2 different corners ... a cool guide ... room and a person taking a photo with phone from 2 different corners",
            "source": "human:current-chat/2026-10-19/photo-capture-feedback",
            "scope": "Latest direct photo-intake visual/interaction corrections, no result approval.",
            "recorded_at": "2026-10-19T19:17:08+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "the 2 cards have too much content for no reason; do these edits and allign them dynamically. AI should automatically understand room view vs furniture details without the user having to mention.",
            "source": "human:current-chat/2026-10-19/simpler-photo-cards-automatic-types",
            "scope": "RM-015Z implementation corrections only; no result approval",
            "recorded_at": "2026-10-19T20:04:10+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "for bed make sure they can choose popular bed sizes (single king queen etc..) try to apply this to other furtnute with known sizes, anything that can help the user",
            "source": "human:current-chat/2026-10-19/furniture-size-presets",
            "scope": "RM-015AA implementation only, not visual result approval",
            "recorded_at": "2026-10-19T20:28:46+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "i want my edit frame to continue its height to the bottom giving me more screen realestate. same with the controls on the left after we remove the text underneath it",
            "source": "human:current-chat/2026-10-20/editor-working-height",
            "scope": "RM-015AB implementation correction only; no visual result approval",
            "recorded_at": "2026-10-19T21:03:12+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "before/current feels like a dead feature, HIDE IT only for now, dont delete it yet.",
            "source": "human:current-chat/2026-10-20/hide-comparison-temporarily",
            "scope": "RM-015AC temporary presentation correction only; no result approval",
            "recorded_at": "2026-10-19T21:16:45+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "the wall colors and texture should be allowed to be picked, as also the ai in the picture analysis may be able to capture that stuff and replicate it in the 3d model. same as floor",
            "source": "human:current-chat/2026-10-20/wall-floor-appearance",
            "scope": "RM-015AD wall/floor appearance and photo hypotheses implementation only; no visual result approval",
            "recorded_at": "2026-10-19T21:35:15+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "the window texture isnt the same as the better one in the landing, fix that to match",
            "source": "human:current-chat/2026-10-20/match-editor-window-glass",
            "scope": "RM-015AE glass consistency correction only; current routine-test deferral persists, no visual result approval.",
            "recorded_at": "2026-10-19T22:22:53+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "the logo is not correct at all btw, the shape itself should be bigger and remove the dot, and background should be beige our beige that we use",
            "source": "human:current-chat/2026-10-20/browser-icon-crop",
            "scope": "RM-015AF browser-icon correction selected by the attached tab crop; no actual result approval or additional external authority, current test deferral persists.",
            "recorded_at": "2026-10-19T22:30:06+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "the dot is hiding the arrow which is important for us, also make sure that 2D has rotation controls too",
            "source": "human:current-chat/2026-10-20/plan-arrow-and-rotation",
            "scope": "RM-015AG2D arrow/rotation correction only; current test deferral persists, no actual result approval.",
            "recorded_at": "2026-10-19T22:41:18+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "also the controls of the camera sideaways when viewing from a corner is inverted i think? check it\n\nDragging left/right",
            "source": "human:current-chat/2026-10-20/corner-drag-inversion-and-clarification",
            "scope": "RM-015AH interior horizontal dragging correction only; no visual result approval, current routine-test deferral persists.",
            "recorded_at": "2026-10-19T22:50:04+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "dont add quick tour in this like navbar sort of this and remove the horizontal bar thats above and below it\n\nand hide the checks tab for now i dont really like it\n\nim sleeping so dont ask me questions, take recommneded decisisons if needed",
            "source": "human:current-chat/2026-10-20/tool-row-cleanup-and-sleeping",
            "scope": "RM-015AI navigation cleanup and routine recommended decisions without questions. All selected queued UI edits completed before settled verification, satisfying earlier skip-tests-until-finished timing. Existing exact local checkpoint authority remains; no actual visual result approval or external authority.",
            "recorded_at": "2026-10-19T23:01:58+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "scope": "Small RM-015AI header appearance follow-up only; not visual result approval.",
            "source": "human:current-chat/2026-10-20/undo-project-glass-screenshot",
            "quote": "these should use our glass class",
            "recorded_at": "2026-10-19T23:28:40+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "scope": "RM-015AJ proposal action placement and transient notices only; not result approval.",
            "source": "human:current-chat/2026-10-20/proposal-chat-and-transient-toast",
            "quote": "when doing proposed changes from the ai, this apply or dont apply should be inside the chat not outside like this; also that toast on the left does not get dismissed after a couple seconds, fix that",
            "recorded_at": "2026-10-19T23:43:30+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "i expect work area is related to adding a desk; adding furniture this way is almost impossible for most users, a drag and drop style has to be used here as the main way; should work for both 2d and 3d",
            "scope": "RM-015AK implementation only; no result approval, delegation or external authority.",
            "source": "human:current-chat/2026-10-20/catalogue-drag-and-work-area",
            "recorded_at": "2026-10-20T00:22:27+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "scope": "RM-015AK eight-path presentation-only follow-up; no result approval.",
            "quote": "this div needs to have rounded corners like the frame that views the 2d 3d plane for consistency, the hard corners are showing inconsistency in design",
            "source": "human:current-chat/2026-10-20/panel-rounded-corners",
            "recorded_at": "2026-10-20T00:39:57+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "make the 3d view the default one not the 2d",
            "scope": "RM-015AL main-editor initial view only; saved explicit choices and rough2D photo review retained. No result approval.",
            "source": "human:current-chat/2026-10-20/default-main-editor-3d",
            "recorded_at": "2026-10-20T00:48:13+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "instead of draft my room, lets make it use continue and the design of the cta in 2nd screnshot, make sure thats a sharebale class",
            "source": "human:current-chat/2026-10-20/photo-continue-shared-cta",
            "scope": "RM-015Z photo CTA presentation follow-up only; no actual result approval.",
            "recorded_at": "2026-10-20T07:36:50+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "remove this text, and put another animation next to this animation same size same style, but of someone taking pics of the furniture, u dont have to explain anything the drawings are enough\n\nand thats where i need u to put 2-3 more photos of the furniture in this photo in the sample",
            "source": "human:current-chat/2026-10-20/furniture-capture-guide-and-detail-photos",
            "scope": "RM-015Y paired caption-free SVG guides and two additional furniture-detail sample photographs only; no result approval.",
            "recorded_at": "2026-10-20T07:49:07+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "remove the \"view\" cta cuz we dont need it clicking on the photo views it anyway, and remove the arrows, the like order of pics should not matter to the ai anyyway when we do it in real mode in the future",
            "source": "human:current-chat/2026-10-20/photo-view-badges-and-order-arrows",
            "scope": "RM-015Y thumbnail control cleanup; retain direct photo viewer and identity-based recognition. No live quality or result approval.",
            "recorded_at": "2026-10-20T07:54:35+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "this page doesnt make sense, its the same page as the studio with same controls and everything but its called a \"draft\"\n\nits an unnecessary step, i say we put the user after they choose photos into a processing loading page first, design that even in fake mdoe so i approve of design cuz surely in real mode ai will take time, and then straight into studio where the user can still edit everything just like this useless draft page",
            "source": "human:current-chat/2026-10-20/direct-photo-processing-to-studio",
            "scope": "RM-015AM implementation: remove separate rough review, show processing including finite fake preview and open editable studio. Not actual visual-result approval or live-provider authority.",
            "recorded_at": "2026-10-20T08:23:54+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "I don't want to see the numbers if I'm not in the advanced setting, right? I just want to see the size preset. I want to see the piece finish. I don't want to see rotate 90 degrees on the right. Rotate is on the left. I want to see a delete button next to the rotate 90 on the left ... Instead of having replace and remove from plan in the right card ... in the Snap maybe let's make it at least in the same design as the other buttons, but in a toggle form",
            "source": "human:current-chat/2026-10-20/simplify-selected-furniture-controls",
            "scope": "RM-015AN implementation: basic preset/finish, detailed numbers/options Advanced, selected Delete beside Rotate, shared styled Snap switch. Explicit visitor Apply/Delete may deliberately override relevant protection for that operation without changing saved locks or assistant authority. Not actual visual approval.",
            "recorded_at": "2026-10-20T08:41:06+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "i want to when i select a furnite i can see the arrow of its pointing where in 3d only when i select it tho",
            "source": "human:current-chat/2026-10-20/selected-3d-furniture-direction",
            "scope": "RM-015AO selected3D front-direction indicator implementation only; no result approval.",
            "recorded_at": "2026-10-20T09:02:12+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "remove these 2 text on the left; add a text instead in the same row as furniture add piece etc on their left in a different typography Design Studio; remove add piece; put number of pieces and 2d 3d inside the studio frame bottom right; align frame and left CTAs with the right card; normalize both except camera angle",
            "source": "human:current-chat/2026-10-20/studio-layout-and-controls",
            "scope": "RM-015AP implementation only; no actual visual approval",
            "recorded_at": "2026-10-20T09:15:22+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "the furnite should initaklly be placed where the arrow points make sense; why is my wardrobe by default pointing at the wall; thsi is something that the ai should take into account to",
            "source": "human:current-chat/2026-10-20/furniture-initial-facing",
            "scope": "RM-015AQ implementation: sensible starter and new-piece orientation, shared AI planning preference and evidence-honest recognition. No actual visual approval.",
            "recorded_at": "2026-10-20T09:35:24+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "start new room should be in the brown class",
            "source": "human:current-chat/2026-10-20/project-primary-class",
            "scope": "RM-015AI Project-menu primary-class follow-up only; no actual visual approval.",
            "recorded_at": "2026-10-20T09:49:43+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "the pdf is so good, but the 3d object in first page is so small there is so much space, also the word life is the last latter is like half hidden fix that",
            "source": "human:current-chat/2026-10-20/pdf-cover-scale-and-italic",
            "scope": "RM-015X cover framing follow-up implementation only; no overall visual result approval.",
            "recorded_at": "2026-10-20T09:54:05+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "can we make the logo rounded edges just like how instagram is?",
            "source": "human:current-chat/2026-10-20/rounded-browser-icon",
            "scope": "RM-015AF rounded browser-icon corners only, keeping the selected Roomedy mark/palette. No overall visual approval.",
            "recorded_at": "2026-10-20T10:05:32+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "also remove the horziontal line in the footer and this text, not needed, extend everything to bottom",
            "source": "human:current-chat/2026-10-20/remove-studio-footer",
            "scope": "RM-015AB footer-removal/full-bottom follow-up only; no actual visual approval.",
            "recorded_at": "2026-10-20T10:14:10+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "what does the box on the wardrobe mean? if its related to the bed being too close o wardrobe then show a toast",
            "source": "human:current-chat/2026-10-20/furniture-access-toast",
            "scope": "RM-015AR: replace unexplained access-conflict regions with named transient toasts from existing spatial facts; no overall visual approval.",
            "recorded_at": "2026-10-20T10:26:30+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "when i swithc to 3d a weird vertical scroll bar appears then disppears, fix that",
            "source": "human:current-chat/2026-10-20/3d-entrance-scrollbar",
            "scope": "RM-015AP follow-up: eliminate transient overflow during the 3D entrance while preserving motion; no overall visual approval.",
            "recorded_at": "2026-10-20T10:49:16+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "Let's actually, like, not have design studio and push everything up so it matches with, like, the top bar. I know I marked as this, like you put them down, but it's more like raising everything up, right? And then obviously make the height of the cards, like, automatically, dynamically translate to fit the part that it's, you know, after, like, translation. You know what I mean?",
            "source": "human:current-chat/2026-10-20/single-editor-header",
            "scope": "RM-015AP follow-up: remove visible Design Studio, raise tabs to the header and dynamically fill the released working height. No overall visual approval.",
            "recorded_at": "2026-10-20T10:56:38+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "Is there something that we could do to the textures of the furniture and the ground and the walls to make it better? It feels way too plain ... try to research if there are free assets that we can use ... improve the textures, go for it. Research, plan it thoroughly, and go for it.",
            "source": "human:current-chat/2026-10-20/free-material-detail",
            "scope": "RM-015AS: research, plan and implement free local material-detail improvements; no overall visual approval or new lighting feature.",
            "recorded_at": "2026-10-20T11:16:06+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "Like revise it thoroughly, make sure that it can do everything that we do manually. It can do it through the chatbot, including asking for the tour, including changing specific dimensions of something, or rotating it, deleting it, anything, literally anything, zooming. Like the assistant should be able to do anything.",
            "source": "human:current-chat/2026-10-20/complete-medy-revision",
            "scope": "RM-015AT: full manual-editor chat parity, explicit MEDY naming/friendly useful conversation, coherent modern tidy design defaults, Meet MEDY landing/reference comparison, then realistic fake-mode parity. Offline real-path implementation/injected tests only; no key setup or paid/live dispatch/visual approval.",
            "recorded_at": "2026-10-20T11:57:59+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "2D 3D should be like a toggle ... a cool animated thing ... remove the pieces count.",
            "source": "human:current-chat/2026-10-20/animated-view-toggle",
            "scope": "RM-015AP animated exclusive view toggle and count removal only; actual visual approval remains pending.",
            "recorded_at": "2026-10-20T13:31:43+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "There should be, like, a way to trigger these animations in the right card, you know, so people can just have an idea what it looks like when the doors are open or, you know, when the thing is, like, in a different format.",
            "source": "human:current-chat/2026-10-20/opening-parts-preview",
            "scope": "RM-015AU3D selected opening/closing/sliding previews only; no result approval.",
            "recorded_at": "2026-10-20T13:46:37+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "we need to add more furniture btw, mirror is important for example, a shelf wtih animated drawers; a tv stand and a tv; and add the posibibility of adding a bathrom door WITHOUT the addition of bathroom room",
            "source": "human:current-chat/2026-10-20/expanded-bedroom-catalogue",
            "scope": "RM-015AV catalogue, TV mounting and bathroom door only; no visual approval.",
            "recorded_at": "2026-10-20T14:28:00+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "delete button is always disabled even tho i have afurniture selected ... the only thing i cant delete is the door, even the window is deletable, even the bed is deletable.",
            "source": "human:current-chat/2026-10-20/delete-selected-items",
            "scope": "RM-015AW selected deletion and protected doors only; no visual approval",
            "recorded_at": "2026-10-20T15:32:50+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "maybe export needs to be in like a beige class just to be able to differ from import",
            "source": "human:current-chat/2026-10-20/export-beige",
            "scope": "RM-015AX Project menu Export styling only; no visual approval",
            "recorded_at": "2026-10-20T15:45:03+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "Don't label Medy as MEDY just Medy and add the like usual ai star that people use; user's chat right aligned, AI left aligned without bubble; scroll older messages.",
            "source": "human:current-chat/2026-10-20/medy-chat-presentation",
            "scope": "RM-015AY Medy identity and chat presentation/history usability only; no visual approval",
            "recorded_at": "2026-10-20T15:53:20+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "since furunite room and Medy controls what the right column does, lets switch the position of the cta's of those with the Undo and project buttons; but make it so that Project appears first; and also add a smooth animation for the project dropdown its too static",
            "source": "human:current-chat/2026-10-20/header-order-project-motion",
            "scope": "RM-015AZ header group order and Project menu motion only; no visual approval",
            "recorded_at": "2026-10-20T16:11:39+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "i think in this case the text can be vertical rather than horziontal (obv the letters will not be above each other i think u know what i mean here)",
            "source": "human:current-chat/2026-10-20/sideways-furniture-label",
            "scope": "RM-015BA precision2D label fitting only; no visual approval",
            "recorded_at": "2026-10-20T16:35:57+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "explore view and arrange room is not intuitive; if a furnite is selected that means we are in arrange room mode, if no furniture is slected we are in explore view mode; remove the cta's for thos",
            "source": "human:current-chat/2026-10-20/selection-arrange",
            "scope": "RM-015BB selection-driven interaction only; no visual approval",
            "recorded_at": "2026-10-20T16:46:39+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "remove this text [attached Enter to send · Shift+Enter for a new line composer hint]",
            "source": "human:current-chat/2026-10-20/remove-chat-hint",
            "scope": "RM-015BC composer hint only; no visual approval",
            "recorded_at": "2026-10-20T16:57:59+00:00"
          }
        },
        {
          "decision": "changes-requested",
          "approval": {
            "quote": "remove the line and ask medy text",
            "source": "human:current-chat/2026-10-20/remove-composer-divider-label",
            "scope": "RM-015BC composer divider/visible-label follow-up only; no visual approval",
            "recorded_at": "2026-10-20T17:00:20+00:00"
          }
        }
      ]
    },
    {
      "id": "10a-quality",
      "name": "Quality audit and fixes",
      "gate": null,
      "status": "pending",
      "prompt": null,
      "evidence": [],
      "blockers": [],
      "approval": null,
      "decision": null,
      "reviews": []
    },
    {
      "id": "10b-security-review",
      "name": "Security audit and manual review",
      "gate": "security",
      "status": "pending",
      "prompt": null,
      "evidence": [],
      "blockers": [],
      "approval": null,
      "decision": null,
      "reviews": []
    },
    {
      "id": "11-security-fixes",
      "name": "Approved security fixes",
      "gate": null,
      "status": "pending",
      "prompt": null,
      "evidence": [],
      "blockers": [],
      "approval": null,
      "decision": null,
      "reviews": []
    },
    {
      "id": "12-handoff",
      "name": "Final local handoff",
      "gate": null,
      "status": "pending",
      "prompt": null,
      "evidence": [],
      "blockers": [],
      "approval": null,
      "decision": null,
      "reviews": []
    }
  ]
}
```
<!-- build-progress:end -->
