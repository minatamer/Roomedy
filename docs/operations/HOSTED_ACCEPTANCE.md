# First hosted release — 21 October 2026

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
