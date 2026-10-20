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

## Rounded browser-icon follow-up allocation — 20 October2026

Parent027b308 is clean. Owner supplies adjacent Roomedy/Instagram tabs and asks “can we make the logo rounded edges just like how instagram is?” This selects rounded browser-icon tiles, preserving the existing large cocoa mark/beige. It supersedes the earlier all-opaque browser-corner requirement; the site's wordmark and opaque Apple touch asset retain their selected surface-specific treatment. No new identity, provider/dependency/service/port/delegation/push/deploy. Actual owner visual approval remains pending; Q held, guide paused, RM-016 Planned.

Exact paths allocated before source/asset edits:

1. `docs/README.md`
2. `docs/ROOMEDY.md`
3. `docs/tickets/README.md`
4. `docs/tickets/RM-015AF-enlarge-and-simplify-browser-icon.md`
5. `docs/commit-plans/RM-015AF.md`
6. `docs/validation/RM-015AF.md`
7. `docs/design/visual-direction.md`
8. `apps/frontend/public/brand/roomedy-icon.svg`
9. `apps/frontend/public/brand/roomedy-icon-96.png`
10. `apps/frontend/public/brand/roomedy-icon-192.png`
11. `apps/frontend/public/brand/roomedy-icon-512.png`
12. `apps/frontend/public/favicon.ico`
13. `apps/frontend/src/app/layout.tsx`

Round the existing SVG beige tile with18px corners on its96px square; retain the exact paths/transform/ink and transparent pixels only outside that tile. Render96/192/512 PNGs and16/32/48 ICO entries from this one vector using existing sharp. This radius retains the large mark inside the background. Keep Apple180 opaque because its target applies its own mask. Revise browser URLs to stable `room-mark-3-rounded`; preserve explicit types/sizes and unchanged Apple URL. Inspect generated assets at native tab scale and enlarged on light/dark surroundings, parse/decode every ICO frame and compare served assets/head metadata through sole4320. Use scoped asset/format checks and one settled root/both-build gate, exact inventory, full13-path read-only review, independently verify/fix/revalidate any findings, then exact standing-authorized local checkpoint. Use the main build-state helper; leave actual owner/Chrome-cache/Google/physical checks distinct.
