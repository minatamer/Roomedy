# Room mirror rendering — RM-094

Installed Three.js0.186.1 WebGL renderer is the implementation authority. The official [Reflector documentation](https://threejs.org/docs/pages/Reflector.html) describes a planar reflected-camera render, target resolution/cost, optional MSAA and explicit disposal. [Rendering on demand](https://threejs.org/manual/pages/rendering-on-demand.html) recommends redrawing only for changes. The installed addon includes clipping/tone mapping/output colour handling; reuse it rather than inventing a second renderer/shader pipeline.

Use one shared512×512 half-float reflection target, MSAA0, one extra scene pass per requested frame. Select a front-facing visible surface with selected-piece priority, then distance and stable identity. Remaining surfaces use the existing environment-mapped glass. This deliberately bounds cost/memory even with many mirror furniture pieces and avoids recursive mirror scenes. Hide editor overlays during the auxiliary pass. The pass follows actual registered world transforms, including attached wardrobe leaves, and never changes canonical facts or schedules frames itself. Restore visibility and renderer target/XR/shadow-auto-update state in finally; an optional reflection failure falls back to normal glossy glass. Dispose the single target/material/plane once with the scene owner.

Wall-hung and standing mirrors share frame/glass semantics. Standing model has a visible pivot and support, without adding unsupported arbitrary tilt to the room contract. A wardrobe has one front-face mirror attached to the existing hinged-leaf transform. Exports retain reflective material and full geometry, without claiming live reflection capture or adding a new export lifecycle. No texture/model download or dependency is needed.

## Settled implementation

The same reflected face is used for existing Full-length mirrors and all three new models. The wardrobe panel inherits the actual leaf pivot; no independent aiming state is persisted. Surface registration retires with the component; one slot/target survives surface changes and frees once with scene ownership. Fallback still has the existing shared Day/Night environment material.

The final [receipt](../validation/RM-094.md) records27 new tests, a complete1825-test/114-file canonical gate/both builds, actual reflected room-door/native variants/heightApplyUndo/door/mobile checks and an unchanged61-second idle sample. The one-live-plane limit, no arbitrary stand-tilt control and unperformed physical-GPU/live-model/export-download checks remain explicit.
