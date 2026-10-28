# Roomedy Extension for CPQ

**Currency follow-up —28 October2026:** Direct owner selects USD throughout the app. [RM-015BQ](tickets/RM-015BQ-use-usd-throughout-the-demo.md) supersedes the initial authored EGP default/illustrations for fresh flows with newly authored dollar amounts. Location remains a separate explicit choice. Existing saved records retain their original money/currency; no implicit FX or rewriting. Historical EGP merchant observations, worked examples and26October receipts below are dated evidence, not the current default. The landing estimate table also loses row highlighting while its3D story remains.

**Approved extension direction · 26 October 2026 · Sequential fake-mode implementation authorized**

The owner now selects this extension and authorizes all necessary tickets, sequential execute → read-only validate → independently confirm/fix → revalidate → exact-path local staging/commit. Testing remains fake/paid-off until the owner returns. Final hands-on and visual acceptance remain pending. [Extension queue](tickets/README.md#cpq-extension--26-october-2026), [planning allocation](commit-plans/RM-021.md).

Latest authority: finish and furnish an existing room, with richer customizable studio furniture/walls/floors, then a separate centered-chat Plan & cost page with connected 3D highlights, sourcing, estimates and plans. This supersedes the earlier price/budget deferral for the extension. Drawing/document intake is permanently excluded; PDF estimate output remains selected. No paid tests, unrelated services, owner-env changes, delegation, push or deployment. Preserve earlier release evidence as history.

## 1. Product direction

**Design a room, understand what it would take to make it real, and leave with a sourced, itemized plan.**

Roomedy would connect the room's actual objects and surfaces to quantities, suitable products, installation assumptions and costs. Medy would help the visitor understand options, find local suppliers and review changes within a budget. A saved estimate would preserve the design, calculations and price evidence that produced it.

The useful distinction is between **finishing and furnishing an existing room**, which fits Roomedy, and constructing a new room, which also requires structural work, services, permissions and professional specifications. Start with finishing and furnishing. Structural construction remains outside this extension.

CPQ would mean:

| Part | Roomedy behavior | Engineering demonstrated |
| --- | --- | --- |
| Configure | Choose a flooring system, paint system, furniture and included services | Product compatibility, dependencies, exclusions and reviewed choices |
| Price | Derive quantities from the room and apply explicit product, labour and logistics rules | Measurement takeoff, pack rounding, money arithmetic and traceable calculations |
| Quote | Save a reviewed version and generate a branded document | Immutable snapshots, revision comparison and consistent document generation |

This adds meaningful portfolio coverage beyond arranging furniture: estimating tools, product configurators, bills of quantities, procurement research, budget optimization and versioned business documents. Its strongest demonstration is a visible chain from **room element → quantity → selected product or service → calculation → estimate line → PDF**.

An attractive furniture-price total demonstrates only a small part of this. The convincing case is changing a floor product and seeing pack counts, accessories, labour, delivery and the final estimate update coherently, while an earlier approved version remains unchanged.

## 2. What Roomedy already supplies, and what is new

Read-only inspection covered the documentation map, current blueprint and queue, visual-feedback lessons, catalogue policy, provider-safety policy and the implementation files linked below. Historical status paragraphs in those documents are not new acceptance claims.

| Existing foundation | Useful extension | Current limitation |
| --- | --- | --- |
| [Room contract](../packages/contracts/src/room.ts): rectangular room, dimensions, openings, stable furniture IDs and per-value evidence | Calculate floor area, wall areas and furniture quantities from accepted room data | A photo estimate is not a measured survey; room height and openings can be unknown |
| [Surface contract](../packages/contracts/src/surfaces.ts): floor/walls colour and texture | Attach a chosen material or paint system to a surface | Appearance currently has no SKU, coverage, installation system or individual-wall material assignments |
| [Catalogue policy](design/catalogue.md): physical sizes, procedural/fixed models, finishes and asset ownership | Match representations to real products and improve visual detail | Similar appearance and a size preset do not identify a retail product |
| Shared spatial authority, session controller, proposal/Apply/Undo | Validate proposed product replacements and design changes | There is no pricing engine or commercial approval lifecycle |
| [Project contract](../packages/contracts/src/project.ts) and [recovery](../apps/frontend/src/features/session/persistence.ts) | Versioned estimate data alongside a room | Current project v1 contains current/baseline room semantics; recovery has a fixed two-hour lifetime |
| [PDF export](../apps/frontend/src/features/design-export/pdf.ts) and [design-export research](references/design-export-2026-10-19.md) | Add an estimate document using the same frozen design | Current PDF embeds generated JPEG pages; it has no itemized quote ledger, selectable pricing text or source-link annotations |
| Private API, fixed bridge, bounded provider operations | Add admitted, bounded sourcing and estimate assistance | The current provider transport is not an unrestricted web browser or merchant-price service |

This is a substantial extension with several reusable foundations. Accurate local sourcing, pricing rules, commercial snapshots and polished quote documents still need their own implementation and evidence.

## 3. The visitor journey

1. **Design:** open a sample, enter measurements or use Roomedy's photo flow. Arrange the room normally.
2. **Plan & cost:** enter a separate full-page workspace within the same Roomedy project. Confirm country/city, currency, the work to include and any budget.
3. **Review quantities:** see floor area, painted walls and furniture. Confirm the measurements that affect the selected work; retain explicitly approximate calculations where useful.
4. **Choose systems and products:** select a floor, a paint system and furniture matches. Review supplier links, exact variants, exclusions and price observation dates.
5. **Complete the cost scope:** choose DIY or paid work and account for preparation, installation, delivery, assembly, room clearance and disposal where relevant.
6. **Discuss alternatives:** ask Medy to reduce the total, keep particular pieces, improve durability or explain a line. Review a computed comparison before applying it.
7. **Save a version:** approve a snapshot of the chosen design and estimate, with unresolved allowances clearly identified.
8. **Export and act:** download a branded estimate and shopping/work plan with supplier links. Later edits produce a new version and an understandable comparison.

The room already designed in Roomedy supplies the geometry for this journey.

## 4. A full-page Plan & cost workspace

Use **Design** and **Plan & cost** as peer project destinations. “CPQ” is useful in technical and portfolio documentation; the visitor needs a task label. Navigation should preserve one active project, current design and measurement history.

The owner's Choreograph reference supplies the idea of a full-page conversation. It does not select that repository's styling, architecture or business features; no Choreograph source inspection is claimed here.

The conversation should occupy the primary workspace and produce useful visual content inline:

- A room summary and an expandable 2D/3D view tied to the selected estimate version.
- Floor, walls, furniture and services cards with their subtotals and missing inputs.
- Product comparisons with supplier, variant, size, finish, price and source links.
- A calculation drawer for “Why do I need 11 packs?” or “What does painting include?”
- Budget alternatives showing the actual changes, savings and compromises.
- An itemized table, work sequence, version comparison and reachable save/export actions.

On wider screens, a compact contextual plan/estimate summary can sit beside the conversation. On phones and short laptops, show one useful task at a time with expandable plan and calculation views. Avoid permanently squeezing chat, a table and a live 3D room into three narrow columns.

Selecting a cost line highlights its actual surface or furniture ID; selecting that element reveals its cost lines. Hidden cutaway walls remain part of the painted scope. Merely opening a breakdown, rotating the room or switching destinations makes no research request.

Keep Roomedy's oat/cocoa palette, warm glass controls, readable typography and smooth finite transitions. Site headers remain continuous with the background, without a bottom divider or line-like shadow. Preserve keyboard navigation, accessible Send, composition-safe typing, reachable actions and interruption-safe motion from the [visual-feedback lessons](references/LESSONS_FROM_VISUAL_FEEDBACK.md).

## 5. Flooring: a system, not a texture price

### Quantity rules

For the first rectangular room:

```text
net floor area (m²) = width_mm × depth_mm / 1,000,000 − reviewed exclusions
required coverage (m²) = net floor area × (1 + chosen waste fraction)
packs = ceiling(required coverage / coverage per pack)
purchased coverage = packs × coverage per pack
floor material cost = packs × price per pack
```

Keep net area, cutting allowance, purchased quantity and surplus separate. Ordinary movable furniture does not reduce flooring area. Permanent cabinets or other exclusions need explicit scope decisions. Apply waste once, then round up; do not add another general material-waste multiplier at the subtotal.

Howdens' Korlok guide demonstrates area calculation, pack coverage and a 10% waste allowance for that product workflow. That supports configurable rules, not a universal 10% requirement for every material or laying pattern. [Howdens fitting and quantity guide](https://www.howdens.com/-/media/howdens/assets/clh_asset_products/clh_asset_levela_108973/clh_asset_levelb_110615/clh_asset_levelc_110619/ass_25573493.pdf).

### What the visitor configures

Begin with one fully modeled click-flooring system and two or three compatible product choices. Include material/finish, plank dimensions, pack coverage, installation method, laying direction and waste assumption. Show real-world texture scale in 3D; colour and pattern alone cannot establish the product's installation requirements.

The system can produce separate lines for:

| Component | Quantity/rule | Important dependency |
| --- | --- | --- |
| Flooring | Whole packs covering net area plus cutting allowance | Exact product and pack coverage |
| Underlay/moisture layer | Required area and whole rolls/packs | Substrate and manufacturer system; avoid charging twice for an integrated layer |
| Adhesive and consumables | Product-specific coverage or a disclosed allowance | Only for systems that require them |
| Skirting, trims and thresholds | Reviewed lengths and whole stock lengths/pieces | Doorways, retained trims and chosen finish |
| Removal, preparation and installation | Net installed area, hours or a fixed job basis | Separate work scope, minimum charge and substrate condition |
| Disposal and delivery | Supplier/job-level charge or allowance | Existing floor, order grouping and destination |

Quick-Step's installation guidance treats subfloor preparation, underlay and finishing as part of installation and identifies its laminate as floating rather than glue-down. These are reasons to model system compatibility instead of adding every accessory to every floor. [Quick-Step laminate installation](https://www.quick-step.co.uk/en-gb/laminate/installation).

Tile can follow as a second system: tile dimensions, pattern and pack rounding plus adhesive, grout, joint dimensions, preparation and labour. MAPEI's grout calculator uses tile length, width, thickness, joint width and covered area; Sika notes that consumption and product availability vary by job conditions and market. [MAPEI grout calculator](https://www.mapei.com/ae/en/tools-and-downloads/tools/product-calculator/grouts), [Sika grout and adhesive calculator](https://www.sika.com/en/knowledge-hub/tile-grout-adhesive-calculator.html).

Unknown subfloor condition stays an assessment item or an explicit preparation allowance. A photograph cannot confirm dryness, flatness or hidden damage. Avoid promising a cutting optimization or professional installation specification from a texture preview.

## 6. Walls and paint: preparation, primer and finish

### Quantity rules

For a selected rectangular wall:

```text
gross wall area = wall length × room height
net painted area = gross area − reviewed non-painted openings/regions
paint litres = net painted area × finish coats / product coverage per litre per coat
primer litres = primed area × primer coats / primer coverage per litre per coat
```

Use metres for these formulas after canonical millimetre conversion. Calculate each wall separately and aggregate walls using the same product/colour before pack selection. Deduct the union of applicable opening regions once; overlapping or invalid openings must not create negative area. Unknown opening positions or dimensions make the deduction uncertain.

Ceilings, door leaves, frames, skirting and window reveals are separate scopes. A furniture footprint does not automatically remove paint area behind it. Paint coverage must state whether it is per coat; avoid multiplying coats again when a supplier provides a complete-system yield.

Dulux's published method measures surfaces, subtracts windows/doors and accounts for the selected product's coats and coverage. Its calculator also explains that actual requirements vary with surface and finish. [Dulux quantity method](https://www.dulux.co.uk/en/expert-help/how-much-paint-do-you-need), [Dulux paint calculator](https://www.dulux.co.uk/en/paint-calculator.html/paint-calculator?productId=90775&productSelected=true).

### A paint system should record

- Which walls are included, their condition, colour and finish/sheens.
- New plaster, previously painted surface or another supported substrate; unknown remains unknown.
- Cleaning, filling, sanding and protection, with a clear light-preparation scope or a repair allowance.
- Primer/sealer requirement, exact product, coverage and coats, independently from topcoat.
- Finish paint, product-specific coverage, coats and available can sizes.
- Consumables and labour, with the rate basis and included tasks.

Primer is conditional on the selected system and substrate; neither “always add one primer coat” nor “paint includes everything” is a sound universal rule. Jotun's Egypt Fenomastic Emulsion Primer page illustrates a distinct preparation product and provides market-specific documentation. The correct local technical data sheet must settle the chosen system's exact coverage, compatibility and coat schedule. No numeric Jotun coverage was verified in this research. [Jotun Egypt primer](https://www.jotun.com/eg-en/products-and-services/products/fenomastic-emulsion-primer).

Choose whole cans using available sizes, local prices and a bounded pack-selection calculation. Show required litres and purchased litres. Do not mix colours to satisfy coverage or assume every pack size is locally available. Any handling allowance must be explicit and separate from coat count.

The selected studio extension includes individual-wall appearance choices with a per-wall quantity breakdown. Pricing can initially group walls using the same paint system. Per-wall assignments require explicit data, rendering, command and export support in RM-022.

### Decorative walls and engraving

Simple manufactured panels or wallpaper could later reuse area/strip/pack rules, plus adhesive, trim and installation. Wallpaper also needs roll width, usable length, pattern repeat and drop matching; square metres alone are insufficient.

Engraving, carved features, bespoke plasterwork and structural wall changes depend on fabrication, substrate and site conditions. Treat them as future custom-work lines requiring a supplier estimate. They should not be presented as easy extensions of paint pricing or inferred automatically from a rendered wall.

## 7. Furniture: connect a representation to a buyable variant

### Matching policy

Separate the room's furniture representation from the retailer offer attached to it. A generic oak desk may have several useful shopping matches; it should not silently become an IKEA SKU.

| Match | Evidence shown | Effect on the design |
| --- | --- | --- |
| Exact selected variant | Merchant/product ID, variant, documented outer dimensions, finish and included components | Can be represented as the selected product only to the extent supported by the asset/data |
| Similar alternative | Comparable category/style with visible size, finish or feature differences | Remains a suggestion until reviewed |
| Custom/owned piece | Existing furniture or a visitor-entered supplier estimate | No invented retail identity; purchase cost is excluded unless buying/replacing is selected |

Filter candidates by function, outer physical size, required features and local delivery before softer visual similarity. Show hard mismatches explicitly. Bed mattress size is not frame size; wardrobe depth may not include the clearance needed to open it.

Selecting a product with different dimensions prepares a normal spatial replacement/size proposal. Recheck containment, access, locks and other existing rules; do not update the price card while silently preserving a smaller generic footprint. Pricing research cannot authorize a room change.

Required components belong in the bill of materials without duplication. The IKEA Egypt VIHALS example includes a LURÖY base but excludes mattress/bedlinen; its 90 × 200 cm label is mattress size, while its stated outer size is 96 × 206 cm. The fetched page showed EGP 6,295 on this research date, with availability still requiring a separate check. This is an evidence example, not a selected Roomedy product or a price promise. [VIHALS Egypt product page](https://www.ikea.com/eg/en/p/vihals-bed-frame-white-luroey-s09581853/).

### Visual quality work

The owner's request for richer textures and familiar, store-like furniture deserves its own stream of work. Curate a small coherent set of better bed frames, wardrobes, desks, chairs and storage rather than expanding to hundreds of shallow assets.

Use plausible construction, hardware, fabric, grain scale, edge details and supported moving parts. Preserve semantic footprints independently from mesh bounds and preserve all existing finish/size editing behavior. Detailed fixed products should use documented variants; adjustable generic models remain useful for custom pieces.

An exact branded representation needs an appropriately licensed asset or permitted original asset work and reliable product data. A merchant product page does not by itself establish permission to reuse its photos, models or branding. Record the asset source and permitted use before bundling it. Until then, label the representation as similar and use a truthful supplier card.

Keep bounded texture memory, mesh budgets, lazy preparation, thumbnails, owned material instances and tested fallbacks. Richer materials must be checked on the actual room and short/narrow layouts without degrading Roomedy's motion. Improved meshes are valuable; pricing correctness should not wait for an entire photorealistic catalogue.

## 8. Local sourcing and price evidence

### Location is explicit and editable

Ask for country and city/area when the visitor starts costing. Add postcode or delivery zone only where needed. Language, currency and location are separate choices. Browser locale can suggest defaults, but a device timezone or IP hint does not establish where the project is.

Egypt/Cairo is a useful research illustration here, not a global default or a selected launch market. Recommend one supported country/city and one currency for the first complete slice; keep the data model capable of other markets. Unsupported locations should offer manual prices and useful research links without pretending equivalent coverage.

### Research pipeline

1. Build a bounded brief from selected room items, material requirements and the confirmed market. Avoid sending the full room/chat or exact home address into every search query.
2. Prefer merchant/manufacturer feeds or documented APIs where available. Use a search API to discover relevant local product pages and supplier services when feeds are unavailable.
3. Read the actual product/variant page or permitted feed. A search snippet is a discovery lead, not a verified price or stock record.
4. Extract structured fields, validate unit/variant/currency and retain source evidence. Reject contradictory or missing fields rather than having the model fill them from memory.
5. Compare a small set of suitable alternatives and explain meaningful differences. Distinguish researched candidates from the chosen estimate lines.
6. Let the visitor select an offer or enter a supplier/manual price, then calculate locally from that accepted record.
7. Refresh only on an explicit research/update action; show the resulting changes before replacing accepted draft prices.

Search APIs can expose country/language/freshness and local-context controls; Brave is one researched example, not a selected vendor. Those controls improve discovery but do not verify stock, delivery eligibility or the freshness of the merchant's price. Vendor coverage, current terms, storage rights, costs and actual target-market quality need evaluation before selection. [Brave Web Search documentation](https://api-dashboard.search.brave.com/app/documentation/web-search), [Brave location parameters](https://api-dashboard.search.brave.com/api-reference/web/search/post).

### Minimum offer record

Store the merchant and product URL/ID; exact variant and finish; outer dimensions; quantity/pack size; coverage/yield where applicable; observed price and currency; tax inclusion status; conditional discounts; destination/market; observed availability and lead time if actually supplied; observation time; source type; and a short relevant evidence excerpt or permitted normalized record.

Keep published list prices, membership prices, sale prices, manual rates and supplier estimates distinguishable. Use a public standard price unless a visitor confirms eligibility for a conditional discount. Do not promote “from” prices into a fully specified variant price. Store conflicting fields as needing review.

Every line should say whether its price is sourced, manually entered, an allowance or unavailable. Source age and quantity confidence are separate properties. Do not invent a confidence percentage or label an old observation “live.” A product page may confirm the product's existence while stock remains unknown.

### Delivery, assembly and moving

Group shopping lines by supplier and compatible order/delivery group before calculating delivery. Fees can depend on zone, basket value, weight, service level and access. One fee per furniture item can overcharge; a universal zero-delivery assumption can understate the project.

IKEA Egypt's published delivery and assembly pages illustrate location zones, service choices and conditional prices. The delivery page also contains different express starting amounts and zone-table amounts, demonstrating why unresolved source conditions need review rather than a fabricated final fee. [IKEA Egypt delivery](https://www.ikea.com/eg/en/customer-service/services/delivery/), [IKEA Egypt assembly](https://www.ikea.com/eg/en/customer-service/services/assembly/).

Treat these as separate services:

- Supplier delivery of new goods.
- Assembly, wall mounting or installation.
- Clearing/moving existing furniture within the home, including protection and return placement.
- Moving between addresses, which needs origin/destination and access information.
- Removal/disposal of old flooring, packaging or furniture.

Use a published applicable rate, an entered supplier estimate or an explicitly adjustable local allowance. A moving company listing without a price provides a contact lead, not a cost. Floor level, lift/stair access, item volume, crew time and minimum charges may remain unresolved. No credible local labour or moving-price dataset was established by this research.

## 9. The deterministic pricing authority

The model can find evidence, explain choices and propose structured alternatives. Application code owns quantities, product compatibility, money, totals, budget comparisons and document contents.

| Rule | Required behavior |
| --- | --- |
| Units | Canonical mm for geometry; explicit m², linear metres, litres, kg, hours and each/packs for pricing; never compare incompatible units |
| Money | Exact decimal/rational quantity calculations and currency-aware minor-unit amounts with documented rounding; no binary floating-point money authority |
| Purchase versus installed quantity | Charge whole purchased packs/cans for materials and the selected installed-area/hour/job basis for labour |
| Labour | Choose one clear rate model per service: area, hours or fixed job; apply minimum charge and included work once |
| Tax | Preserve included/excluded/unknown status and the applicable configured rule/source; do not add tax again to an inclusive price |
| Discounts and margin | Explicit eligible basis and order; supplier discounts and any future contractor markup are different concepts |
| Logistics | Calculate per compatible supplier/order/service group, with explicit conditions |
| Allowances and contingency | Separate named scope/uncertainty amounts; show basis and avoid counting the same uncertainty twice |
| Currency | One quote currency initially; retain source currency and reject unsupported mixing. Future FX needs a dated rate, source and conversion rule |
| Missing costs | An unknown required line stays visible and unresolved; it never silently becomes zero |

Show a **priced subtotal**, any **explicit allowances**, and **unpriced required work**. A total with missing required costs is incomplete. A low/high estimate is useful only when its inputs and calculation are defensible; avoid arbitrary ±20% bands.

Distinguish zero cost because an item is reused, zero additional cost because a component is included, deliberate exclusion of a scope, and unknown cost. Existing owned furniture may have no purchase cost while still requiring movement or reinstallation.

### Worked quantity example

The following is a hand-calculated illustration using the documented 4.2 × 4.8 × 2.6 m sample geometry. Opening dimensions, product yields, waste and prices below are illustrative assumptions for this example, not a live quote or selected product specification.

| Calculation | Result |
| --- | --- |
| Floor area: 4.2 × 4.8 | 20.16 m² |
| Floor with a selected 10% cutting allowance | 22.176 m² |
| Packs at an illustrative 2.2 m²/pack: ceiling(22.176 / 2.2) | 11 packs, purchasing 24.2 m² |
| Gross walls: 2 × (4.2 + 4.8) × 2.6 | 46.8 m² |
| Deduct one 0.9 × 2.1 m door and one 1.2 × 1.1 m window | 43.59 m² painted walls |
| Two finish coats at an illustrative 10 m²/L/coat | 8.718 L before any separate handling allowance |
| One primer coat over the full example wall area at 8 m²/L/coat | 5.44875 L before any separate allowance |

If only 5 L cans are available, that means two finish cans and two primer cans. A different available pack combination might cost less; the engine must evaluate actual pack options.

At an **invented demonstration price** of EGP 850 per floor pack, flooring material is EGP 9,350. At an **invented demonstration installation rate** of EGP 120/m², installation is EGP 2,419.20, because labour uses 20.16 m² rather than purchased coverage. Their subtotal is EGP 11,769.20. Underlay, preparation, trims, paint, delivery and other work remain additional lines; this subtotal cannot be called the full project cost.

## 10. Medy's budget and planning role

Useful requests include “keep my bed and wardrobe,” “what is missing from painting?”, “find a similar desk locally,” “compare this floor with vinyl,” and “reduce the complete estimate below my budget.”

A budget proposal should:

1. Capture the exact room revision, estimate revision, locale, selected offers, rules and visitor constraints.
2. Search only where new evidence is needed, under an explicit bounded research operation.
3. Generate a small set of valid configurations using selected products and rules.
4. Recompute purchase quantities, accessories, labour, logistics and all totals deterministically.
5. Show changed lines, old/new totals, savings, source freshness, remaining unknowns and practical compromises.
6. Apply only after review, rechecking current revisions and spatial validity for any physical replacement.

The assistant must not reduce measurements, remove necessary primer/accessories, assume discounts, omit required labour or spend contingency to manufacture a budget success. Reusing furniture and choosing DIY can reduce purchase/paid-labour scope, but those choices must be explicit. “Within budget” requires complete priced scope, or clearly qualified wording such as “priced items plus allowances are within budget; moving remains unpriced.”

Medy can also assemble a practical sequence: confirm measurements and substrate, choose products, resolve supplier/installer questions, clear/protect the room, complete preparation and painting/floor installation in the reviewed order, then deliver/assemble/return furniture. Order and timing depend on the selected systems and site; cite relevant manufacturer instructions, and keep unknown durations open. Structural work and hazardous site diagnosis remain outside this initial plan.

Keep ordinary editor Medy focused on design. The full-page experience can use a different bounded context projection and tools while sharing accepted room facts. Cross-workspace changes need one visible proposal owner; a pending editor proposal must be resolved or made stale before another can commit conflicting work.

## 11. Saved versions and approval

Use distinct draft and saved states:

```text
Editable estimate draft → reviewed saved version → new draft derived from that version
```

A saved version freezes the room snapshot, scope, measurement evidence, chosen product variants, quantity results, pack choices, source observations, labour/logistics assumptions, tax/currency/rounding rules, totals, creation time and a calculation-engine version. It also freezes the design captures used by its PDF, or enough versioned local assets/data to reproduce them honestly.

Changing a material, room dimension, supplier price or locality creates changes in a draft. Refreshing prices never rewrites the saved version. A comparison should explain whether a total changed because of scope, geometry, product selection, quantity, rate, delivery or tax, with a visible old/new difference.

In the consumer feature, “Approve estimate” means the visitor accepted a planning snapshot. It does not mean a merchant committed its stock/price or a contractor signed a binding offer. Initially export **Roomedy estimate**. A future contractor quote mode would additionally need a real issuer, reviewed rates, terms, validity, responsibilities and a separate commercial acceptance process.

### Storage decision

Retain the current two-hour guest lifetime initially and support downloading/importing a versioned project containing bounded estimate snapshots, plus downloading the PDF. “Saved in this session” must not imply a permanent project library. A PDF is a readable deliverable; editable continuation requires the project export.

This requires an explicit project-schema migration: current v1 cannot accept arbitrary pricing fields. Validate new records before import, recalculate drafts using their declared rules and preserve saved historical results without presenting them as current prices. Unsupported rule/asset versions need a clear read-only or unavailable state.

Offline guest snapshots are locally editable data. A content hash can detect accidental changes but does not establish a trusted issuer, signature or tamper-proof commercial record. Durable cross-device history, accounts and server-issued approvals would be a separate persistence/security scope.

## 12. The PDF and purchasing/work plan

Offer an estimate PDF that combines the design story with the financial detail, with a visual-only export still available where appropriate. Every page must come from one selected snapshot, even if the current room changes while export is preparing.

The estimate should include:

- Project/room name, estimate ID/version/date, location, currency and estimate status.
- A room view and legible dimensioned plan tied to that version, with relevant measurement assumptions.
- Summary by flooring, walls, furniture and services.
- Itemized quantities, units, pack/can counts, unit prices, line totals and tax treatment.
- Preparation, installation, delivery, assembly, moving and disposal inclusions/exclusions.
- Explicit allowances and unresolved required costs, with a qualified total.
- Product/variant names and clickable supplier links, observation dates and matching limitations.
- Shopping quantities and a concise work sequence, including checks still needed before ordering.
- Revision changes where requested, plus relevant source/assumption notes.

Retain the existing PDF library if it meets the requirements; the current JPEG-page exporter needs additional text/table layout and real link annotations. Pricing tables should use selectable text, repeating headers, appropriate pagination and readable figures. Arabic/RTL, local numerals and font shaping need deliberate support if Arabic output is selected; an English EGP estimate does not prove that support.

Render and inspect actual exported pages, including long names, many lines, missing-price states, clickable links and totals matching the workspace. Exporting or reopening a saved PDF performs no new price research and must not mutate its amounts. Supplier links lead to the supplier's site; initial scope has no checkout, purchase execution, booking or outreach.

## 13. Architecture direction

Keep the current public frontend/private API pair. A pricing extension does not itself require a new service, database, queue or renderer.

- **Contracts:** versioned public schemas for locale, work scope, products/offers, units, price evidence, estimate lines, proposals and snapshots. Keep third-party response formats outside the public contract.
- **Pure estimating domain:** a small shared module/package for takeoff, compatibility, pack selection, exact pricing, totals and estimate diffs. Browser and backend use the same authority. Confirm extraction boundaries against real consumers during implementation; do not mix network/money rules into the spatial renderer.
- **Spatial domain:** continues to own physical room geometry, checks and accepted design commands.
- **Backend sourcing adapters:** controlled search/feed/page retrieval and normalized evidence, admitted through the existing bounded infrastructure. The model receives validated evidence and tools with narrow capabilities.
- **Frontend session ownership:** one project with coordinated design and estimate revisions. Price-only changes need not increment physical room revision; any room change marks dependent draft quantities/proposals stale and triggers deterministic recomputation.
- **Cross-domain Apply:** if a chosen offer requires a physical replacement, validate room and estimate changes together before committing either. Cancel/stale results leave both unchanged; Undo restores the coherent prior draft without editing saved snapshots or refunding research calls.
- **Export:** capture a selected immutable snapshot and generate all views/tables/links from it. No last-second live supplier lookups.

Source refresh is an operation with results, not a continuous background subscription. Bound requested items, alternatives, query/fetch counts, source bytes, redirects, parsed fields, calculation work, deadlines, histories and retained evidence. Preserve cancellation, generation/revision checks, admission, private IAM/origins and safe diagnostics; existing limits must be re-evaluated for this new workload rather than assumed sufficient.

Merchant content is untrusted data. It cannot issue instructions, change system prompts, choose privileged endpoints or trigger tool execution. Any server-side retrieval of supplier/user links needs destination restrictions, private/local-address protection, redirect validation and bounded responses. Linking to a shop does not require granting the browser an arbitrary backend fetch proxy.

Prefer prepared/local assets and permitted product records. Review search/merchant storage terms before retaining evidence or thumbnails, and do not bypass access restrictions when a page cannot be fetched. Keep a useful manual-price path.

New search-provider billing, real merchant integration tests and hosted provider/privacy evidence are future execution work. The current paid model deployment and earlier limited live tests do not establish search access, new workload capacity or an account-wide monetary cap.

## 14. Recommended delivery slices — proposals, not tickets

| Slice | Reviewable outcome | Boundary |
| --- | --- | --- |
| 1. Complete deterministic example | One existing room, one locality/currency, click flooring and paint systems, a few furniture offers, transparent quantities/services, saved versions and estimate PDF | Authored price fixtures are visibly sample data; complete the calculation/document story before live research |
| 2. Sourced local estimates | Bounded real research for a small supported merchant set, source evidence, manual rates, price refresh and real furniture variants | Prove actual target-market results and missing-data behavior; no worldwide accuracy claim |
| 3. Budget assistance and work plan | Full-page Medy research/explanations, computed budget proposals, reviewed Apply/Undo and useful supplier/work steps | Scope, fit, dependencies and incomplete costs remain authoritative |
| 4. Richer catalogue and surface choices | A curated set of detailed furniture/materials, consistent selected-product representation, optional individual-wall systems | Asset rights, performance and editor/export parity need actual verification |
| 5. Additional estimating systems | Tile, wallpaper/panels, more services and supported markets | Each needs its own quantity/compatibility/local evidence rules |
| 6. Optional durable quote product | Accounts/server-issued commercial quote history | A separate later business choice, not a CPQ prerequisite |

The first public-quality CPQ increment should combine the complete core with a small amount of verified local sourcing. Authored fixtures make the initial engineering reproducible; they must not be the final evidence for a live research claim.

Suggested initial breadth: one room, one confirmed market, one currency, one click-floor system, one ordinary wall-paint system, a handful of furniture categories, two or three alternatives per requested item and explicit services/allowances. Carry the broader furniture/finish/locality vision in the model without implementing every trade at once.

## 15. What would make the extension convincing

These are future acceptance examples, not tests performed by this draft:

1. Correcting room width changes floor area, whole-pack counts and affected labour. The plan, estimate and PDF agree; unrelated fixed charges stay fixed.
2. Changing a door/window deduction affects the correct wall paint area once. An unknown room height blocks a reliable wall quantity without blocking furniture research.
3. A compatible floor substitution changes its own accessories and preparation scope. An incompatible system is rejected or requires an explicit scope change.
4. Paint calculations distinguish coats, yield, primer, colours and purchasable cans. A lower product price can still produce a higher installed total.
5. Furniture matching shows size differences and required components. A replacement that does not fit cannot silently update the selected design.
6. Delivery is grouped correctly, conditional discounts are explained, and unknown moving/repair costs remain visible. Missing lines never create a false budget success.
7. Research links resolve to the right product/variant and market; stale, blocked, contradictory and out-of-stock results remain usable review states.
8. A budget proposal respects retained items and complete scope, presents computed savings, and becomes stale after a relevant room/price/location change.
9. Saving v1, editing products and refreshing prices produces v2 while v1's data and PDF stay intact. Compare and import/export preserve that distinction under bounded storage.
10. Late research after reset/import/expiry cannot write into another project. Price-only Undo and combined design/estimate Undo stay coherent.
11. Exported pages remain readable with long names and several pages, have working source links, and match one selected snapshot exactly.
12. Actual desktop, short-laptop and phone flows keep conversation, quantities and decisions reachable, with smooth existing editor motion and no header divider.

Use independent hand-calculated fixtures for quantity and money rules, meaningful cross-domain state tests, adversarial retrieval/input cases, actual PDF page inspection and a separately authorized small live sourcing evaluation. Record checked results separately from remaining market/provider/physical limits.

## 16. Recommended baseline decisions

The owner delegates recommended assumptions; the chosen initial defaults are recorded below and in section 18:

| Decision | Recommendation |
| --- | --- |
| Product promise | Finish and furnish an existing single room; structural construction remains excluded |
| Primary visitor | Consumer planning a room; contractor-issued quotes are a later business mode |
| Workspace | Full-page Plan & cost with embedded plan, calculations, comparisons and sourcing cards |
| Initial market | Select one country/city based on actual supplier coverage; Egypt/Cairo is an investigated example |
| First cost systems | Click flooring, ordinary wall paint, curated furniture and explicit associated services |
| Local rates | Sourced offers or visitor/supplier-entered rates; unknown labour/moving stays an allowance or unresolved |
| Version lifetime | Existing guest lifetime plus downloadable/importable snapshots; durable accounts deferred |
| Furniture fidelity | Richer curated generic assets first, exact documented/licensed variants where justified |
| Search vendor and source retention | Evaluate coverage, terms, cost and privacy before selecting; none selected here |
| Presentation of quotes | Branded estimate with transparent assumptions; separate future issuer/terms workflow for commercial quotes |

## 17. Research register and limits

Research date: **26 October 2026**. Sources below support the adjacent claims and product rules. These are public research observations, not negotiated offers, verified checkout totals, local trade surveys or a survey of every available product. Proposed formulas and architecture are Roomedy recommendations derived from those observations and the inspected repository.

| Source | Evidence used | Access/limit |
| --- | --- | --- |
| [Howdens Korlok guide](https://www.howdens.com/-/media/howdens/assets/clh_asset_products/clh_asset_levela_108973/clh_asset_levelb_110615/clh_asset_levelc_110619/ass_25573493.pdf) | Area, pack coverage, waste and installation preparation | PDF text opened; product-specific, not a universal flooring rule |
| [Quick-Step installation](https://www.quick-step.co.uk/en-gb/laminate/installation) | Subfloor, underlay, floating installation and finishing | Page opened; exact local product instructions remain necessary |
| [Dulux method](https://www.dulux.co.uk/en/expert-help/how-much-paint-do-you-need) and [calculator](https://www.dulux.co.uk/en/paint-calculator.html/paint-calculator?productId=90775&productSelected=true) | Area deductions, product coats/coverage and surface-dependent yield | Search-index content available; direct page opens returned 403 |
| [Jotun Egypt primer](https://www.jotun.com/eg-en/products-and-services/products/fenomastic-emulsion-primer) | Separate primer product and Egypt-specific TDS/SDS links | Product page opened; linked TDS fetch failed, so no numeric local coat/coverage claim adopted |
| [MAPEI grout calculator](https://www.mapei.com/ae/en/tools-and-downloads/tools/product-calculator/grouts) | Product/tile/joint inputs to grout consumption | Search-index content available; direct page open returned 403 |
| [Sika consumption calculator](https://www.sika.com/en/knowledge-hub/tile-grout-adhesive-calculator.html) | System-specific estimated consumption and country availability limits | Page opened; not an Egyptian retail price source |
| [IKEA Egypt VIHALS](https://www.ikea.com/eg/en/p/vihals-bed-frame-white-luroey-s09581853/) | Variant identity, included base, excluded mattress, outer size and observed price | Page opened; availability not confirmed |
| [IKEA Egypt delivery](https://www.ikea.com/eg/en/customer-service/services/delivery/) and [assembly](https://www.ikea.com/eg/en/customer-service/services/assembly/) | Zone/service/conditional fee examples | Delivery page opened; assembly indexed content read; applicable final fee still needs conditions checked |
| [Brave Web Search](https://api-dashboard.search.brave.com/app/documentation/web-search) and [location parameters](https://api-dashboard.search.brave.com/api-reference/web/search/post) | A possible search integration's discovery/locale capabilities | Documentation read; no account, key, integration or vendor selection |

The Upwork jobs in the quoted conversation remain user-supplied inspiration. Their full postings were not retrieved and are not treated as verified acceptance requirements for this extension.

The original research was documentation-only. On 26 October the owner additionally authorizes the ticket plan and implementation loop below. Actual outcomes belong in each ticket receipt; no future acceptance is claimed by this plan.


## 18. Approved execution map and recorded decisions

The owner explicitly approves creating and executing all necessary tickets, recommended assumptions and exact-file local commits, with fake-only testing until return. Proceed without routine questions. The initial current branch is retained; no branch switch or delegation is needed. Existing release commits and other apps are preserved.

| Decision | Recommended choice and consequence | Review |
| --- | --- | --- |
| Market | Cairo/Egypt, EGP as an editable initial example; country/city/currency are explicit. Manual prices remain available elsewhere. | Owner manual acceptance pending |
| Geometry | Keep one rectangular existing room and stable furniture/opening IDs; surface-specific wall references are north/east/south/west. | Selected boundary |
| Customization | Rich tactile materials with physical pattern scale/direction and per-wall choices; supported furniture materials/soft parts/hardware in the studio. Preserve geometry and provenance. | Owner visual review pending |
| CPQ UX | A distinct project phase/page with centered conversation and inline interactive 3D scenes highlighting the selected floor, wall or furniture; accessible text/table equivalents. | Selected direction |
| Runtime | Test fake/paid-off only; sample offers visibly authored. Prepare live sourcing contracts/adapters without network dispatch. | Real sourcing quality deferred to owner |
| Sources | Prefer existing server/provider infrastructure, exact variant evidence and bounded source tools. No new service or search vendor/account is selected by planning. | Adapter detail recorded in RM-026 |
| Storage | Two-hour guest recovery, bounded saved estimate versions and versioned project download/import; no account/database. | Owner manual acceptance pending |
| Delivery | Ten cohesive tickets RM-021–RM-030, each with its own prior file allocation, actual receipt and clean read-only review before local commit. | Authorized |

Ticket precision and acceptance live in the packets linked by the queue. The full proposal remains the product reference; each packet links only its owning sections and existing implementation policy. Local completeness, fake integration, actual market research, hosted deployment and the owner's visual acceptance remain separate claims.
