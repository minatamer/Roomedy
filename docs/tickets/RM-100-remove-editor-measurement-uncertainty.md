# RM-100 — remove measurement uncertainty from editor labels

Status: complete locally · 4 November 2026. Owner reports that the scan worked and identifies the furniture question marks in 2D as contrary to the earlier removal of measurement uncertainty prompts. [Exact allocation](../commit-plans/RM-100.md), [receipt](../validation/RM-100.md).

The suffix is currently added when a furniture width or depth is null, independently of successful object recognition. RM-015BV already removed Medy's measurement questionnaire and repeated missing-fact warnings; this follow-up removes the remaining editor presentation.

- [x] Furniture labels use their plain names and ordinary outlines for illustrated and supplied sizes.
- [x] The plan shows only supplied room dimensions, without unknown/status labels; missing dimensions stay editable in properties.
- [x] Remove repeated 2D/3D measurement notices and field uncertainty/evidence badges, including inventory/Medy/replacement/preview/import cards. Preserve input units, bounds/errors, editing and clearing.
- [x] Preserve canonical measurements/provenance, nominal geometry, scan inventory/layout, physical checks, financial/export and preview/Apply/Undo authority. Native export after Apply/Undo preserves all original project facts except the normal current revision counter.
- [x] 210 existing focused checks/nine files, scoped formatting/lint/frontend types/seven boundary cases/frontend build, native visual review and final read-only review pass; no additional paid request or service restart.
