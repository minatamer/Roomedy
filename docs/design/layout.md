# Layout and useful space

Owner direction,19 October2026; implemented in [RM-015K](../tickets/RM-015K-review-and-rebalance-page-layouts.md), with [actual evidence](../validation/RM-015K.md). These rules apply to future feature and visual work.

Before adding a row or stacking panels, inspect the actual available width and height. Arrange existing tasks beside one another when their content fits. A spare area must have a reason: room geometry, readable text, interaction clearance or deliberate breathing room. Do not fill it with decorative cards, repeated instructions, invented statistics or unsupported features.

The room and current task own the space. Website content uses a1520px readable shell; intake supports1600px for its real sketch/correction/catalogue tasks. Entry choices begin near the top task area, with the introduction beside choices on wide screens. Photo actions stay beside their upload/prepared-photo task and follow it on narrow screens. Sketch review remains rough2D only; wide screens show existing catalogue, sketch and corrections together, while narrow screens order sketch→corrections→optional additions.

The studio uses one compact horizontal task navigation and a wrapping title/comparison/view header. When the **actual room column** has at least700px and the viewport supports a bounded workspace, its existing camera/placement/plan controls occupy a190px rail beside the room. Otherwise they wrap above it. A window width alone cannot establish available room width. Preserve the physical room's aspect ratio and camera; do not stretch geometry to occupy a rectangular container.

Desktop width≥900px/height≥600px and tall tablet width≥760px/height≥801px use a viewport-sized studio with owned canvas/panel/conversation scroll regions. Narrow or shorter layouts use normal document flow; widths760–899px at height≤800px must not squeeze the room beside a300px inspector. Keep focus-return detection aligned with these layout conditions. Small viewports may require scrolling; every field, correction, composer, Apply/Cancel, Undo and return action must remain reachable.

Use existing furniture thumbnails and adaptive selection/catalogue grids. Pair measurement/finish fields only when their own panel supports their labels, units, input and correction action. Preserve unknown values, provenance, locks and field-specific errors. Empty chat uses actual grounded goal/style actions; mobile empty chat takes its content height. Conversation scroll must not place the composer over messages. On resize, tours must remeasure their target and keep Skip/Next inside the document viewport, including short-height overflow.

Keep natural-size motion children independent of animated parent height. Responsive changes must preserve current selection, drafts, camera journeys and shared command authority. No animation suppression or timing padding is a layout fix.

Verify320×568,390×844,430×932,768×1024,1024×768,1280×720,1366×768,1440×900 and1920×1080, plus short landscape, keyboard-sized height and neighbouring layout/container breakpoints. Inspect actual settled screenshots and DOM bounds after motion; an in-flight screenshot is not a settled layout failure or pass. Record page/owning-panel dispositions, actual before/after measurements and limits. Desktop emulation does not prove physical touch, virtual-keyboard or GPU performance.


## Current full-room landing (RM-015M)

The owner now wants the room to cover the entire landing, superseding L's adjacent/compact scene composition. One viewport-sized sticky renderer remains behind all meaningful sections/footer; semantic DOM text/actions are composed within the room with palette gradients and alternate spatial anchors, never a second illustration column or small phone strip. Preserve readable contrast, natural vertical flow and all actions on short screens. Use bounded smooth camera/framing changes and restrained copy drift; no opaque filler cards or empty scroll waits. Preparation keeps a useful full-stage poster/content available until the first actual scene pose is ready. Preserve logo/palette/dot, centered footer and L's matching opaque icons. Actual coverage, bounds and limitations belong to [M](../validation/RM-015M.md); L remains dated history.

M refinement: keep the liked warm translucent text backgrounds, palette and decorative rules. Feather only the outer chapter/footer shading edges so alternating left/right compositions have no rectangular seam. Furniture begins grounded in an awkward layout and follows clear staged floor paths toward a window-side desk and an open center; copy and existing camera/wall motion remain integrated.

## Current N first paint and navigation

N supersedes M's dimensional SVG fallback: the owner rejected its initial furniture appearance. Remove that artwork; useful semantic content and warm ambient background remain before the actual scene reveals and on graphics failure. Preserve the liked warm translucent text gradients/rules/feathered edges. Window glass needs a real opening, dimensional frame/sill and subtle daylight/reflections, not a green opaque panel against a wall. Keep the larger circular-arrow Explore the room control≥44px and spaced below the main CTA; remove the exact account sentence. Section actions keep the address clean, heading focus avoids giant section outlines, and header/cue/actions must fit phones and short laptops.
