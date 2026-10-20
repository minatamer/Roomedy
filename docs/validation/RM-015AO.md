# RM-015AO — Selected3D direction evidence

20October2026. Parent `2389731`; [ticket](../tickets/RM-015AO-show-selected-furniture-direction-in-3d.md), [nine-path allocation](../commit-plans/RM-015AO.md). Owner selects a front-direction arrow only on selected3D furniture. Actual visual approval pending; Q held, guide paused, RM-016 Planned. No paid/live/delegation/new dependency/service/port/push/deploy.

## Behavior and ownership

A walnut shaft/cone with pale halo appears beyond the selected furniture's local+Z front. Its fixed readable range is0.9–1.2m long, with display height0.12–0.3m. These are indicator dimensions, never physical furniture facts. Native review found the first small mid-height marker too subtle; the settled larger/lower marker extends beyond the silhouette. Four meshes/materials exist only for the scalar selected furniture ID. All use ignored raycasts, unlit color and no depth/shadow writes. Existing React geometry disposal and owned-material cleanup apply.

The indicator is a child of the existing animated Piece group, outside its procedural/mesh/uncertain-representation branch. Existing displayed pose and parent transform carry rotation, translation, preview/Undo and drag; no new frame loop, per-frame state or canonical command. Unselected pieces/proposal ghosts have no arrow. Selection changes/unmount remove it;2D marker/controls remain unchanged. Exporters construct their separate semantic scene and do not import RoomScene; no indicator is added to snapshot exports. Representation/export coverage here is source-reviewed, not a new native download/uncertain/GLB walkthrough.

## Checks

- Scoped source Prettier, ESLint and frontend types passed. Existing room-view/session tests passed **52tests in2files**, including all four canonical quarter-turn mappings, asset lifetime and normal commands/gesture retirement. No JSX/label mirror tests added for the reversible cue.
- Final `NEXT_TELEMETRY_DISABLED=1 pnpm check` exited0: format, lint, all types, **7boundary tests**, catalogue assets/licenses/budgets, **630tests in47files** (68.41s), shared packages and both app production builds. Isolated tests independently force fake/paid-off and deny unexpected transports; no deterministic tests targeted the app. Ignored log `.release/local-apps/run-20261020-ab0cdbf3/RM-015AO-check.log`.
- Before/after source inventories identical: **229files,2,160,618bytes**, digest/production BUILD_ID `3dae2a99e36f6caae562ca91611840994377cb1bbbf49fcb028e3effee21cb7b`. Build ID supplied only to the check subprocess. Dev.next-dev remains separate from production.next; no restart/new listener/production server. Windows/source proof is not Linux runtime.

## Actual browser observations

One isolated IAB tab on existing127.0.0.1:4320/private4321, fake/paid-off. Closed after checks; viewport reset and original user tab retained. Images saved and visually inspected in `C:/Users/minat/.codex/visualizations/2026/10/20/01a15835-0bd9-7d20-9601-faf2b8383623`.

- At1440×900, select wardrobe from inventory: one clear arrow from its front, no bed arrow. `RM-015AO-selected-wardrobe.png`. Native3D Rotate turns wardrobe and arrow together90°; leftward direction matches the front face. `RM-015AO-rotated-wardrobe.png`. Undo restores its original direction.
- Delete wardrobe then Undo: both pieces return, selection/actions disabled and no arrow anywhere. `RM-015AO-unselected.png`. Select bed: only bed gets the arrow and its headboard/foot direction agrees. `RM-015AO-selected-bed.png`.
- Corner camera keeps the selected bed arrow clear at interior scale, without a new camera action or movement. `RM-015AO-corner.png`. Overview returns normally.
- At1280×600, selected bed and marker remain visible with normal working height and controls. `RM-015AO-short.png`. At390×844, selected rotated wardrobe has a readable outward arrow, document width375 plus scrollbar and no horizontal overflow. `RM-015AO-phone.png`.
- Native2D switching retains the ordinary plan/selected wardrobe;3D switching restores the selected cue. Arrange room + canvas ArrowLeft still commits Move piece, and one Undo restores it. Captured browser error entries empty. Pointer-drag continuity follows the unchanged parent/gesture implementation; no new instrumented drag/frame/heap measurement claimed.

These are current-source desktop/emulated viewport observations, not physical-device/AT/zoom, full responsive/performance/quarter-turn camera matrix, cold-network, Linux/hosted/real-provider or owner acceptance. Existing external/fixed-expiry limitations remain.

## Read-only closeout

Final nine-path read-only pass1 reviewed the selected condition, canonical local+Z convention, displayed-parent ownership, bounded non-pickable overlay/resources, unchanged views/commands/export reachability and actual visual evidence. No actionable findings; no edits/tests/index mutations/delegation during that pass.

Exact nine allocated owners matched all changed/untracked paths, index initially empty;588decoded local file links exist, missing0, and whitespace passed. Settled scene.tsx SHA256 `c35e0f0c68475ebc59f32f5f2826822ee1d2fcff8f356e1627eb176850c9d847`; executable bytes remain unchanged after the passed gate and matching229-file source/BUILD_ID. Only allocated documentation reconciled afterwards. The build-state helper records evidence/awaiting_owner without granting approval. Exact local ticket checkpoint follows under standing authority; no security artifacts or later-phase work. Actual visual approval stays pending.
