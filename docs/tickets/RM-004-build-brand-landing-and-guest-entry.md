# RM-004 — Build the brand, landing and guest entry

Status: **Planned**  
Planning date: **17 October 2026**  
Milestone: **Product entry**  
Depends on: [RM-001](RM-001-initialize-workspace-contracts-and-safe-runtime.md), [RM-002](RM-002-prepare-catalogue-assets-and-room-fixtures.md)  
Suggested commit: `RM-004: build Roomedy landing and guest entry`  
Authority: [blueprint §4](../ROOMEDY.md#4-landing-and-guest-entry), [§19](../ROOMEDY.md#19-visual-direction-and-accessibility)  
Queue and execution rules: [ticket index](README.md)  
Build guidelines: [owner feedback lessons](../references/LESSONS_FROM_VISUAL_FEEDBACK.md) (L-01–L-05, L-08, L-17) and [review checklist](../design/REVIEW_CHECKLIST.md)

## Outcome and standalone context

Introduce Roomedy through a polished responsive landing and a short guest entry. The visitor should understand that they can start with an empty, partly furnished or furnished bedroom/workspace, review their room, then edit it manually or with the assistant. Use warm ivory, deep green/teal and clay with tactile stylized room art and deliberate motion.

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

## Acceptance criteria

- [ ] The real landing expresses the selected identity, guest value and three supported starting conditions.
- [ ] First-viewport navigation/message/visual/CTA are usable across representative phone, tablet and laptop sizes.
- [ ] The demonstration is labelled scripted, bounded and independent of provider/WebGL editor startup.
- [ ] Progressive entry makes sample versus own-room and room condition clear with working route/state handoff contracts.
- [ ] Sample/landing/selection generate zero metered calls.
- [ ] Copy preserves rough 2D review before main-editor 3D and contains no deferred pricing/shopping or accuracy claim.
- [ ] Keyboard/touch/focus/loading behavior is usable and deliberate motion remains present.
- [ ] Local fonts/art and shared visual foundations have traceable ownership and no unnecessary external runtime dependency.
- [ ] Actual cold load/refresh and short-laptop checks show stable typography, useful first-viewport CTA and smooth purposeful entrance/navigation without extra visitor-facing controls.

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
