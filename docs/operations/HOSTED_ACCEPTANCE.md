# Roomedy hosted releases — 21 October 2026

## Current landing update and paid activation

**Deployed and bounded live cases verified.** [Open Roomedy](https://roomedy-frontend-860563209111.europe-west1.run.app). Owner accepted the final BM fade and explicitly authorized the checkpoint, then deployment with paid mode on. BM committed `3c30318` after a fresh1,043-test/64-file root gate/all builds. [Current exact manifest](landing-paid-candidate-2026-10-21.json), [17-path allocation](../commit-plans/RM-020.md), [receipt](../validation/RM-020.md), [later security disposition](../security/remediation-plan.md).

Source-only input `d43a2d63db478f2fed976a743b02c69d1c8fdc14fa8aebeaffbac67874f655c0` plus90 freshly extracted prior public files yields377-input release `aba8aff03fbfff4d53da81135b62f62e316ad5d887ba0c3d3250de5468f3e08b`. Current Linux pair passes all nine probes and97 actual HTTP assets; independent current-source/Docker-image verification passes. Original audit/first-release manifests below remain dated evidence, not current-worktree proof.

| Service | Actual ready revision / traffic | Published immutable digest |
| --- | --- | --- |
| `roomedy-frontend` | `roomedy-frontend-00002-kjn` /100% | `sha256:c7bacbacaaa99b82cdbb31ed0051905a1967f3b54ada70edcc5fe54c86cc566f` |
| `roomedy-backend` | `roomedy-backend-00003-f8t` /100% | `sha256:a98f0fd3aa8ce7f97737dd4d6bb35dfd4f62fc4a37b41ddb4cc28bce47ef10e7` |

Registry remains `europe-west1-docker.pkg.dev/roomedy/roomedy/{frontend,backend}`. Actual digests were observed after publication. Canonical frontend and fixed backend audience/origin, dedicated runtime accounts, version1 secret references, public frontend/IAM-private backend and gen2/1CPU/512MiB/concurrency4/max1/min0/120s remain verified. Backend is `FAKE_MODE=false`, `PAID_DEMO_ENABLED=true`; public readiness is `live-ready`, manual/recognition/assistant true and simulation false. Anonymous backend health/mutation still return403. No local env, secret value, account budget, DNS/domain, unrelated IAM/default, dependency or Git push changed.

No-provider HTTPS probes pass ten expected page/API cases, all97 current/retained public assets with exact byte/hash matches and one worker. API no-store/nosniff/release headers and foreign-origin/query/method/stale-release/malformed-input rejection remain. Hosted desktop observations show text fading immediately while room status is loading, centered copyx372.5 at1265px usable width, then actual prepared house/left copyx89.59. Existing header remains divider-free.

Economical actual browser cases: one explicit four-built-in-photo recognition and one contextual Medy request; no retry or extra corpus. Quiet verification succeeds without an interactive challenge. Recognition opens the editable studio with Medy initially selected; the bed and bedside drawers are separate and near the wall in actual3D/2D. Room/furniture dimensions remain unknown and illustrative, with truthful measurement guidance; no scale/fit confirmation was invented. Medy returns useful warm/calm guidance grounded in the estimated palette and existing pieces, plus “Check what’s missing”/“Keep it simple” quick replies. Safe backend diagnostics record two completed operations, each one provider round; assistant stage is provider. Token/account billing totals were not collected. These observations are bounded cases, not broad accuracy, geometry or assistant-tool quality certification.

A first backend attempt `00002-7p9` failed startup because PowerShell expanded an unquoted comma env argument into a single malformed release value. The startup guard rejected it before traffic moved; the old revision continued serving. Corrected deployment uses a structured non-secret env file and explicit original secret refs, with the same verified image and no app/test change. Corrected backend was ready before frontend deployment. Temporary3D loading/fallback snapshots settled into the actual scene; no new source correction was justified. The only runtime source change is the approved landing CSS.

SEC-001 remains fixed. **SEC-002 remains unresolved account-wide funding/privacy evidence**: the later direct owner instruction supersedes the earlier paid-off disposition, but does not establish an enforced funded cutoff/retention setting. Existing process/rate/instance bounds and Google alerts are not a lifetime money cap. Interactive challenge fallback, full held-out funded corpus, hosted AI proposal/Apply/Undo corpus, native concurrent peak/sustained capacity and named physical/assistive cases remain unperformed. Managed HTTPS is used; custom domain/DNS remains deferred. Exact limits and the original recommendation remain visible in security records.

Previous compatible pair `frontend00001-jsx/backend00001-zxp` with release8472b3db and paid=false remains the rollback baseline below. Its90 public files are retained in the new image and byte-verified. Preserve paired versions/configuration and130minute retention after last old traffic. No operator rollback switch was exercised; the platform's failed-start traffic protection was actually observed. Screenshots/safe metadata/probes remain ignored under `.release/RM020-update-20261021`.

## Original first release — historical paid-off scope

**Deployed and verified for the paid-off scope.** [Open Roomedy](https://roomedy-frontend-860563209111.europe-west1.run.app). Landing, manual studio, 2D/3D, selection, rotation and Undo work on this hosted candidate. Medy opens initially. Public samples remain visible and can be prepared locally. Recognition and provider-backed conversation are disabled; authored local guidance and manual commands remain available. This is not hosted paid-flow acceptance.

[Sanitized hosted manifest](hosted-candidate-2026-10-21.json), [execution receipt](../validation/RM-020.md), [allocation](../commit-plans/RM-020.md), [accepted local candidate](release-candidate-2026-10-21.json), [security dispositions](../security/remediation-plan.md).

## Exact deployed pair

Project `roomedy` / `860563209111`, region `europe-west1`, registry `europe-west1-docker.pkg.dev/roomedy/roomedy`. Runtime source is commit `28d451f2b147de394afb302b490bb66aa2c15459`, local handoff `bf898b1`, input/release SHA `8472b3dbfbbaf6c72eeac2730749b93118e1177b1c5bc3cfd5b67d26c8e30027` across 287 inputs. No runtime input changed during hosting.

| Service | Ready revision / traffic | Immutable registry image |
| --- | --- | --- |
| `roomedy-frontend` | `roomedy-frontend-00001-jsx` / 100% | `frontend@sha256:efeea7acf23dd582bf74af75e1995beecdc7d687192492c269af55a1525dfb4f` |
| `roomedy-backend` | `roomedy-backend-00001-zxp` / 100% | `backend@sha256:3736588f31baebba14fb385a05834b42ec0cfb3c162f0c9939d7d340ae5fc4b9` |

The full registry prefix above applies to both images. Registry digests were observed after publication, not inferred from local IDs. This Docker engine reports matching local IDs and registry digests for this pair; the records preserve the actual observations.

Canonical public origin is `https://roomedy-frontend-860563209111.europe-west1.run.app`. The also-assigned frontend status URL is `https://roomedy-frontend-fbdqwlfulq-ew.a.run.app`; it is not the selected mutation origin. Backend bridge audience/origin is its actual status URL `https://roomedy-backend-fbdqwlfulq-ew.a.run.app`. Assigned URL metadata confirms the deterministic canonical frontend URL. Both apps use that exact public origin and release SHA; frontend uses `gcp-metadata` identity. Managed HTTPS is working; no custom domain/DNS was changed.

## Actual identity and configuration

The frontend is public through its service-level `allUsers` invoker binding. The backend has no anonymous invoker; only the dedicated frontend runtime identity was granted service-level invocation. Both have ingress `all`, so backend privacy is verified IAM enforcement, not a claim of private network ingress. Anonymous backend health and admission requests actually return 403. Frontend health/config/ready reach the backend using the actual metadata-issued audience-bound service identity.

Runtime accounts are `roomedy-frontend@roomedy.iam.gserviceaccount.com` and `roomedy-backend@roomedy.iam.gserviceaccount.com`. Backend has per-secret Secret Accessor for version-1 references to `OPENAI_API_KEY`, `ROOMEDY_BRIDGE_SECRET`, `TURNSTILE_SECRET_KEY`, `TURNSTILE_SITE_KEY`. Frontend has bridge-secret access only. Secret values were never read, printed or committed; no downloaded account key or broad project-level secret/invoker grant was created. Other existing IAM bindings were preserved.

Effective settings on both ready revisions: gen2, 1 CPU, 512 MiB, HTTP concurrency 4, maximum instances 1, minimum 0, request timeout 120 seconds, port 8080. These are provisional bounded settings, not native peak-capacity or monetary-cap evidence. Backend is `FAKE_MODE=false`, `PAID_DEMO_ENABLED=false`. Public config reports live mode, manual true, recognition/assistant/simulation false. The shared two-hour guest lifetime and local semantic recovery policy remain.

Only required Run/Artifact Registry/IAM APIs and the named registry, services and runtime identities were added. Every project-scoped cloud command explicitly used `--project=roomedy`; the unrelated global default was preserved. Docker credential-helper configuration was isolated under ignored `.release/RM020`; global Docker configuration was not edited. No Cloud Build, domain purchase, DNS, Turnstile configuration, Git push or paid-provider call occurred.

## Performed checks

| Check | Actual outcome |
| --- | --- |
| Before frontend publication | Anonymous frontend/backend 403; operator-authenticated frontend 200; frontend-to-backend health/config/ready 200 |
| Public pages and fixed bridge | Landing/demo and health/config/ready 200; API no-store/nosniff and exact release header |
| Boundary rejection | Foreign query 400, wrong release 409, wrong method 405, foreign mutation Origin 403, same-origin malformed admission 400 |
| Private backend | Anonymous health and admission both 403 |
| Public resources | All 90 current assets returned 200 with exact byte counts/SHA-256, including one actual worker; no filesystem-only inference |
| Real browser entry/photos | Landing and source choices render; all four samples visible in live mode; Use example photos prepares four previews without processing; useful unavailable/manual continuation copy |
| Real browser studio | Furnished manual room, welcome/Skip, default Medy selected, actual 3D furniture and 2D plan, all six finish choices, shelf rotation 90→180°, Undo restores 90° and disables Undo; 3D return works |
| Assistant with paid master off | Unavailable status stays visible; authored local advice and contextual quick replies work without a provider call; no model-quality inference |
| Local evidence retained | 1,043 tests/64 files and all root gates/builds; 70 focused security regressions; nine Linux criteria and native SEC-001 before/after retest |

The app-browser test-photo leave confirmation temporarily stalled automation. It cleared on the next observation; the same tab then completed manual/editor checks. An intermediate 3D fallback/loading state also settled into the actual rendered studio. Neither was treated as an application defect or solved by changing application code. Screenshots and safe metadata/probe outputs remain ignored under `.release/RM020`.

## Sharing decision and remaining conditions

The managed URL is available for the manual/editor demo and local sample preparation. Paid recognition and provider-backed Medy stay off. SEC-001 is fixed in the deployed source with native retirement proof; SEC-002 remains the selected paid-off operational hold. Before paid activation, configure the exact challenge hostname/site-secret pairing and public origin, verify actual challenge binding, enforceable provider funding/outstanding exposure and account privacy/retention, then run a separately authorized bounded hosted live case. Budget alerts, existing secrets and maxInstances 1 do not establish an enforced spend cutoff.

The owner deferred domain purchase/Turnstile hostname setup. Full held-out funded evaluation, actual hosted paid upload/advice/proposal/Apply, near-limit native concurrent memory, sustained load/cold-start measurements, named physical/assistive cases and a prior-revision rollback exercise remain unperformed. Historical local live-photo/Medy results are bounded evidence, not substituted hosted results. No broad security, fit, privacy-compliance, availability or accuracy guarantee is made.

This is the first public pair; there is no previous public release to roll back to. The two exact revisions above are the future compatible rollback baseline. Preserve both services/version rules together, and retain public chunks/workers for two hours plus ten minutes after the last old-revision traffic on future rollouts. [Runbook](rollout-and-rollback.md).
