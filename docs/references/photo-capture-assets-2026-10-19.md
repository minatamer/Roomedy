# Photo-capture example assets —19 October2026

Selected after owner rejected close-ups and requested opposite-corner whole-room examples. Two local wide photographic views of one simple bed/bedside-storage bedroom; built-in image generation only, no app-provider/API/CLI calls. Generation outputs/prompts/coherence/size/SHA256 are recorded after inspection. Existing landing source images remain unchanged. The animated guide is authored SVG/CSS, not a raster video or editable room preview.

## Selected assets and method

Built-in `image_gen.imagegen`, opaque photographic output; no API key/CLI/app-provider request. Selected original PNGs remain in the Codex generated-images folder. Ordinary deterministic asset packaging resizes/encodes those pixels to1280×960WebP quality82; no creative edits in Python. Landing assets are untouched. Both final views were visually inspected: same ivory upholstered bed, cream duvet/sand throw, ivory cabinet, oak floor/plaster; first looks toward the headboard/window, reverse looks from pillows toward the foot/door. The second has overlapping bed/floor context and does not repeat the front view. These are authored examples, not measured real-room evidence; the existing fake adapter supplies reviewable estimates and bed/cabinet vocabulary.

| Final repository asset | Bytes | SHA256 |
| --- | ---: | --- |
| `apps/frontend/public/examples/bedroom-corner-one.webp` | 79378 | `06b799e6d574185b4ed12082d3bdc3e3f04c5f5cc260ab2092e054e7e134c917` |
| `apps/frontend/public/examples/bedroom-corner-two.webp` | 79582 | `3c9adcf436751d5ef778c7891128e1ff9ff7c1dbb3e97342c82572aa1da2976a` |

## Final prompt set

First view (new generation, photorealistic-natural):

> Create ONE landscape wide-angle photograph for a room-planning app's example room-photo upload. A modest rectangular bedroom, warm ivory plaster walls, natural light oak plank floor. Exactly one double bed with a simple ivory upholstered headboard and cream duvet, a muted sand throw, against the north wall toward the left side. Exactly one small ivory bedside cabinet with two drawers directly to the bed's right, no other furniture. A simple rectangular window on the east wall with beige curtain, soft daylight. A walnut door on the south wall behind this camera. No shelves, desk, chair, plants, decor, people, text, numbers, logos, or watermarks. CAMERA: handheld phone-like photograph from the SOUTHWEST corner at standing eye height, looking diagonally NORTHEAST, wide24mm equivalent, level verticals, clearly show bed, cabinet, north/east walls and generous continuous visible floor and ceiling context. Real home photograph, detailed but restrained fabric/wood/glass textures, warm natural lighting, believable proportions. This image will have a companion from the opposite NORTHEAST corner: establish a simple consistent room that can be photographed from both corners. Opaque background.

Reverse view (reference-image edit, same selected first image):

> Create a camera-reversed photograph of this exact same bedroom,180degrees opposite to the reference. Important: the camera is now standing NEXT TO THE PILLOWS in the far right corner of the reference, looking back across the bed TOWARD ITS FOOT and the room entrance. The ivory HEADBOARD is now BEHIND the camera and must NOT appear facing the viewer. The north wall and east window are behind camera or at the near edge, not in the background. Show the bed receding AWAY from the viewer: pillow edges/cream duvet closest at lower right foreground, the same sand knit throw across the far foot of the mattress toward the centre, open oak floor beyond the foot, blank ivory SOUTH wall across the room, with one plain walnut entrance door near its right end. A glimpse of the small ivory bedside cabinet can be at the near right edge, no new furniture. Wide phone photograph, standing height, natural daylight, same real fabric/plaster/wood details and colour. This is a reverse-angle room documentation photo, not a catalog front view of a headboard. No person, text, logos, watermarks. Preserve the bed/cabinet physical arrangement and room identity. Landscape opaque.

The guide is code-native SVG/CSS and reuses the site palette; it does not use a generated video, new3D renderer, third-party person's likeness or outside font/asset dependency.

## Furniture-detail additions — 20 October 2026

Latest owner request adds two close photographs of the furniture already visible in the sample bedroom. The two original wide room views remain. Built-in imagegen produced each new landscape photo using `bedroom-corner-one.webp` as the inspected identity reference; no CLI/API key/app-provider request was used. Outputs were visually inspected, then deterministically resized/encoded with existing Sharp to 1280×960 WebP quality82, without creative pixel changes. The same ivory upholstered bed, cream bedding/sand throw, ivory two-drawer cabinet with brass knobs, oak floor and beige curtain remain. These are authored example images; fake mode is not pixel recognition or confirmed measurement evidence.

| Final repository asset | Bytes | SHA256 |
| --- | ---: | --- |
| `apps/frontend/public/examples/bedroom-bed-detail.webp` | 169494 | `67bc1f727a5d31608acde2e66fd0d0df27f910a98760abcb5ba001a22635e858` |
| `apps/frontend/public/examples/bedroom-cabinet-detail.webp` | 101346 | `603044735e05dc9c0f2b82ba808ad6b4fb13cb58c41dd70b02d3898f743584dc` |

All four examples total 429800 bytes. Each stays below the existing 256KiB asset ceiling and joins ordinary decoder/admission/auto-purpose selection. Originals remain at `C:/Users/minat/.codex/generated_images/01a15835-0bd9-7d20-9601-faf2b8383623/exec-c6dfd5ef-0ce0-4d95-b44c-eedc4b1db35c.png` (bed) and `exec-8eecb379-5c70-482f-87f3-aebe9ff1b136.png` (cabinet).

Exact bed prompt:

> Use case: photorealistic-natural. Asset type: an additional furniture-detail sample photo for the Roomedy photo-intake gallery. Input image is an identity reference for the exact room and furniture. Create ONE new landscape phone photograph taken closer to the same bed, from near its foot toward the headboard at a slight three-quarter angle. The ivory upholstered rectangular headboard and matching upholstered base, cream duvet, two large cream pillows, small sand lumbar cushion and taupe/sand knitted throw across the foot must match the reference. Show the whole bed prominently with believable proportions and useful floor contact, with the SAME small ivory two-drawer bedside cabinet at the bed's right visible at the edge. Retain warm ivory plaster wall, natural light oak plank floor, window daylight and beige curtain. This is a furniture documentation detail photo, closer than the wide room image, not a second room-wide view. Natural handheld home photograph, realistic linen/upholstery/wood texture, no people, new furniture, decorations, text, labels, logos, or watermarks. Opaque landscape image.

Exact cabinet prompt:

> Use case: photorealistic-natural. Asset type: an additional furniture-detail sample photo for the Roomedy photo-intake gallery. Input image is an identity reference for the exact room and furniture. Create ONE new landscape phone photograph taken close to the SAME small ivory bedside cabinet on the right side of the bed in the reference. Cabinet is a simple painted off-white rectangular chest with EXACTLY TWO drawers, each with one small round warm brass knob centered; subtly framed drawer fronts, plain empty top and short base/feet. Show entire cabinet large and clear from a slight standing-height three-quarter angle. At the left edge keep a recognizable sliver of the same ivory upholstered bed, cream bedding and sand cushion; at right show some existing beige curtain/window-side oak floor context. Maintain warm ivory plaster wall and natural light oak plank floor, soft daylight from the right, exact quiet room identity. Cabinet stays at the bed's right against the headboard wall. Realistic home documentation photograph, useful furniture silhouette and floor contact. No new furniture, lamps, plants, books, decorations, people, text, labels, logos, or watermark. Opaque landscape image.

The paired guide shares one SVG scene/character implementation with two camera paths: opposite room corners and close bed/cabinet photographs. Both use the existing palette and finite 4.6s CSS timing, with one shared icon-only Replay action. No visible explanatory caption or new raster animation is used. See [Y follow-up evidence](../validation/RM-015Y.md).
