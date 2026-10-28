# Roomedy catalogue and representation policy

## Independent RGB and patterns — RM-015BY

Furniture frame/case, soft parts and hardware accept independent six-digit RGB; neutral plain/wood/woven/stripes/checker/herringbone patterns do not embed a fixed colour. Actual chair/seating frames now expose their existing frame role. Lighting's solid photo colour maps to its hardware role. Door leaves and opening frames have separate optional colours/patterns; window glass, screens and protected doors retain their owners. Popular swatches and a shared Presets/Custom picker offer native selection, hex and numeric RGB0–255. Invalid drafts cannot apply; accepted changes persist and Undo atomically.

Photo observations retain independent estimated/source-linked appearance facts. Fresh photo entities adopt visible supported parts, reconcile small channel differences (maximum32 per channel) and leave conflicting colours/patterns unassigned. Repeat recognition preserves accepted/reviewed entity choices. Existing six finishes remain a legacy/default palette; explicit finish changes clear a custom body-colour override. No exact colour/bitmap recovery is claimed. Three small128px grayscale procedural samplers share normal scene ownership and finite transitions; no extra image downloads, canvas, shader, dependency or provider round. [Receipt](../validation/RM-015BY.md).

## Plain starting specification — RM-015BX

Fresh manual room creation wraps the unchanged authored fixture: concrete floor, smooth ivory walls, ivory furniture with explicit plain matte bodies and plain soft parts where real roles exist. Plain uses the existing smooth sampler, zero bump, matte nonmetallic targets and uniform bedding colour; construction/seams/shape and distinct hardware/glass/screens remain. It is a supported optional material choice in schema/inspector/chat/export, not a global change to omitted legacy defaults. Recovered/imported/photo rooms and catalogue additions retain their recorded/default choices. Medy offers actual wood/linen/flooring previews; user selection never applies automatically. [Evidence](../validation/RM-015BX.md).

## Part-specific furniture materials — RM-023,26October2026

Optional `materials` on furniture describe planned frame material(auto/wood/painted/metal), supported upholstery(linen/velvet/leather), soft-part colour and original/dark/brass/steel hardware. They never establish dimensions, ownership, product identity or a price. Existing six finishes and omitted legacy defaults remain. Bedding offers linen/velvet; shades retain linen with editable colour; chairs/seating offer all three. Inspector controls appear only for actual frame/soft/hardware roles. Owned sizes outside a fixed model’s envelope keep honest bounds and frame appearance, with no soft/hardware controls that cannot affect the representation.

A local disclosure edits several choices, then one Apply commits one bounded visitor action/Undo. Explicit human Medy material requests use the same evaluator and preview list; no new model transform authority is added. Unspecified choices remain unchanged. Prepared sources/geometry stay immutable; only named wood/carpet/metal instance materials change, with original hardware colour preserved by default. TV screens and mirror glass retain their separate render owners. Procedural bedding/cushions gain subtle raised stitched channels inside original outer envelopes; physical parts and clearance rules remain unchanged. Base catalogue thumbnails remain curated base appearances rather than personalized thumbnails. No new/licensed retail asset or dependency is introduced. A nullable soft-colour patch explicitly restores its default, independently of upholstery/hardware. Use default colour in the inspector and an explicit Medy default-soft-colour request share that command. [Current evidence](../validation/RM-023.md).

RM-002, 17 October 2026. Canonical catalogue version: `catalogue-v1`. [Pure shared records](../../packages/spatial/src/catalogue.ts) are used by browser/backend consumers through `@roomedy/spatial`; [contracts](../../packages/contracts/src/catalogue.ts) own strict schemas. Frontend filtering, finish previews and representations consume those records. No price, currency, retailer, shopping or inventory-availability data exists.

## Supported collection

All sizes are outer physical **width × depth × height in mm**, local front +Z. Width/depth are unrotated; quarter-turns swap plan extents. Bed dimensions describe the frame, not the mattress. Access values are provisional modeling allowances, not certified ergonomic clearance.

| Versioned catalogue ID | Nominal size | Supported dimensions / representation | Access |
| --- | --- | --- | --- |
| `procedural-bed` | 1600 × 2100 × 850 | W1000–2200, D1900–2400, H450–1100; rebuilt frame/headboard/soft parts | 600, open access |
| `procedural-desk` | 1200 × 600 × 740 | W900–1800, D500–900, H680–820; rebuilt top/legs/rail | 800, open access |
| `procedural-chair` | 550 × 550 × 900 | W450–750, D450–800, H750–1300; rebuilt seat/back/legs | 800, pullout behind local front |
| `wardrobe-hinged` | 1200 × 600 × 2100 | W800–2400, D450–700, H1600–2600; rebuilt carcass/doors | 800, hinged |
| `wardrobe-sliding` | 1600 × 650 × 2100 | W1200–2600, D600–750, H1800–2600; rebuilt carcass/sliding fronts/track | 600, sliding |
| `procedural-storage` | 800 × 350 × 1200 | W400–1400, D250–500, H600–2200; rebuilt open shelf | 600, open access |
| `chair-desk-fixed` | 670 × 630 × 1216 | Exact size only; prepared Kenney desk chair, clay/charcoal materials | 800, pullout behind local front |
| `bedside-storage-fixed` | 540 × 440 × 470 | Exact size only; prepared Kenney bedside cabinet, oak/charcoal materials | 450, hinged |

All catalogue records support oak/ivory/clay/sage/walnut/charcoal references, including prepared chair/cabinet and TV cases. Defaults remain clay for the prepared chair, oak for the cabinet and charcoal for TVs. Instance-owned prepared materials apply the selected palette and wood/painted/fabric texture targets; metal parts remain distinct. Lamp shades follow their selected finish, TV screens stay dark, and exports use the same appearance targets. For proposed catalogue pieces, a different fixed size is **unavailable**, with an explicit adjustable-representation choice; never stretch a fixed model or silently replace its dimensions. Unknown versions stay unavailable and preserve semantic room data. Missing eligible meshes use a labelled procedural representation at the **same** dimensions and ID, without changing fit. The same API can choose this fallback explicitly when an asset fails; actual renderer loading/error integration is RM-006.

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

## RM-015D renderer detail (19 October2026)

Original GLB bytes, exact manifests/licences/thumbnails and catalogue/physical definitions remain unchanged. Renderer-only bevels, two pillows within the existing pillow envelope, recessed wardrobe fronts/handles and owned material maps improve close-up interiors. Shared physical bounds, scale1 fixed assets, odd/half-mm geometry, strict proposed variants and same-size fallback retain their original authority. Fixed models have reviewed UVs and named wood/carpet/metal materials; renderer instances copy those materials, retain cache-owned geometry and borrow bounded canvas-owned maps. Unsupported measured owned-size bounds remain simple geometry and keep their existing contextual notice. See [the room renderer policy](room-view.md) and [actual receipt](../validation/RM-015D.md). No new asset preparation/source/licence or purchased download was needed.

## AA useful sizing shortcuts

One shared source-backed registry provides14regional mattress choices: metric Single/Double/Queen/King, UK Single/Double/King/Super king, US Twin/TwinXL/Full/Queen/King/CaliforniaKing. Labels include exact cm/in dimensions and sizing system.25.4mm/in rounds to nearest integer mm. A chosen bed starts with an **estimated100mm total width and depth frame allowance**, explicitly shown, with editable overall dimensions; it is not a measured universal allowance or a mattress-only footprint. Bed height stays unchanged. Offered procedural maximum2200×2400mm supports large frames; default1600×2100×850 and geometry/assets stay unchanged.

Common planning presets cover adjustable desk120×60/140×60/160×80cm, wardrobe100×60×201/150×60×201/200×60×236cm, and shelf40×28×202/80×28×106/80×28×202cm; filter actual catalogue support, so sliding wardrobe omits unsupported100cm width. These are dimensional conveniences, not exact brand assets or universal furniture standards. Fixed prepared variants and chairs receive no invented size presets. Current/custom values and Advanced measured fields remain available. [Primary evidence/dispositions](../references/furniture-sizes-2026-10-19.md).

The shared basic form appears high in inspector/photo review and before Add/Replace placement. Choosing a preset only edits its local fields. Explicit Unlock size is separate from Use size; defaults and starting-state locks remain. One visitor-only set-size-estimate updates changed axes to estimated/visitor-estimate and preserves omitted/unchanged evidence, ownership, pose, other locks and baseline. Final spatial/variant policy and whole-change Undo remain. Preset selection is transient, retained after its successful apply, cleared on differing Undo/current size or new item/workspace identity; no project schema or persisted mattress-brand fact is added. Actual checks/limits are in [AA](../validation/RM-015AA.md).

## Editable photo settings — RM-015BK,21 October2026

Photo inference supplies initial size/finish/pose, never property locks. Fresh photo draft furniture is fully unlocked; deliberate visitor locks, corrections, linked identity and recovered documents stay authoritative. Manual catalogue defaults remain independent. All six finishes are available regardless of entry route or ownership. Fixed owned pieces also expose the shared custom size estimate form in Advanced, with per-axis approximate evidence and Undo. Changes outside an asset’s representable dimensions retain the existing truthful physical-bounds representation; no fixed mesh stretching or inferred measurement confirmation. Proposed catalogue size ranges and final spatial checks remain. The disabled single-option Standard selector is removed.
