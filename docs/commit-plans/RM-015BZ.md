# RM-015BZ — Recover photo verification after a browser load failure

29 October 2026. Direct owner reports the photo path failing in Chrome after the processing wait. This selects a local correction, not a provider test or browser-security bypass.

Exact permanent allocation:

- `apps/frontend/src/features/verification/failure.ts`
- `apps/frontend/src/features/verification/script.ts`
- `apps/frontend/src/features/verification/state.ts`
- `apps/frontend/src/features/verification/turnstile.ts`
- `apps/frontend/src/features/verification/verification.tsx`
- `apps/frontend/src/features/session/admission-client.ts`
- `apps/frontend/src/features/room-intake/recognition-client.ts`
- `apps/frontend/src/features/room-intake/intake.tsx`
- `apps/frontend/src/features/assistant/client.ts`
- `apps/frontend/src/features/cost/client.ts`
- `test/verification.test.ts`
- `test/verification-script.test.ts`
- `test/recognition-client.test.ts`
- `docs/tickets/RM-015BZ-recover-browser-verification.md`
- `docs/commit-plans/RM-015BZ.md`
- `docs/validation/RM-015BZ.md`

Temporary diagnostic allocation: `apps/frontend/src/app/verification-diagnosis-1029/page.tsx`, removed before checks. Ignored `.release/runtime/` retains non-secret diagnostic records only. Preserve pre-existing empty verification-review directory, owner env, accepted room, other apps, existing service/port identities and hosted release. No Chrome access, CAPTCHA interaction, proof bypass, automatic retry, provider operation, restart, Git mutation or delegation.

Use a bounded owned script load for each deliberate attempt, reuse an already loaded API, retire failed/incomplete scripts and fence late events. Surface fixed local verification failure categories through existing client errors. Preserve strict Siteverify, grants, cancellation and operation boundaries. Prove the load-failure/retry regression, cancellation/late callbacks, real prepared-photo admission with model dispatch intercepted, then relevant repository gates. Chrome-specific root cause remains unverified until its new message is observed.

Owner follow-up: the URL is correct but Continue is disabled, and owner requests checking process collision with another repository. Actual port/ancestry/public-config proof finds Roomedy alone on4320/4321; ClipBuilder uses3000/4000/4200 and is untouched. The shared validation build caused normal backend watcher restarts. Intake's mount-only availability check can permanently retain a transient failure. Expand the exact allocation above for a deliberate Continue availability recheck, preserving photos and rejecting unavailable/aborted checks before any admission. No background retry or extra provider request.
