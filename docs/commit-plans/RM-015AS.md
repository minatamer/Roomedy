# RM-015AS — Free photographic materials

20 October2026. Clean parent `4fca196`. Owner explicitly requests research, thorough planning and implementation of more convincing free furniture/ground/wall textures, using the liked glass as the quality reference. This is material detail, not the held Q lighting feature or authority to replace measured geometry. No permission question is needed for the selected local implementation.

## Research disposition

Current wood/floor/fabric/plaster are small deterministic noise/stripe DataTextures authored in the repo; procedural furniture uses reviewed boxes/bevels. Two fixed models are Kenney Furniture Kit2.0 CC0, with UVs, remapped colours and no embedded texture images. Select Poly Haven CC0 Oak Wood Planks, Oak Veneer01, Rough Linen and White Plaster02. ambientCG is a viable CC0 alternative; no duplicate library is needed. Keep eight small local PNG derivatives, not high-resolution vendor bundles or runtime vendor/API access. Full sources, authors, physical source scale and limits belong to [research](../references/material-research-2026-10-20.md).

## Exact allocation before product source/assets

1. `AGENTS.md`
2. `docs/README.md`
3. `docs/ROOMEDY.md`
4. `docs/tickets/README.md`
5. `docs/tickets/RM-015AS-add-free-photographic-material-detail.md`
6. `docs/commit-plans/RM-015AS.md`
7. `docs/validation/RM-015AS.md`
8. `docs/references/material-research-2026-10-20.md`
9. `docs/design/room-view.md`
10. `apps/frontend/src/features/room-view/surfaces.ts`
11. `apps/frontend/src/features/room-view/surface-assets.ts`
12. `apps/frontend/src/features/room-view/scene.tsx`
13. `apps/frontend/src/features/landing/furniture-scene.tsx`
14. `apps/frontend/src/features/design-export/scene.ts`
15. `apps/frontend/src/features/design-export/capture.ts`
16. `apps/frontend/src/features/design-export/obj.ts`
17. `test/surface-assets.test.ts`
18. `test/room-view.test.ts`
19. `test/room-surfaces.test.ts`
20. `test/design-export.test.ts`
21. `scripts/prepare-surfaces.py`
22. `scripts/check-surface-assets.mjs`
23. `scripts/check-catalogue-assets.mjs`
24. `apps/frontend/public/surfaces/LICENSES.md`
25. `apps/frontend/public/surfaces/manifest.json`
26. `apps/frontend/public/surfaces/floor-detail-v1.png`
27. `apps/frontend/public/surfaces/floor-normal-v1.png`
28. `apps/frontend/public/surfaces/wood-detail-v1.png`
29. `apps/frontend/public/surfaces/wood-normal-v1.png`
30. `apps/frontend/public/surfaces/fabric-detail-v1.png`
31. `apps/frontend/public/surfaces/fabric-normal-v1.png`
32. `apps/frontend/public/surfaces/plaster-detail-v1.png`
33. `apps/frontend/public/surfaces/plaster-normal-v1.png`
34. `scripts/release/inventory.mjs` — allocated before editing: include the newly imported material verifier in exact release-input identity.

## Implementation sequence and limits

1. Retain only selected source downloads in ignored preparation storage. Verify official metadata size/MD5 and record SHA256. Deterministically resize source diffuse/roughness/GL normal maps. Package neutral luminance albedo and linear roughness into R/G of one opaque PNG; retain a separate normalized GL normal PNG. Preserve chosen finish colours through neutral albedo detail, with restrained plaster/linen contrast and physically plausible floor tile scale. Source photographs are not room measurement evidence.
2. Extend the existing scene-owned surface factory, keeping synchronous original-pattern fallbacks and stable texture identities. Four detailed maps own their normal/roughness companions. All samplers get matching repeat transforms; only albedo uses sRGB. Keep original procedural tile/concrete/smooth behavior. Finite mipmaps/anisotropy, no generated vertices or shadow/light changes. Avoid global GPU caches and per-frame allocations.
3. One lazily started loader per surface owner: eight fixed same-origin files, serial fetch/decode, each ≤256KiB/≤512px, ≤512 retained fragments, a10s deadline and cancellation. Reuse strict still-image header/metadata handling before native bitmap decode; decode with no colour conversion for packed data, verify exact output dimensions, close native bitmap/reset temporary canvas. Apply each complete set atomically; failed/retired loads retain the original pattern. Never log raw errors/source payloads. Bound total prepared asset bytes≤1MiB and nominal expanded texture/mipmap bytes≤16MiB per surface owner; actual native/GPU overhead remains separately unmeasured.
4. Reuse the existing two-frame editor readiness and landing upload/compile/warm owners after material preparation, without timers delaying usable content. Keep context-loss listeners alive while loading and fence late callbacks. Shared material application sets albedo/normal/roughness together for furniture/room/mesh clones and finish changes; the current finite albedo transition remains. Export preparation awaits the same owned job before PDF capture or GLB/OBJ serialization and observes cancellation/disposal. No new API/schema, runtime external URL, setting, UI copy or network service.
5. Run meaningful controlled offline loader/format/pixel/deadline/cancel/dispose tests, material ownership/colour-space/transform/finish/clone tests, existing room/export invariants and executable hash/PNG/budget/licence checks. Inspect actual local before/after overview/interior surfaces, alternate finishes/Undo, both views, short/narrow states, fresh/repeated entry, landing and native exports. Name readiness/resource/frame samples and limits; no paint/native-heap/physical claim. Run one settled telemetry-disabled root/both-build/current identity gate after fixes, full34-path read-only validate, independently correct/revalidate any findings and save exact owned local paths under standing authority.

Actual owner approval remains pending; Q held, guide paused, RM-016 Planned. No paid/live/delegation/new dependency/service/port/push/deploy.


## Verified refinements

Reserve final dimensions before first upload. Actual browser inspection reproduced plain furniture/fabric/plaster when previously uploaded256/128/1px textures changed size. Full-size procedural/neutral storage fixes immutable WebGL allocation with stable identities; a pre/post dimension regression covers it.

Actual GLB export exposed native drawImage incompatibility in both roughness merging and no-tangent normal conversion. GLB-only cached canvas texture copies (at most eight512px maps) permit correct native processing. Retain transforms/colour spaces, restore borrowed references and dispose/reset copies on success or partial failure after pending serialization settles. No canonical/geometry or vendor patch. Actual GLB/OBJ/PDF downloads and all four rendered PDF pages verify integration. Allocation34 includes the imported verifier in release identity.
