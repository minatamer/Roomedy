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
