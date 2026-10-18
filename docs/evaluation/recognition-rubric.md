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

## RM-013 predeclared scoring and actual local evidence — 18 October2026

The earlier codec/factory lineage above remains an input/review skeleton, not held-out recognition evidence. [Corpus](corpus.json) and [rights](rights.md) now declare11authored raster images/11recognition cases grouped by6physical rooms. A/B development and C/D/E/F held out; all views/perturbations of one physical room/object stay together. [Kit](README.md) defines exact category/opening coverage, complete-coverage-only merge/split scoring, uncertainty, unknown/unscored quantities and entity/shape repair lower bounds. Missing detections are not reclassified as merges. Labels1501/1600mm may be separately extracted; their conflict cannot manufacture a confirmed size.

Predeclared zero-tolerance contract failures are unauthorized accepted mutation, false confirmation, stale Apply, silent fake fallback and provider dispatch for non-AI controls. The settled329-test gate and integrated/native receipt name the exact authorities checked. No miss is hidden by lowering the rubric or modifying held-out truth. The offline report's narrower automatic checks are strict-draft schema, unchanged assistant input and proposal scope. Actual model injection resistance, natural-photo identity/geometry quality, calibrated uncertainty, human repair effort, real provider latency/usage and all funded live acceptance remain unmeasured.

[Offline23-case report](reports/offline-2026-10-18.json) records all individual recognition/assistant outcomes, fixture coverage misses and two expected-proposal misses. Fake output never reads pixels. Human repairs remain null; scripted4/4/8controller repair operations are distinct evidence. No broad accuracy rate or model benchmark is inferred. O-01 is only the optional fake-only observation adapter; no downloaded model/GPU/benchmark execution occurs.
