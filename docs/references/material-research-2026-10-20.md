# Material research —20 October2026

Owner requests more convincing free furniture/floor/wall textures, citing the liked glass. [AS scope](../tickets/RM-015AS-add-free-photographic-material-detail.md) and [allocation](../commit-plans/RM-015AS.md) retain the stylized demo, finish colours, measured bounds and current lighting.

## Existing source audit

Before AS, `room-view/surfaces.ts` authored tiny deterministic stripe/noise DataTextures:512px floor,256px wood/tile and128px fabric/plaster/smooth/concrete. One colour texture also feeds bump. Beds/desks/wardrobes/shelves are repo-authored procedural parts and finite rounded box geometry. Existing imported cushioned chair/bedside cabinet come from [Kenney Furniture Kit](https://kenney.nl/assets/furniture-kit), version2.0, CC0. The checked catalogue manifest/licence owns exact archive/model hashes; both local GLBs have UVs and no embedded texture images. No asset replacement, dimension change or expanded catalogue is needed.

## Primary sources and selection

- [Poly Haven licence](https://polyhaven.com/license): CC0 assets may be used, modified and redistributed commercially; credit is appreciated, not required. Preserve credit and source links locally. The website's preview/example renders are separate site content: only downloadable material maps are selected.
- [Oak Wood Planks](https://polyhaven.com/a/oak_wood_planks), Dimitrios Savva: clean varnished floor, photographed grain/joins, source tile1.2m wide. Selected floor set.
- [Oak Veneer01](https://polyhaven.com/a/oak_veneer_01), Jenelle van Heerden: fine vertical grain for furniture, source tile1.8m wide. Selected wood set.
- [Rough Linen](https://polyhaven.com/a/rough_linen), colormass photography/Rico Cilliers processing: fine woven matte cloth, source0.3m tile. Selected as neutral detail; source blue tint is not copied into visitor finishes.
- [White Plaster02](https://polyhaven.com/a/white_plaster_02), Rob Tuytel: fine matte plaster. Selected with restrained neutral contrast rather than weathered colour stains.
- [ambientCG licence](https://docs.ambientcg.com/license/) and [Wood Floor051](https://ambientcg.com/view?id=WoodFloor051): credible CC0 alternative. Not selected because the four coherent Poly Haven maps already cover the requested surfaces; no benefit from a second material set/library.
- [Poly Haven API terms](https://github.com/Poly-Haven/Public-API/blob/master/ToS.md): metadata/asset access is free; use an identifying user agent for preparation. This task uses a small one-off `Roomedy-local-material-preparation/1.0` metadata/download job, not a live API integration. Product runtime stays local. No key/account/payment or bulk dataset collection.
- [Three MeshStandardMaterial](https://threejs.org/docs/pages/MeshStandardMaterial.html) and installed source: albedo is sRGB; normal/roughness are non-colour data. Normal/roughness change light response without changing geometry; metalness stays0 for wood/fabric/plaster. A GL normal map is appropriate for glTF export; bump-only detail is less portable. Match sampler transforms and mipmap/anisotropy ownership.

## Selected packaging and implementation

Download only1K diffuse/roughness/GL-normal maps from official per-asset metadata; verify advertised size/MD5 and retain SHA256. Earlier displacement downloads are research inputs only, not selected product maps. The ignored original source files are separate from compact product derivatives. Prepare two opaque PNGs per material: neutral luminance albedo in R/roughness in G, and normalized GL normal data. Deterministic low-resolution derivatives retain source licensing; all are bounded local assets. Source detail is illustrative material appearance, not observed/confirmed visitor-room evidence.

Keep the existing geometry, material/texture retirement, demand rendering, glass and lighting. Separate normal/roughness from colour, share stable canvas-owned texture references, and wait for actual local preparation before readiness/export capture. Serial bounded decoding avoids concurrent bitmap spikes; original patterns remain the failure fallback. No8K runtime bundles, displacement, ray tracing, new HDR/environment download, postprocessing, extra light/shadow pass, merchant asset or paid texture. Record exact derivative/source hashes and measured budget/results in the product manifest and AS validation receipt; actual owner acceptance is separate.

Installed Three r186 exporter inspection found its roughness merge and no-tangent normal adaptation call canvas drawImage, which cannot consume raw DataTexture image objects. Selected GLB-only bounded canvas copies retain the native convention handling; merely adding a metalness sampler does not solve normal conversion. The receipt records actual corrected native downloads.
