# RM-002 — Prepare the catalogue, assets and room fixtures

Status: **Complete**  
Planning date: **17 October 2026**  
Milestone: **Foundation**  
Depends on: [RM-001](RM-001-initialize-workspace-contracts-and-safe-runtime.md)  
Suggested commit: `RM-002: prepare dimensioned catalogue and room fixtures`  
Authority: [blueprint §13](../ROOMEDY.md#13-furniture-and-asset-pipeline), [§§5–6](../ROOMEDY.md#5-the-complete-visitor-journeys), [§19](../ROOMEDY.md#19-visual-direction-and-accessibility)  
Queue and execution rules: [ticket index](README.md)  
Build guidelines: [owner feedback lessons](../references/LESSONS_FROM_VISUAL_FEEDBACK.md) (L-04, L-05, L-14, L-15) and [review checklist](../design/REVIEW_CHECKLIST.md)

## Outcome and standalone context

Provide a small usable furniture catalogue and authored room fixtures that both views, intake and the assistant can trust. Bed, desk, chair, wardrobe and limited storage must have semantic dimensions, front direction, supported finishes and an honest representation policy. Similar supported models at reviewed dimensions are accepted; exact reconstruction of photographed furniture is outside scope.

Use procedural adjustable essentials where they express physical size faithfully, plus a small set of prepared licensed assets where appropriate. Decorative mesh bounds never become collision authority. There are no prices, currencies, retail links or affordability tags. Author empty, partly furnished and furnished bedroom/workspace fixtures, with a purposeful sample and an explicitly disclosed conflict case for tests.

## Dependency evidence and proposed ownership

Confirm RM-001's actual schemas, policy and builds before choosing records. Do not duplicate catalogue types in view components.

| Area | Responsibility |
| --- | --- |
| `packages/contracts/src/catalogue*` | Supported IDs, category/variant/dimension/finish/access metadata |
| `apps/frontend/src/features/catalogue/` | Typed catalogue records, previews and local filtering adapters |
| `apps/frontend/public/catalogue/` | Prepared local assets/thumbnails, no runtime remote fetch dependency |
| `apps/frontend/src/features/room-view/representations/` | Procedural representation definitions and mesh-to-footprint transforms |
| `apps/frontend/src/features/session/fixtures/`, spatial test fixtures | Authored semantic rooms; separate public sample from adversarial test cases |
| `docs/design/catalogue.md`, asset manifest/license records | Exact provenance, license, preparation, dimensions and known approximations |

## Implementation plan

1. Select a compact collection covering a bed, desk, compatible chair, hinged/sliding wardrobe representations and useful storage. Each item has a versioned ID, integer physical bounds, explicit supported dimension ranges or fixed sizes, local front and access mechanism.
2. Review exact source items and licenses before use. The blueprint's Kenney/Quaternius/Poly Haven pages are leads, not evidence every downloadable item is appropriate. Keep source URL, author, license text/version, original filename, local prepared filename and required attribution. Do not buy assets or fabricate a license review.
3. Prepare/convert only selected assets into web-deliverable formats with bounded geometry/material/texture budgets. Normalize scale, axes, origin and floor contact; include transform metadata aligning the representation with semantic center pose. Keep unnecessary source archives out of public runtime output.
4. Build adjustable procedural essentials where a fixed asset would misrepresent reviewed dimensions. Never nonuniformly stretch a fixed detailed model into an unsupported physical variant without an explicit acceptable representation policy. Missing assets fall back to the same supported semantic item, not a differently sized replacement.
5. Define the three finish presets **Warm & simple**, **Light & airy**, **Calm & focused** as supported finish/material references. Appearance changes do not alter footprint, ownership or locks. Unsupported recoloring gets a truthful unavailable state.
6. Author one useful sample plus empty/partly furnished/furnished condition fixtures. Include stable furniture/opening IDs, per-value authored confirmation, realistic dimensions, independent locks and retained/may-replace preferences. Do not copy the HTML illustration's corner coordinates into center-pose fixtures without conversion.
7. Hand-calculate a small fixture manifest of expected corners, opening intervals and obvious collisions/bounds. RM-003 independently validates it; loading a picture is not proof of fit. Keep a disclosed invalid-baseline fixture so future repair behavior can be tested honestly.
8. Supply usable 2D footprints/thumbnails and normalized 3D representation metadata from the same records. Asset identity and catalogue version must be shared by plan, cutaway, export and assistant filtering. Document deprecation/missing-version behavior rather than silently substituting sizes.

## Prevention requirements from prior feedback

Use coherent fixtures that demonstrate repeated views, retained dimensions and genuine uncertainty. Thumbnail/model/plan representations must describe the same supported physical item. Do not alter fixture truth merely to make a model or visual test pass. Prepared identity/type/assets must remain stable after refresh and missing-asset fallback.

## Approved plan refinements — 17 October 2026

**Historical catalogue; physical size remains authoritative.** [Owner-approved review](../reviews/2026-10-17-plan-review.md). These requirements remain unverified until their owning execution evidence exists.

The original catalogue/asset/fixture completion evidence is unchanged. PR-01 is implemented in RM-003 and consumed by the editor/intake/renderer: an owned item retains its bounded true dimensions even outside its chosen visual representation range. Select an eligible procedural representation or an explicitly limited semantic placeholder without changing ID, ownership, dimensions or fit facts. Proposed catalogue additions/replacements still obey offered variant ranges. A fixed detailed asset is never silently stretched. Apply coordinate/provenance fixture refinements with their owning RM-003 change and revalidate affected consumers; do not call those future checks part of this completed asset receipt.

## Acceptance criteria

- [x] Supported essentials/storage have versioned IDs, dimensions, front/access metadata and available representations.
- [x] No catalogue price, currency, shopping, invented availability or retail field is present.
- [x] Exact selected assets have traceable licenses and required local attribution.
- [x] Prepared assets are local, bounded and aligned to the documented semantic footprint/floor.
- [x] Adjustable versus fixed-size representation rules preserve reviewed furniture dimensions.
- [x] All three room conditions and one disclosed conflict baseline have valid authored records and independent expected facts.
- [x] Finish presets affect appearance only and use supported material references.
- [x] Missing representation/version behavior is safe, visible and does not replace physical sizes silently.
- [x] Fixtures demonstrate their stated geometry/identity relationships, and representation/thumbnail fallback never silently changes physical dimensions.

### Downstream acceptance — not historical completion evidence

- [x] Downstream RM-003 and view consumers retain corrected owned physical dimensions outside fixed/procedural representation ranges with an honest fallback; proposed unsupported variants still reject.
- [x] Affected fixture/asset consumer checks are refreshed when coordinate/evidence contracts change; the original RM-002 preparation receipt remains historical.

## Focused verification and evidence

| Case | Required evidence |
| --- | --- |
| Quarter-turn asset at each orientation | Front, floor contact and transformed footprint agree with the catalogue |
| Small/large supported procedural dimensions | Semantic and displayed sizes agree without deriving fit from mesh bounds |
| Fixed asset outside supported dimensions | Proposed unsupported variant rejects; an owned true size remains semantic truth with eligible procedural/limited representation under downstream RM-003 |
| Fixture coordinate conversion | Hand-derived centers/corners and authored source notes |
| Finish preset | Same IDs, poses, ownership, locks and dimensions before/after |
| Asset build output | License/source manifest and finite geometry/texture/file-size inventory |

## Handoff and limits

Record exact selected assets and actual preparation results when implemented. RM-003 owns geometric truth, RM-006 owns real cutaway rendering and RM-015 owns measured visual/device acceptance. This ticket cannot claim photo resemblance, exact recognition, certified clearances or owner approval from attractive thumbnails. Follow the index's future execution, read-only validation and Git rules.

Execution: [exact allocation](../commit-plans/RM-002.md), [validation evidence](../validation/RM-002.md), [catalogue/asset/fixture policy](../design/catalogue.md). Required local scope completed on 17 October 2026; actual spatial engine and renderer/device acceptance remain later packets.

Downstream refinement receipt: [RM-003](../validation/RM-003.md) refreshed fixture/representation and exact asset-consumer checks; original asset bytes and RM-002 preparation evidence remain unchanged.
