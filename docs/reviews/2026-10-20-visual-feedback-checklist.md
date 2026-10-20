# Visual feedback to review

Snapshot: implementation committed through `65048e2`, 20 October 2026. The owner will review later and explicitly approved staging/committing. Git was already clean when that request arrived. [Consolidated file-level checkpoint](../commit-plans/RM-015-VISUAL-REVIEW-CHECKPOINT.md); [ticket/evidence map](../tickets/README.md).

Every checkbox below is for the owner's visual review. Leaving it unchecked does not mean the implementation is missing. Local verification and screenshots are recorded in each linked packet; actual owner approval remains pending. Earlier A–O foundations remain part of the review, while the current-chat corrections run P through AL.

## Landing and identity

- [ ] Keep the warm oat/sand/beige/walnut/cocoa palette and consistent typography across the site and demo chrome. Room finishes remain independent.
- [ ] Show the animated room throughout the landing, with purposeful scroll-driven furniture assembly/travel/rotation/opening and smooth reverse motion. Inspect the richer workflow/value sections and footer in the same composition. [L](../tickets/RM-015L-create-a-scroll-driven-furniture-landing.md), [M](../tickets/RM-015M-integrate-landing-content-into-the-room.md).
- [ ] Keep warm interior photography/material depth, readable soft chapter shading and a smooth landing without the heavy photo/filter/compositing work that caused lag. [O](../tickets/RM-015O-create-a-warm-photographic-landing-background.md), [P](../tickets/RM-015P-restore-smooth-landing-scrolling.md).
- [ ] Make Start designing look like frosted translucent glass, with coherent hover/focus. Use the same shared glass treatment for Back to home, Room choices, Undo and Project. [P](../validation/RM-015P.md), [Y](../validation/RM-015Y.md), [AI](../validation/RM-015AI.md).
- [ ] Prepare the landing house promptly and fade the hero text/cue when the actual scene is ready or unavailable. This is a readiness-based reveal; instant WebGL appearance is not promised. [P](../validation/RM-015P.md).
- [ ] Keep clean smooth section navigation, animated underlines and a centered, legible Explore the room cue. Preserve active motion without an animation-off setting. [N](../validation/RM-015N.md), [I](../validation/RM-015I.md).
- [ ] Use the larger room-shaped browser icon on our beige background, without its dot. The website wordmark is a separate asset. [AF](../validation/RM-015AF.md).
- [ ] Keep useful task-focused copy; remove recurring demo/development commentary and filler. [H](../validation/RM-015H.md).

## Demo entry and photos

- [ ] Fill the first demo/condition screens responsively with useful content and larger room previews. Use the landing's warm photographic background without its house; avoid dead space and empty white surfaces. [R](../validation/RM-015R.md).
- [ ] Keep Back/Room choices in the consistent header position with the shared glass hover/focus treatment. [R](../validation/RM-015R.md), [Y](../validation/RM-015Y.md).
- [ ] Present two genuinely different paths: photos to a reviewed rough sketch, or manual setup with empty/partly furnished/furnished room choices. [T](../validation/RM-015T.md).
- [ ] Supply coherent fake-mode example photos showing the same room from opposite corners, plus detail photos of its bed and bedside cabinet. Clicking all four photos opens the full-image viewer with arrows/Escape and focus return. [Y](../validation/RM-015Y.md).
- [ ] Show matching adjacent room/person/phone and furniture-photo animations without visible instructional captions. Both settle within five seconds and share an accessible icon-only Replay action; narrow screens stack the equal-size drawings. [Y](../validation/RM-015Y.md), [Z](../validation/RM-015Z.md).
- [ ] Match the two photo cards' height on desktop, use natural stacked height on narrow screens, and scroll image galleries horizontally so extra images do not stretch the cards. [Y](../validation/RM-015Y.md).
- [ ] Simplify both cards: remove redundant written steps, photo-kind selectors, duplicated explanation and the empty second Draft action. Keep Choose photos, conditional Continue and Use example photos in coherent positions. Continue reuses the landing's solid walnut pill/white label/arrow through shared global button classes. [Z](../validation/RM-015Z.md#continue-cta-follow-up--20-october-2026).
- [ ] Infer room-view versus furniture-detail roles automatically. Preserve useful details and uncertain estimates; fake examples remain authored examples, and live photo-recognition quality is separate evidence. [Z](../validation/RM-015Z.md).
- [ ] Keep the initial photo correction stage as rough 2D only; open the accepted room in the main editor's default 3D. [AL](../validation/RM-015AL.md).

## Editor layout and controls

- [ ] Let the shared background show through the transparent navbar. Remove the Your room /2D plan breadcrumb. [S](../validation/RM-015S.md).
- [ ] Extend the edit frame and left controls to the usable bottom of the screen. Keep frame/canvas/viewBox size stable while selecting, moving, committing, inspecting and undoing. [S](../validation/RM-015S.md), [AB](../validation/RM-015AB.md).
- [ ] Remove obstructive under-frame check summaries and routine action text while retaining contextual errors and accessible information. [AB](../validation/RM-015AB.md).
- [ ] Use coherent warm typography/colors in the inspector, including its empty state, with simple basic controls and a real Advanced extension for precision/locks. [S](../validation/RM-015S.md).
- [ ] Match the shared outer side panel's 18px rounded corners to the room viewport across catalogue, properties, room and assistant states; preserve scrolling and narrow natural flow. [AK corner follow-up](../validation/RM-015AK.md#panel-corner-follow-up--20-october-2026).
- [ ] Label the view controls simply 2D and 3D. Fresh/reset/accepted rooms default to 3D; explicit saved view choices restore, import retains the current view, and 2D remains one click away. [S](../validation/RM-015S.md), [AL](../validation/RM-015AL.md).
- [ ] Hide Before/Current temporarily while preserving its underlying feature. [AC](../validation/RM-015AC.md).
- [ ] Remove tool-row dividers and keep Checks and Quick tour out of that row for now, preserving their underlying behavior. [AI](../validation/RM-015AI.md).

## Furniture, room surfaces and camera

- [ ] Allow real furniture dragging in both 2D and 3D. Dragging an existing piece beyond the frame means its farthest feasible wall/corner placement, with collisions and Undo preserved. [S](../validation/RM-015S.md).
- [ ] Make catalogue drag/drop the primary Add interaction in both views, with a physical preview, valid/blocked feedback and one Add/Undo. Keep click/keyboard/touch-grip alternatives and put exact coordinate entry under Advanced placement. [AK](../validation/RM-015AK.md).
- [ ] Keep position and rotation unlocked by default; only dimensions start locked. Respect explicit saved/imported locks. [S](../validation/RM-015S.md).
- [ ] Let windows slide along their wall in both views, with the wall opening and glass moving together. [U](../validation/RM-015U.md).
- [ ] Keep the furniture front arrow visible without the selection dot covering it; provide clockwise/counterclockwise 2D rotation controls. [AG](../validation/RM-015AG.md).
- [ ] Offer familiar regional bed sizes and useful desk/wardrobe/shelf presets, with clear mattress-versus-outer-frame planning sizes and custom measurements. [AA](../validation/RM-015AA.md).
- [ ] Allow wall/floor color and texture choices, including custom colors. Carry photo-estimated appearance into review/3D without treating estimates as confirmed measurements. [AD](../validation/RM-015AD.md).
- [ ] Match editor window glass to the landing's physical glass treatment, including export appearance. Inspect the close-up furniture/material detail. [AE](../validation/RM-015AE.md), [D](../validation/RM-015D.md).
- [ ] Use smooth Overview/Doorway/Work area/Corner camera transitions. Corner is opposite the corner nearest the doorway; horizontal interior dragging follows the intended grab direction. [C](../validation/RM-015C.md), [V](../validation/RM-015V.md), [AH](../validation/RM-015AH.md).
- [ ] Connect Work area to desks: with no desk it opens desk choices, with a desk it uses the safe desk view, and removing the last desk returns safely to Overview. [AK](../validation/RM-015AK.md).

## Tour, assistant and project actions

- [ ] Offer the quick-tour welcome automatically for fresh rooms, with Start/Skip and smooth target-ready animations/focus/scrolling based on the Retailor reference. Recovered/imported work stays uninterrupted. [W](../validation/RM-015W.md).
- [ ] Keep the assistant conversational and themed, with grounded object cards, a reachable Send action, Enter/Shift+Enter and composition-safe input. [F](../validation/RM-015F.md), [G](../validation/RM-015G.md).
- [ ] Put AI proposal Apply/Cancel inside the matching chat response; keep the room preview useful and preserve whole-change Undo. [AJ](../validation/RM-015AJ.md).
- [ ] Dismiss transient notices after four seconds while leaving pending proposals usable. [AJ](../validation/RM-015AJ.md).
- [ ] Match Export/Import styling on one Project row, separated from Reset by a horizontal rule. Import uses a styled chooser. [S](../validation/RM-015S.md).
- [ ] Offer PDF, GLB, OBJ/MTL/textures ZIP and editable JSON exports. JSON remains the editable project/import format. [X](../validation/RM-015X.md).
- [ ] Make the PDF an attractive Roomedy portfolio: several 3D views, a 2D plan, factual notes/finishes and furniture schedule, using the landing's warm palette/typography. [X](../validation/RM-015X.md).

The “I already own this” checkbox remains an ownership input distinguishing existing furniture from proposed additions; explaining it did not request its removal.

## Still pending

- Warm restrained dynamic landing lighting/shadows (RM-015Q) remains queued; it has not been implemented or visually approved. [Q](../tickets/RM-015Q-add-restrained-warm-room-lighting.md).
- Actual owner review/approval remains pending. The guide goal stays paused and RM-016 stays Planned; this checklist does not waive the visual gate.
- Physical touch/AT/GPU/paint/native-heap, Linux/hosted and real-provider evidence retain their individual limits in the packet receipts. Local screenshots/tests are not substitutes for those claims.

Latest executable gate: 602 tests in 46 files plus 7 boundary tests, formatting/lint/types and both builds passed for `65048e2`. Current source/production BUILD_ID is `1e94dc09455fba3db4489bc72dce787acb551c3e8ebc959ca00b8102cd1b7a58`. No fresh app tests or browser run is claimed by this documentation checkpoint.
