# RM-015CB — Let live photo requests use their intended operation budget

Status: Complete locally,29 October2026. Actual live sample passes; owner private-photo/subjective quality remains pending.

Direct owner reports repeated photo timeout and asks to understand the AI path/restart if helpful. [Allocation](../commit-plans/RM-015CB.md), [receipt](../validation/RM-015CB.md), [provider lifecycle](../engineering/provider-safety.md), [prior verification fix](RM-015BZ-recover-browser-verification.md).

- [x] Actual normal-env restart and one controlled sample reproduction identify the failing stage and elapsed time, without sensitive logs or environment reads.
- [x] Both independent call guards use one app-owned85s photo profile inside the existing90s operation/110s bridge bounds. Interactive45s, pinned model/prompt/quality, no automatic retry and strict admission/validation remain.
- [x] Deterministic delayed-success, timeout, cancellation, actual settlement/slot retention and interactive regressions pass; source review/types/boundaries/builds complete.
- [x] One deliberate live sample retest records result, duration and provider rounds honestly; owner real-photo quality remains pending.
- [x] All unallocated prior hashes, other repository services, existing semantic data and Git state are preserved; canonical progress uses the existing helper.
