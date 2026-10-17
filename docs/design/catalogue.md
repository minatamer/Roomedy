# Roomedy catalogue and representation policy

RM-002, 17 October 2026. Canonical catalogue version: `catalogue-v1`. [Pure shared records](../../packages/spatial/src/catalogue.ts) are used by browser/backend consumers through `@roomedy/spatial`; [contracts](../../packages/contracts/src/catalogue.ts) own strict schemas. Frontend filtering, finish previews and representations consume those records. No price, currency, retailer, shopping or inventory-availability data exists.

## Supported collection

All sizes are outer physical **width × depth × height in mm**, local front +Z. Width/depth are unrotated; quarter-turns swap plan extents. Bed dimensions describe the frame, not the mattress. Access values are provisional modeling allowances, not certified ergonomic clearance.

| Versioned catalogue ID | Nominal size | Supported dimensions / representation | Access |
| --- | --- | --- | --- |
| `procedural-bed` | 1600 × 2100 × 850 | W1000–2000, D1900–2200, H450–1100; rebuilt frame/headboard/soft parts | 600, open access |
| `procedural-desk` | 1200 × 600 × 740 | W900–1800, D500–900, H680–820; rebuilt top/legs/rail | 800, open access |
| `procedural-chair` | 550 × 550 × 900 | W450–750, D450–800, H750–1300; rebuilt seat/back/legs | 800, pullout behind local front |
| `wardrobe-hinged` | 1200 × 600 × 2100 | W800–2400, D450–700, H1600–2600; rebuilt carcass/doors | 800, hinged |
| `wardrobe-sliding` | 1600 × 650 × 2100 | W1200–2600, D600–750, H1800–2600; rebuilt carcass/sliding fronts/track | 600, sliding |
| `procedural-storage` | 800 × 350 × 1200 | W400–1400, D250–500, H600–2200; rebuilt open shelf | 600, open access |
| `chair-desk-fixed` | 670 × 630 × 1216 | Exact size only; prepared Kenney desk chair, clay/charcoal materials | 800, pullout behind local front |
| `bedside-storage-fixed` | 540 × 440 × 470 | Exact size only; prepared Kenney bedside cabinet, oak/charcoal materials | 450, hinged |

Procedural records support oak/ivory/clay/sage/walnut/charcoal references. Fixed chair supports clay; fixed cabinet supports oak. A different fixed size is **unavailable**, with an explicit adjustable-representation choice; never stretch a fixed model or silently replace its dimensions. Unknown versions stay unavailable and preserve semantic room data. Missing eligible meshes use a labelled procedural representation at the **same** dimensions and ID, without changing fit. The same API can choose this fallback explicitly when an asset fails; actual renderer loading/error integration is RM-006.

## Exact selected source and preparation

Reviewed [Kenney Furniture Kit page](https://kenney.nl/assets/furniture-kit), the included license and [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) before using the files. Author: **Kenney**. The exact downloaded archive is `kenney_furniture-kit.zip`, SHA-256 `e67652d0932cee41683f74711c03d3e192a2af9979ef8e6b237711f5482d46b0`. Its included license identifies **Furniture Kit 2.0**; the website's older release listing is not substituted for that artifact identity. No purchased asset or other library is used.

Selected originals: `Models/GLTF format/chairDesk.glb` and `Models/GLTF format/cabinetBed.glb`. Prepared files: [chair](../../apps/frontend/public/catalogue/chair-desk-v1.glb) and [cabinet](../../apps/frontend/public/catalogue/bedside-storage-v1.glb). The [exact license](../../apps/frontend/public/catalogue/LICENSE-Kenney.txt) is retained without line-ending conversion. CC0 requires no attribution; the author/source/license record is retained voluntarily, without suggesting endorsement. The [manifest](../../apps/frontend/public/catalogue/manifest.json) records original/prepared filenames, hashes, bytes, source URL, per-file transform, semantic dimensions and measured bounds.

Preparation adds a uniform scale-2 root and a center/floor translation. Local fronts remain +Z: the chair's high back is at negative Z, and the cabinet's door is at positive Z. Palette factors are remapped to the owned material references. No nonuniform mesh stretch, animation, texture, remote buffer or runtime download remains. Runtime scale is 1 in metres; semantic mm conversion happens once at the renderer boundary. Source archives/unselected models never enter public output.

| Prepared item | Bytes | Triangles | Materials / textures | Actual prepared envelope in metres |
| --- | --- | --- | --- | --- |
| Desk chair | 39,200 | 588 | 2 / 0 | 0.669900 × 0.628598 × 1.215200 |
| Bedside cabinet | 7,684 | 72 | 2 / 0 | 0.532000 × 0.430000 × 0.466400 |

Catalogue outer sizes intentionally enclose these similar meshes with small padding. Mesh measurements are preparation evidence, never runtime collision authority. Each asset budget is 256 KiB, 10,000 triangles, 8 materials and zero textures; actual totals are **46,884 bytes / 660 triangles**. Manifest vertex counts sum vertex attributes per primitive, including shared attributes drawn by multiple primitives; they are not a unique-vertex estimate.

Reproduce offline after `pnpm build:shared`:

```powershell
python scripts/prepare_catalogue.py C:\path\to\kenney_furniture-kit.zip
pnpm check:assets
```

The preparer checks the exact reviewed archive hash, reads only the two selected mesh names/license, and obtains actual records, palette and procedural parts from local modules. It generates eight labelled SVG thumbnails from those geometries/dimensions. New definitions need preparation plus visual reinspection. The verifier independently loads the GLBs through Three's GLTFLoader, checks bytes/hashes/local buffers, floor/center/envelope at all four quarter-turns and finite geometry budgets. It also validates thumbnail hashes/sizes/safe SVG and exact public inventory. Generated assets are excluded from format rewriting; the exact license is marked `-text`.

## Finish presets

**Warm & simple:** oak floor, ivory walls, eligible proposed oak pieces. **Light & airy:** oak floor, ivory walls, eligible proposed ivory pieces. **Calm & focused:** walnut floor, sage walls, eligible proposed sage pieces. Room finishes remain separate from platform chrome.

`previewFinishPreset` returns an appearance-only preview: no new revision, changed dimensions/poses/IDs/ownership/locks, or canonical commit. Owned pieces preserve their finish. Unsupported recoloring returns exact unavailable IDs and leaves those items unchanged. Apply still belongs to the shared command/controller path in later tickets.

## Authored fixtures and independent facts

[Fixtures](../../apps/frontend/src/features/session/fixtures/rooms.ts) create fresh copies from authored data. They do not claim photo interpretation. The sample has supplied dimensions and independent size/position/rotation locks; the wardrobe position is fixed, retained pieces have locked dimensions, and proposed pieces remain flexible. No HTML corner coordinates were copied.

All conditions use a 4200 × 4800 mm rectangle. Sample/empty have authored height 2600 mm. The partial fixture retains bed/wardrobe, explicitly leaves room height unknown and labels bed height estimated. Empty has no furniture; furnished is the useful complete sample. The conflict fixture is separately disclosed: move the desk to (1500,1600), retaining the bed, producing a **900 × 600 = 540,000 mm²** overlap.

Independent [expected facts](../../test/fixtures/spatial-expectations.ts) are hand-derived from center ± half extents, with world-corner ordering northwest/northeast/southeast/southwest:

| Item | Center X/Z; quarter-turns | World X interval | World Z interval |
| --- | --- | --- | --- |
| Bed | 1000/1600; 0 | 200–1800 | 550–2650 |
| Desk | 3200/1000; 0 | 2600–3800 | 700–1300 |
| Chair | 3200/1700; 2 | 2865–3535 | 1385–2015 |
| Wardrobe | 3250/3200; 0 | 2650–3850 | 2900–3500 |
| Shelf | 2200/3900; 1 | 2025–2375 | 3500–4300 |

South entrance is X200–1100, Z4800, width 900, inward/left hinge. North window is X2500–3700, Z0, sill 900/height 1100. The shelf and its front access are outside the conservative entrance envelope X200–1100/Z3900–4800. Read-only validation caught an earlier unintended shelf/entrance conflict; it was corrected in the authored sample while the separately disclosed bed/desk conflict was preserved. RM-003 must independently check these expectations, other modeled clearances and preserved baseline issues; this manifest is not a complete fit pass.

## Verification limits

See [RM-002 validation](../validation/RM-002.md). Prepared thumbnail images were actually rasterized and inspected; source geometry/palette/size identity and both min/max procedural sizes are tested. Full R3F cutaway, actual browser/GPU/device presentation, recognition resemblance and owner visual approval remain later work. No 3D appears in initial room review.
