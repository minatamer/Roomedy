# Recognition review rubric skeleton

RM-007 preparation for RM-010/RM-013. No model has interpreted this corpus. These are independent expected review behaviors, not measured recognition results.

The four codec images and [case register](../../test/fixtures/intake/cases.json) are programmatically authored synthetic fixtures. They contain no real private room/user photos and no external asset. Hashes identify their actual bytes separately from deterministic semantic tests. They exercise input formats, size/orientation and review associations, not photorealistic recognition or floor-plan ingestion. Actual owned/consented photo cases, held-out split, model settings and real quality measurements remain RM-013.

| Case | Independent expected behavior | Failure to record |
| --- | --- | --- |
| Same desk in two photos | Two observations explicitly reconcile to one stable physical entity; reviewed measurements survive | Duplicate accepted furniture or overwritten corrections |
| Two identical desks | Keep separate until explicit reconciliation; a split requires independent measurements | Forced identity collapse or copied confirmation |
| Uncertain/mirrored wall | Correct associations without rescaling unrelated confirmed sizes/planned poses | Silent global transform/false confirmation |
| Swapped width/depth after review | Preserve deliberate poses and confirmed values, recompute only dependent estimates; show contradictions | Whole-room silent rescale or lost work |
| Furniture detail only | Cannot establish room outline/scale | Confirmed/metric room inferred from furniture evidence alone |
| Source removal/reorder | Stable identities and accepted corrections survive; removed original is unavailable | Restored private photo, relink to wrong image or erased measurements |
| Unsupported/missed feature | Preserve usable draft; add/correct/exclude through bounded review | Generic transport failure for correctable uncertainty |

RM-013 must record case rights/provenance, actual input hashes, truth/uncertainty annotations, visible inventory/association/measurement errors, correction steps, fit-critical false claims, latency/memory and limits. Keep fake transport/schema tests separate from real model/device evidence. No O-01 reconstruction download, GPU service or benchmark is authorized by this skeleton.

RM-010 adds a deterministic authored semantic factory in `apps/backend/src/recognition/fixtures.ts`, independently asserted HTTP/review expectations and cancellation/correction tests. Its eight cases are empty, repeated desk, missed opening, wrong category, unknown hinge, occluded furniture, hostile-image-text policy and two identical representations. These are **not held-out photo recognition results**: fake behavior never reads the image content. Unknown scale/shape/hinge stays unknown; category can be repaired, missed openings added and repeated observations split/merged. Reorder, renamed refs, missing views, removal, contradictory walls and reviewed dimensions have explicit review regressions. Real content robustness, grouping accuracy and correction counts against actual room truth remain unmeasured until the separately authorized RM-013 evaluation.
