# RM-004 — Build the brand, landing and guest entry

Status: **Complete locally**\
Planning date: **17 October 2026**  
Milestone: **Product entry**  
Depends on: [RM-001](RM-001-initialize-workspace-contracts-and-safe-runtime.md), [RM-002](RM-002-prepare-catalogue-assets-and-room-fixtures.md)  
Suggested commit: `RM-004: build Roomedy landing and guest entry`  
Authority: [blueprint §4](../ROOMEDY.md#4-landing-and-guest-entry), [§19](../ROOMEDY.md#19-visual-direction-and-accessibility)  
Queue and execution rules: [ticket index](README.md)  
Build guidelines: [owner feedback lessons](../references/LESSONS_FROM_VISUAL_FEEDBACK.md) (L-01–L-05, L-08, L-17) and [review checklist](../design/REVIEW_CHECKLIST.md)

## Outcome and standalone context

Introduce Roomedy through a polished responsive landing and a short guest entry. The visitor should understand that they can start with an empty, partly furnished or furnished bedroom/workspace, review their room, then edit it manually or with the assistant. Use the owner's latest beige/brown/earth/wood website palette: oat, sand, beige, walnut and cocoa, with tactile stylized room art and deliberate motion. This supersedes the earlier teal brand direction. The studio may use more neutral black/white chrome; furniture/room finish data stays independent.

The supplied HTML is a documentation illustration, not the application to embed wholesale. Build the real landing with a lightweight explicitly scripted example of one request, a coordinated preview, Apply and Undo. It must not initialize the heavy WebGL editor or imply a live provider response. The selected domain spelling is tryroomedy.com; no registration or hosted availability is claimed.

## Dependency evidence and proposed ownership

Use RM-001's real app composition/config and RM-002's authored records. RM-005 and RM-007 later connect the entry choices to real editor and intake outcomes.

| Area | Responsibility |
| --- | --- |
| `apps/frontend/src/features/landing/` | Hero, labelled demonstration, three journeys and concise privacy/measurement story |
| `apps/frontend/src/styles/` | Shared color, type, spacing, focus, surface and motion foundations |
| `apps/frontend/src/app/{page,layout}` | Thin route composition, metadata and local fonts/assets |
| `apps/frontend/src/features/session/entry/` | Progressive sample versus own-room and room-condition choices |
| `docs/design/visual-direction.md` | Concrete visual choices and later review requirements |

## Implementation plan

1. Create the actual design tokens, type hierarchy, mark/wordmark treatment and reusable interactive foundations. Use the generic **Roomedy assistant** label. A separate assistant mascot/name/logo is not a prerequisite.
2. Compose navigation, room-planning promise, main visual and visible **Try the demo** CTA within common first viewports. Keep the CTA usable on short laptops and phones; artwork cannot push every useful action below the fold.
3. Build a bounded deterministic landing demonstration with authored data. Show one meaningful change, affected objects and Undo. Label it scripted and avoid fake live typing claims, fabricated visitor counters, accuracy percentages or speed promises.
4. Explain three capabilities with concrete room examples and three starting conditions. Keep pricing, affordability, retail shopping, unsupported reconstruction, floor-plan/PDF intake and technical framework details out of the visitor flow.
5. Implement `/` to `/demo` entry with first **Use a sample room** versus **Add my room**, then empty/partly furnished/furnished condition. Do not present six equal hero CTAs. Sample entry needs no provider dispatch; own-room entry routes to the future rough 2D review.
6. Add concise notice that photos draft an approximate room, measurements matter, raw photos are transient, semantic recovery lasts two hours and deliberate recognition transfers selected images to the provider when available. Describe current capability honestly; unavailable live AI offers sample/manual use.
7. Make keyboard focus, touch targets, dialog semantics and loading states usable from the beginning. Preserve intended motion without animation-off/render-off settings or OS suppression. Keep content readable without relying on motion or color alone.
8. Lazy-load editor/view code after the appropriate entry boundary. Landing illustration can share public semantic metadata but must not construct an alternate editable room authority or call the assistant.

## Prevention requirements from prior feedback

Keep the landing concise and task-led with no unsolicited chips, status explanations, settings or misleading preview claims. Use representative supported room art and stable type/logo loading. Animate hero copy/CTA when ready without arbitrary delay; in-page scrolling is smooth, preserves useful focus and avoids unnecessary route/hash churn. If FAQs are included, use one coherent accessible accordion rather than unrelated new sections.

## Approved plan refinements — 17 October 2026

**Feature-owned visual baseline and settled automatic motion.** [Owner-approved review](../reviews/2026-10-17-plan-review.md). These requirements remain unverified until their owning execution evidence exists.

Apply PR-13/PR-14 while composing the real feature. Record actual short-laptop and narrow-layout states for palette, typography, padding, panel hierarchy and first-viewport CTA. Establish a small internal visual baseline for later features; this adds no new owner gate. An automatically started landing story finishes and settles within five seconds with stable readable content; deliberate interactive motion remains smooth. Do not introduce perpetual decorative motion, fabricated progress or an animation-off/render-off setting. Record criterion-specific accessibility evidence rather than blanket conformance.

## Acceptance criteria

- [x] The real landing expresses the selected identity, guest value and three supported starting conditions.
- [x] First-viewport navigation/message/visual/CTA are usable across representative phone, tablet and laptop sizes.
- [x] The demonstration is labelled scripted, bounded and independent of provider/WebGL editor startup.
- [x] Progressive entry makes sample versus own-room and room condition clear with working route/state handoff contracts.
- [x] Sample/landing/selection generate zero metered calls.
- [x] Copy preserves rough 2D review before main-editor 3D and contains no deferred pricing/shopping or accuracy claim.
- [x] Keyboard/touch/focus/loading behavior is usable and deliberate motion remains present.
- [x] Local fonts/art and shared visual foundations have traceable ownership and no unnecessary external runtime dependency.
- [x] Actual cold load/refresh and short-laptop checks show stable typography, useful first-viewport CTA and smooth purposeful entrance/navigation without extra visitor-facing controls.

### Additional approved acceptance

- [x] Actual cold/refresh/short-laptop/narrow evidence establishes the internal visual baseline and useful CTA without adding a new product or approval gate.
- [x] The automatic landing sequence settles within five seconds; active interaction motion stays smooth and readable, with criterion-level accessibility disposition.

## Focused verification and evidence

| Case | Required evidence |
| --- | --- |
| 320×568, 390×844, 768×1024, 1280×720, 1440×900 | Actual rendered screenshots/CTA visibility, no accidental horizontal overflow |
| Keyboard from page start through entry | Visible focus, sensible order and correct dialog/route focus |
| Scripted preview/Apply/Undo cycle | Correct labelled narrative and stable bounded repeated interaction |
| Browser network and bundle boundary | Zero provider calls and no heavy editor initialization on landing |
| Unavailable AI capability | Useful sample/manual entry and truthful source-controlled copy |

## Handoff and limits

Record actual browser evidence when available; synthetic DOM or static HTML checks are not screenshots. RM-015 owns the completed product matrix and owner visual approval, so this packet does not claim final acceptance. The current documentation browser restriction is not permission to use an alternate rendering workaround. Follow available tool policy and record any unperformed visual check accurately.

## Execution evidence — 18 October 2026

See [RM-004 actual checks](../validation/RM-004.md) and [exact allocation](../commit-plans/RM-004.md). Landing/entry scope is locally complete; the main editor and intake remain RM-005/RM-007. Browser asset inventory, source boundaries and paid-off runtime support the zero-metered-call invariant; a full network waterfall and physical-device/assistive testing are not claimed. Owner visual acceptance remains RM-015.
