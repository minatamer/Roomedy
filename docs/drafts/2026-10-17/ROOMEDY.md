# Roomedy — detailed product blueprint

**Brand:** Roomedy.  
**Selected domain:** tryroomedy.com. Naming and domain selection confirmed on 17 October 2026; registration and deployment are separate steps.  
**Prepared:** 17 October 2026, Africa/Cairo.  
**Status:** pre-build product documentation. The application, AI integration, model collection and layout engine have not been implemented or validated.  
**Companion:** [Visual product overview and interactive concept](ROOMEDY_OVERVIEW.html).

The companion HTML is an offline, scripted product illustration. Its projected SVG room is not a React Three Fiber implementation, its examples do not call AI, and its checks demonstrate only a small subset of the planned placement rules. It exists to make the intended product understandable before a repository build.

## 1. The product in plain language

Roomedy helps someone turn a small room into a comfortable place to live, sleep and work. They can begin with an empty room, a partially furnished room or furniture they already own. They see the room in a precise top-down plan and an approachable 3D cutaway, change it themselves, or ask an AI assistant to make supported changes.

The signature interaction is a request such as:

> Keep my bed and wardrobe. Put the desk near the window and give me more room to pull out the chair.

The visitor sees an editable proposal, understands the compromises, applies it and can undo it. The assistant operates the room editor through validated tools. Room dimensions, supported objects and placement checks determine what can actually be proposed.

An empty room is an equally important starting point:

> This is an empty bedroom. I need a bed, a desk, a chair and storage. Help me furnish it in a warm, simple style.

The result should be a coherent room the visitor can explore and adjust. A pretty generated image alone would not demonstrate this product's central promise.

### Who it serves

- Someone with a small bedroom who needs a sleeping area, work area and storage.
- A renter furnishing an empty room.
- Someone reorganising existing furniture without buying replacements.
- Someone keeping a few pieces and exploring what else could fit.
- Potential clients assessing the developer's ability to build interactive 3D products, visual editors and useful AI integrations.

This is a portfolio demo with a complete, bounded workflow. It is not yet a production interior-design service, construction tool, furniture marketplace or professional CAD system.

### What it adds to the portfolio

ClipBuilder already demonstrates media processing; ScreenPilot demonstrates a live voice workflow; Retrosum demonstrates evidence-backed document analysis; Retailor demonstrates AI-assisted commerce and connected views.

This project adds spatial interaction, synchronised 2D/3D state, geometry-based constraints, visual editing, reversible multi-object operations and an assistant that works on the same scene as the user. Related technology is welcome; the central user story must remain distinct.

## 2. Decisions, recommendations and unresolved choices

### Brand and domain — decided

- **Name:** Roomedy, combining *room* and *remedy*. It expresses the product's purpose: practical help with awkward layouts, small spaces and furnishing decisions.
- **Selected domain:** **tryroomedy.com**. Use this spelling consistently in project copy and future deployment configuration.
- **Positioning:** an approachable AI-assisted room planner for furnishing an empty room or making an existing room work better.
- The name and domain are decided. The final visual identity and assistant name remain open; the current companion HTML is a concept direction.
- This records a domain choice, not a completed registration or a live website. [Cloudflare registrar lookup](https://www.cloudflare.com/domains/search?q=tryroomedy.com).

### Discussed product direction

- The user is particularly interested in small rooms containing a bed, desk, chair and wardrobe.
- Empty-room photos must be supported as a normal use case.
- Partly furnished and fully furnished rooms should also have meaningful journeys.
- The assistant should be able to perform the supported editor operations for the visitor.
- The interface should be visually appealing, smooth and useful.
- The demo should follow the portfolio pattern of a landing page and a guest try-demo experience.
- Documentation should consist of one detailed Markdown blueprint and a readable companion HTML.

### Recommended technical and UX baseline

These recommendations are documented for the build agent to evaluate; they are not evidence of implemented functionality.

- Next.js, React and TypeScript.
- Three.js through React Three Fiber, with Drei helpers.
- A top-down SVG plan and a 3D cutaway driven by one room document.
- A server-side GPT integration using function calling and strict action schemas.
- A local geometry and layout engine for feasibility checks.
- A small curated furniture library combining free assets with adjustable procedural furniture.
- Browser-based guest state, project export/import, clear/reset and no required user account or server database.
- Photo-assisted drafting followed by targeted dimension confirmation.
- Preview, Apply, Cancel and whole-instruction Undo for AI scene changes.
- A rectangular single-room first release, with later room-shape expansion kept separate.

### Still to decide

- Final visual identity and assistant name. Roomedy and tryroomedy.com are already selected.
- Exact furniture catalogue, quality level and licensed asset files.
- Whether the first release accepts dimensioned floor-plan images alongside room photos.
- Maximum photos, upload size, object count and project size after measurement.
- Session expiry and whether room photos should survive refresh with explicit user consent.
- Exact supported room shapes, rotations, furniture mechanisms and clearance presets.
- GPT model, evaluation corpus, funded usage budget and hosting configuration.
- Whether comparison means two candidate arrangements in the first release or a later enhancement.
- Whether a priced catalogue and budget constraint belong in the first release.

Writing these documents authorizes documentation work. It does not authorize paid model calls, asset purchases, domain registration, cloud deployment or development of the whole application.

## 3. Product principles

1. **A complete guest story.** Someone should be able to try a supplied room, make one meaningful change, check the result and undo it in a short visit.
2. **Support the room they have.** Empty, partly furnished and existing rooms are explicit starting conditions.
3. **Photos reduce setup.** AI proposes visible objects and appearance; the visitor corrects its draft.
4. **Dimensions have provenance.** Estimated, extracted, scanned and user-confirmed values stay distinguishable.
5. **The scene remains editable.** AI and manual controls use the same canonical room state.
6. **Useful geometry before decoration.** Fit, access and room purpose guide the experience; style adds expression.
7. **Respect things the visitor owns.** Confirmed furniture sizes and locked pieces are not silently changed to make a layout look feasible.
8. **Make compromises visible.** An impossible combination produces an explanation and alternatives.
9. **A bounded demonstration.** A small, polished furniture collection and one-room workflow are sufficient.
10. **Honest status.** Scripted illustrations, fake development providers, live AI outputs and actual measured results must be labelled accurately.

## 4. Landing page and entry

The landing page explains the outcome quickly: bring a room, decide what it needs to do, and explore an arrangement with an assistant beside you.

Suggested copy:

> Make room for the way you live.  
> Explore your room in 2D and 3D. Arrange it yourself or ask your assistant to help.

The primary CTA is **Try the demo**. Inside the demo, offer **Use a sample room** and **Add my room**. Then establish the starting condition: empty, partly furnished or already furnished.

Avoid six competing primary CTAs. The source choice and room condition are separate questions presented at appropriate moments.

Show a brief visual transformation on the landing page, three plain-language capabilities and a concise explanation of photos versus confirmed measurements. Technical framework names belong in project information, not the visitor's setup flow.

## 5. Canonical journey — sample room

This is the shortest portfolio path and should receive the most polish.

1. Open the landing page and choose **Try the demo**.
2. Choose a supplied room and its starting condition.
3. Inspect an immediately available room in 2D or 3D.
4. See its supplied dimensions and which furniture is owned, proposed or locked.
5. Set a goal or select an example request.
6. Ask the assistant to prepare an arrangement.
7. Inspect the preview, affected items and relevant fit checks.
8. Apply the whole change or cancel it.
9. Make a manual adjustment; verify the assistant understands the updated scene.
10. Undo the AI instruction or export the project.

Samples should use authored, fictional room measurements and furniture records. Before any AI call, the visitor can inspect and manually edit them. In the eventual live demonstration, deliberate assistant requests should use the real configured provider, with failures shown explicitly. Development simulations remain clearly labelled.

A sample should include an obvious problem to improve, such as a desk placed away from the window or a chair compromising access to storage. Sample geometry must be independently checked during implementation.

## 6. Canonical journey — photos of an empty room

1. **Add photos.** Guide the visitor to capture several corners, including doors, windows and fixed features.
2. **Review the proposed room.** AI drafts visible walls/features and approximate placement. Missed or uncertain features are easy to add or correct.
3. **Confirm fit-critical dimensions.** Establish room length/width and the positions and sizes of relevant openings. A photograph is not a measurement certificate.
4. **Describe the purpose.** Ask what the room needs to support: sleeping, working, studying, relaxing, guests or a combination.
5. **Choose essentials and preferences.** For example, a double bed, one desk, a chair, wardrobe storage and warm colours.
6. **Prepare candidate layouts.** Use supported furniture variants and feasibility checks. If comparison is included, make the differences easy to inspect.
7. **Explore and refine.** Switch between plan and 3D, drag furniture or ask for a smaller desk, clearer doorway or different palette.
8. **Apply and keep the result.** Apply a preview, undo if needed, and export the temporary project.

The app must not assume an empty photographed room is a bedroom. Its purpose comes from the visitor. Budget is optional and only meaningful if the chosen catalogue has explicit, sourced or clearly fictional prices.

## 7. Canonical journey — existing or partly furnished room

1. Upload room photos, individual furniture photos or a supplied example.
2. Review the suggested furniture inventory and room features.
3. Mark each piece **Keep**, **May replace** or **Remove from this plan**.
4. Confirm relevant furniture dimensions and the room measurements.
5. Lock pieces whose positions must remain fixed; lock confirmed physical dimensions independently.
6. Describe the desired improvement.
7. Inspect the assistant's proposed changes and any unresolved constraints.
8. Apply, adjust manually, compare if supported and undo as needed.

For a partly furnished room, identify the pieces to retain before suggesting additions. For a fully furnished room, **rearrange what I own** should be a clear option that proposes no purchases.

Removing an item from the scene is not an instruction to dispose of it. The product records a planning choice.

### Example visitor requests

- Keep my bed and wardrobe, but move the desk closer to the window.
- Find an arrangement where the wardrobe doors can open.
- I need more space behind the desk chair.
- Keep everything I own and suggest a better arrangement.
- Add storage without replacing the bed.
- Compare a larger desk with a narrower one.
- Keep the layout and try a warmer wall colour.
- Explain why this furniture combination does not fit.
- Undo your last arrangement.

## 8. Input methods and measurement confidence

### Photos

Room photos can help identify visible object categories, appearance, room features and approximate relationships. Their interpretation remains a reviewable draft. Occlusion, perspective, mirrors, clutter and wide-angle distortion can confuse it.

A single ordinary image does not establish reliable metric measurements for every object. More viewpoints help with coverage but do not automatically turn GPT vision into a calibrated survey. One reference measurement is useful context, not proof of all hidden geometry.

### Dimensioned floor plans

A floor-plan image or PDF may supply the room outline, dimensions and opening locations. Treat AI-read labels as extracted values requiring review. Conflicting annotations, missing scale and unreadable text must remain unresolved rather than guessed as confirmed.

Support for PDF intake is a separate implementation choice; the first release can start with photos and explicit dimensions.

### Furniture product information

A product specification screenshot, a known model with documented dimensions or a supported product source can reduce typing. Match the exact variant. Bed mattress size is not necessarily the bed-frame footprint.

Live arbitrary URL extraction is not required for the first release. The build may initially accept specification images or pasted dimensions.

### Direct entry

Use short, contextual prompts on the object or wall being measured:

- How long is this wall?
- How wide and deep is this desk?
- Which side is the door hinge on?
- How high is the window sill?

Do not begin with a large technical form. Width and depth matter for footprint placement; height matters for vertical obstructions, shelves and furniture beneath windows.

### Phone scans — future path

Apple RoomPlan can derive parametric room information from supported LiDAR-enabled iPhone/iPad capture. It uses native Apple APIs. Importing compatible scan results could be evaluated later; native capture is not part of the baseline browser demo.

Android depth functionality is not an automatic cross-platform substitute for a complete room-reconstruction pipeline. Device support, capture UX and format conversion require separate design and testing.

### Data provenance

Each fit-relevant dimension or feature should retain a status:

| Status | Meaning | Product treatment |
|---|---|---|
| Unknown | No usable value | Ask, omit the check or explain what remains unknown |
| Estimated | Suggested from appearance, defaults or approximate reconstruction | Show an approximation indicator |
| Extracted | Read from a labelled source | Show source and request review |
| Scan-derived | Supplied by a supported scan | Preserve source and uncertainty; permit corrections |
| Confirmed | Explicitly checked by the visitor or supplied in an authored sample | Eligible for the relevant dimension-based checks |

A layout can be explored with estimates. The app must not label all of it “verified” while important dimensions, opening locations or clearances remain unknown. Report which checks were performed and which inputs they depend on.

## 9. Editor, room views and manual controls

### One room, two representations

The 2D plan and 3D cutaway are views of one document. Neither stores an independent arrangement.

**2D plan**

- Drag and rotate furniture with visible dimensions.
- Snap to supported grid/wall alignments.
- Show doors, door swings, windows and fixed obstacles.
- Highlight selection, locks, object footprints and clearance areas.
- Offer numeric inputs and keyboard-accessible controls.

**3D cutaway**

- Orbit, zoom and reset the camera.
- Hide selected walls or automatically avoid camera obstruction.
- Select furniture and inspect its properties.
- Show consistent materials, soft lighting and restrained motion.
- Preserve scene understanding during edits with clear previews.

Camera movement changes the view, not the room geometry. A selected object's identity remains consistent between views.

### Furniture properties

Category, catalogue variant, dimensions, position, rotation, appearance, ownership status, replacement preference, locks and relevant opening/clearance characteristics.

Owned furniture has independently locked dimensions. Choosing a smaller proposed desk is a replacement, not silent resizing of the actual desk.

### Room properties

Outline, wall height, wall and floor finishes, openings, opening dimensions/positions, fixed obstacles and measurement provenance.

Changing a measured wall length must be an explicit data correction or deliberate planning edit. The assistant must not enlarge the room to solve a furniture-fit problem.

### Room usefulness

Useful feedback includes available clear space, a blocked door, overlapping furniture, chair pull-out space, access to storage and the trade-offs between alternative arrangements.

Avoid an unexplained “room score” presented as objective truth. Prefer specific, inspectable facts and user preferences. Layout rules do not establish building-code, accessibility or construction compliance.

## 10. Furniture library and asset strategy

Use a small curated library rather than arbitrary runtime model downloads.

### Free asset sources researched

| Source | Verified information | Expected role |
|---|---|---|
| Kenney Furniture Kit | 140 assets; CC0; free download | Consistent lightweight starting furniture |
| Quaternius Furniture Pack | 23 models; CC0; personal/commercial use | Essential furniture and simplified objects |
| Poly Haven | Asset library distributed under CC0 | Selected detailed pieces, materials and lighting references |

The exact asset files have not been selected, downloaded or assessed for this project. Free access to these libraries does not mean every desired furniture shape exists in a suitable format or visual style.

### Procedural furniture

Generate supported beds, desks, wardrobes and shelving from adjustable parts. Changing dimensions should rebuild parts logically instead of distorting a detailed mesh. For example, keep desk-leg thickness plausible while changing tabletop width.

Curated chair and decorative models can add detail. Use one coherent material/lighting language. A clean miniature cutaway or dollhouse presentation is a promising visual direction, not an approved brand identity.

### Asset preparation

- Prefer GLB/glTF for runtime delivery.
- Establish units, orientation, origin, floor contact and material conventions.
- Store an explicit planning footprint and dimensions separately from decorative mesh bounds.
- Record clearance volumes and opening mechanisms where supported.
- Optimise textures and geometry; load detail as needed.
- Retain source URL, creator, licence and asset-version records.
- Credit creators even where optional if practical.

A furniture photo can map to a similar supported model. Exact reconstruction of arbitrary furniture, including hidden surfaces and mechanisms, is a separate pipeline and is not promised.

## 11. Assistant behaviour and editing contract

The assistant is part of the editor. It should understand the current room, help the visitor set a goal, carry out supported edits, explain results and guide corrections.

### Available context

Send bounded semantic room data: dimensions with provenance, object IDs and categories, positions, rotations, catalogue variants, ownership, locks, openings, requested clearances, selected objects, current revision and the visitor's request.

The scene's semantic data is more useful for placement than repeatedly sending a screenshot. A screenshot can supplement appearance questions. Photos are sent only when needed for the disclosed task.

### Example tool capabilities

These are proposed application tools, not a claim that a provider supplies a room editor.

| Tool | Responsibility |
|---|---|
| Read room | Return current semantic geometry, measurements and revision |
| Find furniture | Search supported catalogue variants by type and known dimensions |
| Prepare edit batch | Propose supported additions, removals, moves, rotations and appearance changes |
| Find arrangements | Ask the layout engine for feasible candidates around stated goals |
| Validate proposal | Check constraints and return machine-readable issues |
| Explain checks | Describe computed facts, unknowns and affected objects |
| Focus object | Select or highlight a referenced furniture item or feature |
| Undo last change | Request the application's normal reversible history operation |

A practical API can combine several of these into a smaller set. Tool count and schema design should be settled during implementation.

### Supported edit operations

- Add a supported furniture variant.
- Move, rotate or remove a permitted object.
- Resize supported adjustable/planned furniture when allowed.
- Replace a replaceable object with a supported alternative.
- Change supported finishes, materials, colours and lighting presets.
- Change locks or preferences with explicit user intent.
- Prepare a coordinated multi-object arrangement.
- Correct a measurement after an explicit confirmation.
- Highlight an issue, focus an object or restore a camera view.
- Undo a committed batch.

An assistant can access essentially every implemented editor action. That does not imply arbitrary modelling, invented catalogue objects, structural renovation or perfect interpretation of every request.

### End-to-end editing sequence

1. Capture the visitor's request against a specific room revision.
2. Read current data, selected objects and lock/measurement rules.
3. Resolve ambiguous references. Ask one targeted question when several desks or windows could match.
4. Use supported tools to produce a proposed batch. Complex arrangements can come from a solver/search routine.
5. Validate schema, IDs, permissions, numeric bounds and domain rules.
6. Validate the whole resulting room, not each move independently in an order that creates transient false collisions.
7. Return a bounded preview and computed reasons, or return issues for correction.
8. Display ghost/outlined positions, changed objects and an understandable summary.
9. On Apply, confirm the room revision still matches, then commit the entire batch atomically.
10. Update both room views and the inventory from the committed document.
11. Report only changes that actually committed.
12. Record the prior snapshot so one Undo reverses the whole instruction.

Strict tool schemas establish shape, not geometric correctness. Application code must validate the result.

### Revision and stale-result rules

If the visitor edits the scene while AI is working, an old proposal must not overwrite the new room. Reject or recompute it against the updated revision. The same applies if another request supersedes it, the room resets or a project is imported.

Apply is idempotent: a double-click cannot add the same furniture twice. Failed or cancelled proposals leave the committed room unchanged.

### Preview and Undo

- Clearly distinguish proposed and committed scenes.
- Apply commits one coherent batch.
- Cancel removes only the preview.
- Undo restores the previous committed arrangement as a new revision.
- Manual and assistant edits use the same history and validation path.
- Undoing a scene edit does not rewind unrelated chat or silently restore a cleared private upload.
- While a proposal is visible, a manual edit either cancels it or makes its staleness explicit.

### Impossible and ambiguous requests

If the furniture combination is infeasible, identify the conflicting constraints and offer specific alternatives. Preserve locks and confirmed dimensions. Never invent extra floor area or shrink an owned bed.

If a layout engine cannot find a candidate within its search budget, distinguish **no candidate found** from a mathematically proven impossibility.

If a visual request is subjective, explain the proposed design direction and keep it editable. If an object or finish is unsupported, offer the nearest supported choices.

## 12. Worked assistant scenarios

### A. Move the work area near the window

**Request:** “Move my desk by the window, keep my bed and wardrobe, and make sure I can pull my chair out.”

**Expected process:** read room; preserve retained dimensions and relevant pose locks; find candidate desk/chair positions; test window/desk height when known, collisions, doorway access and configured chair area; preview a coordinated desk/chair move.

**Visitor sees:** highlighted desk and chair, proposed positions, relevant distances, unchanged retained pieces and any unassessed checks.

**Apply/Undo:** one application operation commits both positions; one Undo restores both.

### B. Furnish an empty bedroom

**Request:** “I need a double bed, a work desk, chair and wardrobe. Keep the entrance clear.”

**Expected process:** confirm room purpose and unknown dimensions; select supported variants; generate bounded candidate arrangements; preview additions and identify supplied/sample dimensions.

**Visitor sees:** a furnished room, a list of proposed pieces and the reasoning behind the arrangement.

### C. Improve a partly furnished room

**Request:** “Keep this bed. Add a desk and some storage in a warm style.”

**Expected process:** retain the bed; identify dimensions and available space; propose new catalogue objects and supported wall/material settings; validate the final scene.

### D. Keep furniture and change appearance

**Request:** “Keep the layout, but make it feel warmer.”

**Expected process:** change supported wall/floor/light presets while preserving all positions and owned furniture finishes unless explicitly editable.

### E. A request conflicts with a lock

**Request:** “Put the wardrobe on the left.” The wardrobe's position is locked.

**Expected process:** explain the lock and ask whether the visitor wants to unlock that piece. Do not quietly move it.

### F. A proposed object blocks the door

**Expected process:** reject the conflicting proposal before Apply, highlight the door swing, and offer a valid alternative. The committed scene stays intact.

## 13. Geometry and layout engine

Use a simple, explicit room coordinate system. A recommended baseline uses integer millimetres, the floor plane as X/Z and height as Y. Convert to Three.js scene units at the rendering boundary.

Each furniture instance has an ID, catalogue reference, real dimensions, pose, footprint, ownership, locks and clearance configuration. A decorative mesh does not override its planning dimensions.

Initial geometry can prioritise rectangular rooms, axis-aligned footprints and quarter-turn rotations. Arbitrary rotations, complex outlines, sloping ceilings and detailed articulated furniture need separate scope.

### Check categories

- Room boundary containment.
- Furniture footprint collisions.
- Door swing or opening conflicts.
- Furniture access and configured clearance regions.
- Height conflicts with known windows, shelves or ceilings.
- Fixed obstacles and locked objects.
- Candidate catalogue dimensions and allowed resizing.
- Unknown dimensions or missing feature positions.

Clearance regions depend on furniture type and user-selected assumptions. A sliding wardrobe and hinged wardrobe should not share an invented door-swing model.

### Layout generation

The model expresses goals and chooses among results. Application algorithms search or score candidate positions and return computed facts. The exact solver is undecided; a deterministic bounded search may be enough for a small room.

Hard constraints include physical containment and protected locks. Soft preferences include proximity to a window, open floor area, visual balance and a preferred work zone. Explain trade-offs instead of collapsing them into a mysterious quality number.

No particular optimisation quality or speed has been demonstrated yet.

## 14. Architecture and framework

### Recommended stack

| Layer | Proposed implementation |
|---|---|
| Web application | Next.js, React, TypeScript |
| Room rendering | Three.js with React Three Fiber |
| Scene helpers | Drei |
| Plan view | SVG controlled by React |
| Shared core | Pure geometry, domain rules, commands and versioned schemas |
| AI integration | Server-side GPT requests with function calling |
| API layer | Next.js Route Handlers |
| Guest storage | Bounded browser state and versioned project export/import |
| Assets | Curated, prepared GLB/glTF and procedural supported models |
| Hosting | Evaluate Google Cloud Run consistently with the existing portfolio |

Next.js server routes provide a backend without requiring a second API service. A separate service is an implementation choice only if a concrete need appears.

As checked on 17 October 2026, React Three Fiber's GitHub releases list v9.8.2 as the latest stable release, with v10 in alpha. The recommendation is to start on compatible stable versions, then verify the package versions and peer dependencies at build time. The project uses R3F for rendering, not as a room-planning engine.

### Data flow

Browser controls and assistant proposals feed the same validated command system. The canonical room document drives the plan, 3D view, inventory and inspection panels. Backend model calls receive a bounded snapshot and return proposals linked to that revision.

The browser handles rendering, camera changes, dragging and animation locally. AI calls occur for recognition or deliberate assistant requests, not for every pointer move or render frame.

Use on-demand rendering where suitable, cached/reused resources and optimised asset loading. Actual mobile/desktop performance must be measured.

### Conceptual room document

~~~json
{
  "schemaVersion": 1,
  "roomRevision": 7,
  "unit": "mm",
  "room": {
    "shape": "rectangle",
    "width": 3600,
    "depth": 4200,
    "height": 2600,
    "dimensionStatus": "confirmed",
    "features": []
  },
  "furniture": [
    {
      "id": "desk-1",
      "catalogueId": "adjustable-desk",
      "width": 1200,
      "depth": 600,
      "height": 740,
      "position": { "x": 2300, "z": 2000 },
      "rotationDegrees": 0,
      "ownership": "owned",
      "dimensionStatus": "confirmed",
      "locks": { "dimensions": true, "position": false }
    }
  ]
}
~~~

This abbreviated example illustrates vocabulary. Production contracts must define footprint origin, required per-field provenance, feature schemas, rotations, limits and validation consistently.

## 15. Guest state, privacy and operating costs

The preferred demo experience has no mandatory sign-in or server database. Keep the editable project in bounded browser storage and offer export/import. An explicit reset clears the workspace and associated local uploads.

Choose image persistence deliberately. Browser storage of private photos is still storage; explain retention and provide removal. A useful baseline is to retain semantic room data while keeping raw photos only as long as needed, unless the user explicitly chooses otherwise.

Project exports should include versioned room data and asset references. Excluding original room photos by default is a sensible proposal; photo-inclusive export would need clear disclosure.

Keep API keys on the server. Validate file signatures, dimensions, request sizes and model outputs. Do not log raw room photos, complete room descriptions or credentials. Treat text found inside photos or imported plans as data, not instructions.

Only serve allowed catalogue assets. Validate imported project data; never execute model-returned JavaScript, arbitrary asset URLs or HTML. Arbitrary product-page fetching is not a required first-release feature.

Free assets and libraries do not make live GPT requests or hosting free. Establish usage limits, cancellation rules, request caps and provider budget controls before enabling a public live demo. No paid provider calls or purchases were made to produce these documents.

## 16. Interface and visual direction

The main workspace should feel like a calm design studio: room canvas first, compact furniture controls, clear measurements and an assistant that helps without covering the room.

A promising composition is a narrow tool rail, large canvas, optional properties panel and conversational side panel. Small screens need a focused canvas with drawers, rather than squeezing all desktop columns together.

Use warm neutrals, one clear accent colour, readable typography, soft shadows and a consistent furniture language. Final identity is undecided. Avoid inheriting Retrosum's vintage brand or Retailor's storefront identity automatically.

Motion should explain state changes: selected objects lift/highlight, proposed positions appear distinctly, Apply animates to the committed state and Undo visibly returns the scene. Respect reduced-motion preferences.

Provide keyboard-accessible furniture controls, readable focus states, text alternatives for spatial warnings and a usable 2D/numeric route for people who cannot operate the 3D view.

## 17. Scope and delivery sequence

### First coherent prototype

- One fictional measured small bedroom.
- Bed, desk, chair and wardrobe.
- Shared semantic scene data.
- 2D/3D switching.
- Selection, movement, rotation and dimension inspection.
- One meaningful assistant request represented through the real command path.
- Preview, Apply, Cancel and Undo.
- Basic boundary, collision and door checks.
- Clear demonstration of unknown/confirmed dimensions.

### Full demo direction

- Landing and guest entry.
- Empty, partly furnished and existing-room paths.
- Photo-assisted inventory/room drafting and corrections.
- Guided measurement confirmation.
- Curated furniture additions and replacements.
- Supported appearance changes.
- Assistant editing across supported operations.
- Guest recovery, reset and export/import.
- Clear failure states and evaluated live provider behaviour.

### Later possibilities

Native phone scanning, scan imports, exact furniture reconstruction, complex multi-room plans, arbitrary articulated models, AR placement, photorealistic exports, live retail sourcing and actual purchases.

These are possibilities, not commitments. A generic photorealistic “after” image must not replace the editable planning scene or pretend to validate fit.

### Suggested implementation order

1. Prove the room model, two views and manual commands.
2. Add dimensions, locks and geometry checks.
3. Connect batch previews, revision handling and Undo.
4. Connect and evaluate the assistant on the sample room.
5. Add photo-assisted intake and correction.
6. Complete guest lifecycle, visual polish and performance.
7. Validate live behaviour and deployment separately.

Do not build a ticket queue or start execution merely because this order is documented.

## 18. Acceptance and evidence

| Scenario | Evidence needed |
|---|---|
| Empty room | Visitor can add essentials and reach a furnished, editable scene |
| Partly furnished room | Retained furniture survives additions and style changes |
| Existing furniture | Rearrangement preserves owned dimensions and protected locks |
| Photo interpretation | Missed/misidentified objects can be corrected; uncertainty is visible |
| Measurements | Unknown or estimated values do not become confirmed silently |
| Shared views | Moving an item updates the plan, 3D and property values consistently |
| Assistant tools | Supported intent produces a traceable validated proposal |
| Invalid proposal | Conflicts are shown and committed state remains unchanged |
| Stale response | Newer user changes cannot be overwritten by an older proposal |
| Atomic Apply | A multi-object request commits once as a coherent operation |
| Undo | Whole-instruction reversal restores the prior room state |
| Infeasible search | No candidate found is not misrepresented as proven impossibility |
| Provider failure | No fake success or hidden replacement with scripted output |
| Guest lifecycle | Refresh, export/import, expiry and reset match documented behaviour |
| Performance | Measured device results for the selected assets and room limits |
| Accessibility | Keyboard/numeric controls and reduced motion remain usable |

Evaluate both language interpretation and geometric correctness. Use expected-action cases, ambiguous requests, contradictory constraints, locked furniture, stale revisions and difficult photo inputs. Track actual request latency, provider usage, failure rates and correction frequency when live testing is authorized.

No live capability, fit accuracy, latency, optimisation quality or deployment outcome is established by this blueprint or its HTML illustration.

## 19. Research and primary references

Checked or consulted for the discussion on 17 October 2026 unless an older publication is identified. Social sources are qualitative examples, not proof of market size or guaranteed commercial demand.

### Product-interest and portfolio context

- [Reddit: websites/apps to model a room](https://www.reddit.com/r/InteriorDesignAdvice/comments/1tvw7jf/websitesapps_to_model_room/) — a request for trying room configurations.
- [Reddit: software for interior designers](https://www.reddit.com/r/InteriorDesignHacks/comments/1hklrk0/software_for_interior_designers/) — approachable planning, measurements and visual boards.
- [Hassan El Mghari's RoomGPT Twitter thread, archived by Thread Reader](https://threadreaderapp.com/thread/1635334863518859264.html) — a historical 2023 account of a personalised visual app; creator-reported experience.
- [Reddit: what hiring managers look for in portfolios](https://www.reddit.com/r/webdev/comments/1sf7jrm/what_do_hiring_managers_look_for_in_portfolio/) — mixed opinions on demos, depth and portfolio attention.

### Frameworks and AI integration

- [React Three Fiber introduction](https://r3f.docs.pmnd.rs/getting-started/introduction).
- [React Three Fiber releases](https://github.com/pmndrs/react-three-fiber/releases).
- [R3F objects and properties](https://r3f.docs.pmnd.rs/api/objects).
- [R3F performance guidance](https://r3f.docs.pmnd.rs/advanced/scaling-performance).
- [Drei controls](https://drei.docs.pmnd.rs/controls/introduction).
- [Three.js model-loading guidance](https://threejs.org/manual/pages/loading-3d-models.html).
- [Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers).
- [Official OpenAI documentation: images and vision](https://developers.openai.com/api/docs/guides/images-vision).
- [Official OpenAI documentation: function calling](https://developers.openai.com/api/docs/guides/function-calling).
- [Official OpenAI documentation: Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs).

### Assets and scanning

- [Kenney Furniture Kit](https://kenney.nl/assets/furniture-kit).
- [Quaternius Furniture Pack](https://quaternius.com/packs/furniture.html).
- [Poly Haven furniture models](https://polyhaven.com/models/furniture).
- [Poly Haven licence](https://polyhaven.com/license).
- [Apple RoomPlan overview](https://developer.apple.com/augmented-reality/roomplan/).
- [Apple RoomPlan device support](https://developer.apple.com/documentation/RoomPlan/RoomCaptureSession/isSupported).
- [Google ARCore depth overview](https://developers.google.com/ar/develop/depth).

## 20. Handoff summary

Build around the moment a visitor gives an ordinary-language request and sees the room respond coherently. Support an empty room as deliberately as an existing one. Let photos reduce setup, keep measurements honest, preserve owned items, and make every supported assistant edit reviewable and reversible.

The next useful decision is product/visual scope and a minimal interactive prototype. Roomedy and tryroomedy.com are confirmed. Domain registration, paid access, deployment and whole-repository implementation remain separate steps.
