# Paid-on deployment receipt —4 November 2026

Direct owner instruction: stage and commit the compatibility fix, deploy all current changes and keep paid mode on. [Current immutable candidate](../operations/hosted-candidate-2026-11-04.json), [hosted history](../operations/HOSTED_ACCEPTANCE.md), [handoff](../operations/DEPLOYMENT_PREPARATION_HANDOFF.md).

## Exact implementation and authorization

The six previously allocated/validated files are committed as **`f8859ec30a590f4ac57353501ce80e04a28ab60e` —RM-103: preserve published catalogue metadata**. Git staging, normalized blobs, parent ancestry, raw validated hashes and clean worktree were verified. The original manifest retains the previous hosted bytes; the current inventory moves byte-for-byte to `manifest-v2.json`, with preparation/check/documentation owners updated. No other application/test/asset/config/dependency byte changes during publication/deployment. These five evidence paths are separately allocated in the ignored deployment documentation plan.

Source:410inputs/4,741,987bytes, SHA256 `54589a8b67463633638aa843bebad8a8b6e6be095e50e17fed3f8decccd204a5`. With97retained prior public files:507inputs/9,730,901bytes, exact release **`2685852fc145c5ec3a62de87c70e778a49c1712dcf0f97e34dea5996d8211a6a`**. Linux proof SHA256 `8361600b32b760a6f21995ebb23bf4a99db08d89a298effcf23f28524b42a023`. The9actual runtime probes, isolated memory/stale-client/manifest checks, independent current-source/image verification and prior documented2043-test/124-file split coverage/both builds bind this exact candidate. No redundant test/build rerun after its byte-preserving commit or these documentation-only records.

## Publication and rollout

Active account access and explicit project `roomedy`/860563209111/europe-west1 are verified before mutation. Existing service/IAM/environment metadata supplies the exact paid-on rollback pair. Docker uses a separate ignored credential-helper config; no global project or Docker credential setting is changed and no secret value is fetched. Verified immutable parent image digests are published to the existing Roomedy registry, independently observed and matched to the local proof. Cloud Run's resolved Linux/amd64 child digests are checked against the published OCI manifest chains; both identities are in the candidate.

Both new revisions are staged without main traffic. Cloud Run's un-routed backend is initially retired, so temporary tagged test routes activate the staged revisions. Direct authenticated private-backend health/readiness/configuration and tagged frontend page/catalogue-hash GETs pass. Canonical traffic remains on the old pair while staging. Backend traffic moves first; the new frontend's real metadata-authenticated bridge must return current `live-ready` before frontend promotion. Then both new revisions serve100%, canonical readiness is verified, and temporary test tags are removed.

- Backend:`roomedy-backend-r20261104-2685852`; frontend:`roomedy-frontend-r20261104-2685852`.
- Backend `FAKE_MODE=false`, `PAID_DEMO_ENABLED=true`; public mode `live`, AI `live-ready`, simulationfalse. Recognition, Medy, sourcing and manual capabilities remain available.
- Keep source-pinned `gpt-6-luna`, canonical origins, service accounts, original secret references/version1, IAM bindings, gen2/1CPU/512MiB/concurrency4/120s, governing revision maximum1/service maximum20.
- Prior paid-on rollback pair retained: backend`roomedy-backend-00003-f8t`, frontend`roomedy-frontend-00002-kjn`, with their exact images/configuration in the manifest. No traffic rollback was needed or performed.

## Actual hosted validation

All15page/API/guard checks pass, including canonical pages, no-store/nosniff/current release headers, live readiness/configuration, query/method/origin/invalid-input rejection and old-release fences across admission/assistant/sourcing/recognition/product-photo routes. Anonymous direct backend health and POST admission both return403. All146public file responses are byte/hash-equal to the actual new image, including the emitted worker, current/legacy catalogue manifests and all97retained prior files.

A synthetic proof-null admission returns an input-bound `roomedy-ai` challenge with a configured public site key. **No real challenge token is submitted, no grant is consumed and no paid provider operation is called.** An initial raw4000px fixture was correctly rejected by the2048px prepared-input policy; a locally schema-validated64px synthetic JPEG then verifies the actual challenge envelope. The synthetic input/token values are not committed. Real browser challenge completion and live model/merchant results are not inferred from readiness.

The existing local app remains untouched by cloud deployment; manual restart/local environment edits are not performed. Main cloud URLs and public/private roles remain unchanged. Only the intended new revisions/images/release bindings/traffic and temporary tags are operated on. No domain/DNS, dependency, source, IAM grant, secret-version/value, Git push or new security-audit change occurs. The prior Nov2audit/Nov4public-source review remains dated evidence under the owner's decision not to repeat the audit.

## Limits and future compatible rollout

The prior97public files are retained in the new image for at least the fixed130minute old-client compatibility requirement after last old-revision traffic; no asset removal is selected. A future release must refresh the bounded snapshot when its130minute freshness guard expires and retain this current public set. The isolated two-job/six-photo/2048px/6MiB native-decoder scenario peaks at301.6MiB/512MiB with no OOM events; it does not certify worst-case codecs, browser/GPU, full-server or hosted peak capacity. Deployment GETs do not manufacture owner physical/merchant/model-quality/accessibility acceptance, and canonical build-phase approvals remain untouched.

The final recorded UTC verification time is `2026-11-04T18:10:20.265996+00:00`. CLI/registry/staging/promotion/public-probe/final-state evidence stays ignored under `.release/deploy-20261104-2685852`; no credentials, tokens, owner room content or raw provider payloads are included in these public records.
