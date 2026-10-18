# RM-015 actual frontend review

Status: **Awaiting actual owner decision; local gate/read-only review complete.** 18 October2026. This page presents Roomedy's actual native-browser evidence; an agent's assessment is not the owner's visual approval. [Performance](performance.md), [validation receipt](../validation/RM-015.md), [ticket](../tickets/RM-015-verify-responsive-accessible-and-performant-experience.md).

## Candidate and review scope

The current review is fake/paid-off: sample/manual editing, authored simulated photo draft and grounded simulated assistant/real browser worker. No real image interpretation, paid provider, deployment or physical-device acceptance is implied. The website keeps oat/sand/beige/walnut/cocoa tones. Neutral studio chrome and independent room finishes remain separate. Photos → rough2D review/correction → accepted precision2D/stylized3D. No initial-review3D control exists.

Initial production matrix used committed RM-014 standalone input `7a60eb17e8d4d14deec85db56a1f67923e36d120fcf6e6569c0d351876ab7ba3` at4390/4391. The scoped RM-015 form/copy fixes passed development and exact final production checks. Current standalone4390/4391 input **cfa9981ac3e270627870311bdd0a0fe19cd8663c5bc09fbd76bf2954e8c0428e** passed346tests/seven boundaries/root/builds and clean read-only pass1; the [receipt](../validation/RM-015.md) binds scope and limits. Original owner tab1 and dev services4320/4321 were preserved. Screenshots use disposable authored test rooms.

## Actual matrix and feature baseline

| Viewport | Landing | Precision plan | Rough review |
| --- | --- | --- | --- |
|320×568|primary CTA315–363px;305px client/scroll|273×340px SVG; scroll to full room/controls|305px client/scroll;0 canvases/3D controls|
|390×844|CTA334–382;375px client/scroll|343×340px SVG;375px client/scroll|375px client/scroll;2D only|
|430×932|CTA318–366;415px client/scroll|383×340px SVG;415px client/scroll|415px client/scroll;2D only|
|768×1024|CTA522–572;753px client/scroll|693×450px SVG; stacked tool/panel route|753px client/scroll; sketch + scrollable measurement panel|
|1024×768|CTA505–555;1009px client/scroll|608×438px SVG with side inspector|1009px client/scroll;2D only|
|1280×720|CTA456–506;1265px client/scroll|767×360px SVG with side inspector|1265px client/scroll;2D only|
|1366×768|CTA529–579;1351px client/scroll|848×438px SVG; real short-laptop state|1351px client/scroll;2D only|
|1440×900|CTA534–584;1425px client/scroll|918×513px SVG|1425px client/scroll;2D only|
|1920×1080|CTA538–588;1905px client/scroll|1394×616px SVG; full-page capture verifies right edge|1905px client/scroll;2D only|

Each actual screenshot was inspected. Narrow pages deliberately scroll; the header/hero CTA stays in the first landing viewport, while the full illustration continues below the shortest phone. No horizontal page overflow occurred in these states. The568×320 landscape measurement field/Confirm stayed reachable (553px client/scroll). This is desktop viewport simulation, not physical orientation/touch or virtual-keyboard testing. Some wide viewport-only tool screenshots clipped context despite fitting DOM geometry; full-page captures supersede those crops. A full-page capture at nonzero scroll misplaced an offscreen fixed Skip link into the image. Actual DOM showed it unfocused at y=-80px; the final owner screenshot was recaptured after native Control+Home (scrollY=0) and supersedes that capture artifact.

Reconciled internal feature baseline: [visual direction](visual-direction.md) and RM-004/005/006/010/011/012/013 receipts. Existing empty/partial/furnished source fixtures and review/intake states retain their dated evidence; this run freshly exercised furnished sample → worker proposal → Apply/whole Undo, and six-photo partial intake → explicit draft → 2D review →4100mm correction → approximate accepted room →3D →refresh. Sample and simulated draft never claim real reconstruction. Unknown dimensions remained unknown and incomplete checks stayed explicit. Historical failure/fallback/expiry tests are not relabelled newly performed physical checks.

At390px, proposal Apply/Cancel were44px high and reachable alongside the room by scrolling; at320px they wrapped without overflow. Keyboard Apply committed one coordinated desk/chair change; one Undo reversed it. Enter sent, Shift+Enter inserted a real newline, Send remained visible, and cards focused canonical furniture. IME composition is covered by controlled handler evidence, not an actual physical IME run here. Approximation and preview/current text remain visible. The current task/room retains usable geometry when the assistant opens; it does not repeatedly shrink a desktop canvas.

## Criterion-level accessibility dispositions

This is a bounded review, **not a blanket WCAG conformance statement**.

| Criterion / concern | Actual evidence / limit |
| --- | --- |
|1.3.1 /4.1.2 labels and semantics|Named native buttons/fields, grouped view/starting choices, headings, numeric alternatives and named camera controls inspected. Canvas also has furniture-list/property routes. Full screen-reader/AT acceptance unperformed.|
|1.4.1 non-colour meaning|Preview/current text, unknown/confirmed dimensions, locked labels and textual check status inspected; colour is not the only issue signal.|
|1.4.3 contrast, sampled|Actual rendered muted/oat5.87:1, cocoa/oat10.29:1, white/walnut6.63:1. Error/paper7.41:1 and focus/paper4.61:1 from current owning colours. Not an exhaustive all-state/asset audit. [W3C contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).|
|1.4.4 /1.4.10 zoom/reflow|Actual320px viewport reflow inspected with no page overflow. Native browser Ctrl+plus produced no observable zoom in IAB; actual200%/400% browser zoom is unperformed, not equated to a viewport override.|
|2.1.1 /2.4.3 /2.4.7 keyboard/focus|Enter/Shift+Enter, numeric submission, Apply/Undo, clear field focus, real focus outline and stage-heading focus observed. Proposed import starts on Cancel; prior reset/import/tour focus receipts remain relevant. Exhaustive keyboard/AT sequence unperformed.|
|2.5.8 targets / dragging alternatives|Inspected primary/proposal actions44px high; coordinate/numeric/camera buttons provide alternatives. Native phone touch/pinch and exhaustive target-spacing audit unperformed. [W3C target guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).|
|3.3.1 /3.3.2 errors|Reproduced/fixed stale wrong-axis error ownership and unassociated proposed-size errors. Actual corrected fields receive invalid state, shared alert association and a focus target; valid half-mm placement remains accepted.|
|4.1.3 status|DOM live status/alert roles and visible completed change/recovery/unknown messages inspected. Actual screen-reader announcement timing unperformed.|
|2.2.2 automatic motion|Existing finite landing sequence settles by configured4s; final stable text/state and active motion were observed. No animation-off/render-off setting or OS suppression added. No exposed browser animation timeline measurement. [W3C motion guidance](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html).|
|2.2.1 timing adjustment|**Selected limitation remains:** fixed non-extensible two-hour destructive expiry is not a >20h exception; no evidence establishes another exception. Warning/export does not supply timing adjustment. Product choice preserved. [W3C timing guidance](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html).|

## Actual artifacts and owner decision

Artifact root: `C:/Users/minat/.codex/visualizations/2026/10/17/01a14aac-181e-7b73-b283-aa17c2a407f8/`. Landing/plan/rough screenshots are named by the nine actual sizes; `RM-015-plan-1920x1080-full.jpg` supplies the full wide context. Additional images include `RM-015-studio-3D-1280x720.jpg`, `RM-015-proposal-320x568.jpg`, `RM-015-maximum-40pieces-1280x720.jpg`, `RM-015-rough-field-568x320.jpg` and `RM-015-reviewed-room-3D-390x844.jpg`. The19 early JPEG payloads were renamed to `.jpg` after checking their signature; image bytes were preserved, not redrawn. `RM-015-native-measurements.json` and `RM-015-landing-assets.json` retain bounded numeric/asset observations. No private room photos or screenshots are committed.

- [ ] Owner approves the exact presented candidate as-is.
- [ ] Owner requests a specific revision (record wording/scope, execute only that round, re-present).
- [ ] Owner explicitly waives/defers visual review (record exact scope/reason).

No option is preselected or inferred. The owner explicitly said the visuals are not approved and separately authorized the current file-level plan, staging and checkpoint commit. See the [exact commit boundary](../commit-plans/RM-015.md). The Git action does not resolve any visual option above. RM-016 remains ineligible and the guide goal stays paused at this review checkpoint; unused account capacity is not permission to bypass the owner's decision.

Final production also freshly covered empty0pieces → Add estimated bed → whole Undo0; partial2pieces/locked wardrobe/Before-Current; reset Cancel/Escape/Project focus then explicit reset; furnished5pieces with half-mm keyboard/numeric and native drag/whole Undo. At390×500, the focused multi-line composer retained44px Send at y448–492 with no page overflow. Final worker proposal1005→300mm,3D Apply/Undo and the corrected plural change count passed. This adds current evidence to the historical baseline rather than inferring it.

[Open the local website](http://127.0.0.1:4390/) or use its main-editor browser tab, which contains an unapplied authored proposal. Final actual images: [landing](C:/Users/minat/.codex/visualizations/2026/10/17/01a14aac-181e-7b73-b283-aa17c2a407f8/RM-015-final-landing-1280x720.jpg), [studio and proposal](C:/Users/minat/.codex/visualizations/2026/10/17/01a14aac-181e-7b73-b283-aa17c2a407f8/RM-015-final-studio-review.jpg), [short composer](C:/Users/minat/.codex/visualizations/2026/10/17/01a14aac-181e-7b73-b283-aa17c2a407f8/RM-015-final-composer-390x500.jpg). These are task-local artifacts, not portable hosted assets.
