# RM-015AF — Enlarge and simplify the browser icon

20 October2026. HEAD42b400a; AD/AE47-path batch remains unstaged and final gates deferred. Latest direct owner: “the logo is not correct at all btw, the shape itself should be bigger and remove the dot, and background should be beige our beige that we use”, with a browser-tab favicon crop. Scope the icon family, preserving the established website wordmark. No new permission gate, paid/live/dependency/services/ports/delegation/push/deploy.

## Exact allocation before source edits

1. `AGENTS.md`
2. `docs/README.md`
3. `docs/ROOMEDY.md`
4. `docs/tickets/README.md`
5. `docs/tickets/RM-015AF-enlarge-and-simplify-browser-icon.md`
6. `docs/commit-plans/RM-015AF.md`
7. `docs/validation/RM-015AF.md`
8. `docs/design/visual-direction.md`
9. `docs/design/visual-review.md`
10. `apps/frontend/public/brand/roomedy-icon.svg`
11. `apps/frontend/public/brand/roomedy-icon-96.png`
12. `apps/frontend/public/brand/roomedy-icon-192.png`
13. `apps/frontend/public/brand/roomedy-icon-512.png`
14. `apps/frontend/public/brand/roomedy-apple-180.png`
15. `apps/frontend/public/favicon.ico`
16. `apps/frontend/src/app/layout.tsx`

## Implementation and evidence

Keep the existing vector paths and cocoa#43352a; remove the circle accent from icons. Increase the mark from roughly56% to90% of96px width, centre its stroked bounds and retain a small safe margin. Use existing token soft beige#e7ddcc rather than the previous near-white oat. Re-render the committed PNG family from that SVG with the already installed sharp package; generate a standard ICO directory containing16/32/48px PNG entries, all opaque. This is code-native vector asset maintenance, not AI image generation or a new visual identity.

Metadata retains explicit image types/sizes and Apple choice, with a stable `v=room-mark-2` URL revision so fresh metadata can request the corrected art despite the previous favicon cache. Read the installed Next metadata/icon guide before that edit; keep the existing public-file metadata approach. Inspect actual icon artwork at browser scale and the local metadata/served asset through existing hot reload. Record what was observed, not Google indexing or a native Chrome cache-clearing claim. Use no routine tests or full build now, per current direct owner deferral; fix observed errors. Final exact batch/root/build/read-only/checkpoint and owner visual approval remain pending. Canonical progress only through build-state helper.
