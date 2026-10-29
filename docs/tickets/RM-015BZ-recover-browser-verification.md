# RM-015BZ — Recover browser verification

Status: Implemented and validated locally; owner Chrome retest pending, 29 October 2026.

Owner reports photo processing fails in Chrome with the generic verification-unavailable message after a wait. Diagnosis in the permitted in-app browser passes widget, shared component, server Siteverify and four prepared-photo admission without any model operation. The installed Next Script implementation retains failed load promises, preventing a fresh script load on a later deliberate attempt. This is a confirmed recovery flaw; the owner's original Chrome failure cause is not yet established.

References: [allocation](../commit-plans/RM-015BZ.md), [receipt](../validation/RM-015BZ.md), [provider boundaries](../engineering/provider-safety.md), [prior verification ticket](RM-015BH-prepare-live-mode-and-turnstile.md), blueprint sections 16–18 and 21.

- [x] A failed/timed-out script can load afresh on the next deliberate attempt, without automatic retry or duplicate development effect loads.
- [x] Loaded API reuse, cancellation and late-callback fences remain intact.
- [x] Photos, Medy and research expose fixed actionable verification failure reasons without raw vendor payloads, tokens or configuration.
- [x] Continue rechecks availability after a transient config failure; preserve photos, cancellation and strict unavailable rejection before admission.
- [x] Focused tests and real non-metered browser admission/recovery evidence are recorded; temporary route removed.
- [x] Settled repository gate passes:1318tests/84files, format/lint/types/boundaries/assets and both builds.
- [ ] Keep owner Chrome confirmation and actual photo/model quality pending. No paid dispatch, env change, browser-security change, Git or hosted action.
