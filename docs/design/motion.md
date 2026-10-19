# Roomedy motion and product-language policy

19 October 2026. Direct owner priority: animations are the highest interaction priority throughout Roomedy, especially in 3D. The pre-review revision queue is RM-015A–J. Actual owner visual acceptance remains pending.

## Choreography

Use a short responsive 140–220ms response for small controls, 260–420ms for panels/preview entrances, and 650–1100ms for meaningful camera journeys. Keep bounded automatic hero choreography under five seconds with stable readable content. Start ordinary motion when ready. Interrupt/reverse from the currently displayed pose, rather than snapping or queueing stale journeys. Drag follows the pointer; release/rejection and rotation remain visible transitions. These are design targets, with actual frame observations recorded per scenario, not universal device claims.

Selection, preview, Apply/Undo and Before/Current communicate actual changes. Panel content and its containing geometry move together. Keep focused fields/drafts and usable room space. Source/condition/review transitions do not recreate accepted semantic state. Loading indicators stay active during real work. Camera/animation state is presentation only: no commands, provider requests or history per frame.

## Permanent rules

No animation-off/render-off setting, OS preference suppression or global override that freezes intended movement. Idle rendering may sleep only after active transitions finish, and must wake for controls, interpolation, materials and loading. No arbitrary entrance wait, perpetual auto-updating copy, forced camera tour, flashing or inaccessible clipped controls. Keep keyboard/numeric paths and deliberate user control.

## Product language

Remove recurring demo/prototype/development commentary and simulation-warning sentences from product surfaces; avoid adding them again. Use task-focused labels and concise contextual errors/units/transfer information. Keep technical operation status and verification limits in private diagnostics and evidence documents. Copy cleanup cannot change runtime capability, provider mode, actual execution, permission or measured truth. Authored fixtures do not become personal-photo detections.

## Current ownership audit (RM-015I)

| Interaction | Active owner and lifetime |
| --- | --- |
| Camera viewpoints, orbit/look, zoom and inside steps | CameraRig interpolates from its visible pose and invalidates until arrival; direct pointer controls wake frames and interrupt travel. |
| Furniture translation/quarter-turn/finish | Piece interpolates the displayed group/materials; drag follows the actual floor ray, release/rejection returns through interpolation. Commands occur once through the controller. |
| Floor/wall finishes and cutaway | Canvas-owned material colors approach their new target without recreating maps/materials or resetting wall opacity. Target changes wake demand frames; final residual settles exactly. |
| Preview, Apply, Cancel, Undo and Before/Current | Same projection and scene owners; semantic changes supply new display targets. No animation frame writes room/history. |
| Panels and entry/review stages | useSurfaceMotion observes real containing geometry, cancels/retargets from the displayed size and preserves usable room/composer space. |
| Landing hero/CTA/scroll | Bounded dimensional room story settles4050ms; manual choices interrupt; anchors scroll smoothly and ready content enters without an arbitrary wait. |
| Work/loading | CSS spinners/stages continue during actual asynchronous bounded work; worker/backend yielding/cancellation remain separate from presentation. |

No motion/render-disable setting or OS preference suppression is present in the current source. Demand rendering is an idle optimization, never permission to freeze a live transition. These permanent rules also apply to future fixes and restored/empty/error/narrow variants. Keep H's task-oriented copy and honest sample labels; no recurring demo/development commentary. [Current material and browser evidence](../validation/RM-015I.md) is separate from the owner's visual decision and external/device proof.

## Evidence and research

Inspect actual transitions at phone/tablet/short-laptop sizes, including rapid interruption, reversal and cleanup. Record scenario, build, viewport, repetitions and active-frame timing separately from discrete actions. Physical GPU/touch/IME/heap and real-model/hosted proof remain separate.

Official product references inspected 19 October 2026: [IKEA Kreativ furniture controls](https://www.ikea.com/gb/en/customer-service/knowledge/articles/5egde8d8-bg95-467f-8810-2g52429b007c.html) for direct room manipulation; [Floorplanner editor manual](https://cdn.floorplanner.com/static/brochures/FloorplannerManualEN.pdf) for orbital/eye-level views; [Homestyler walkthrough videos](https://www.homestyler.com/video?lang=en_US) for keyframes/camera paths and assembly presentation. These are published product guidance, not signed-in comparative performance tests. Our live choreography is a Roomedy-specific adaptation.
