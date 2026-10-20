# RM-015AY — Medy identity and chat presentation

20October2026, clean parent db4348b; [ticket](../tickets/RM-015AY-refine-medy-identity-and-chat.md), [19-path allocation](../commit-plans/RM-015AY.md). Owner requests Medy/sparkle, right visitor text and plain left assistant replies, with older conversation scrollable. Actual visual approval remains pending.

## Implementation and scope

One small pure decorative four-point currentColor SVG is shared by studio header, navigation and landing example. All product-facing frontend casing (including ARIA/composer/tour/landing CTA), fake greetings and real instruction now say Medy. The studio icon is18px and navigation14px, aria-hidden/focusable=false. Prompt revision medy-room-5 tracks the exact identity-only string change; independent source comparison against db4348b confirms no other backend instruction or shared fake/compiler change. Technical Medy types/identifiers, command scope, provider/configuration/mode, session/storage and lifecycle stay unchanged.

Visitor messages use fit-content right alignment/max88%, right-aligned text and warm bubble. Replies are full useful width, left-aligned and transparent, without padding/background bubble. Existing semantic articles/cards/suggestions/proposal actions, pre-wrapped text and finite messageReveal motion remain. Landing's illustrative exchange matches the real chat. No new UI controls or dependency.

Retain existing history owner/context/byte bounds and latest-message scrolling; flex children now cannot shrink instead of overflowing. The log is keyboard-focusable with visible3px outline, while the composer remains outside it. Existing80-message/256KiB retained-history ceilings are unchanged; no new persistence or infinite history.

## Actual hot-reloaded observations

Fake-ready app on4320/private4321, native disposable furnished room; user tab untouched. Empty/welcome, actual hi and longer request inspected. Desktop1280×720: Medy and shared sparkle visible in heading/navigation; short hi bubble33.34×39.19 right edge1242, text-align:right, beige225/210/189; assistant width287.59, text-align:left and transparent rgba0/0/0/0. Screenshot RM-015AY-simple-chat.png inspected.

Longer multiline visitor request wraps in a bounded right bubble; actual fake palette proposal has useful full-width Room/Open shelf cards/changes/Apply/Cancel inside plain reply. Cancel retires controls and leaves current unchanged. More actual UI greetings/help requests build12 message articles: log373px versus1120px content. Native Home reaches scrollTop0/first hi at194.3 inside log144.3..517.6, with visible focus ring; End reaches747. Screenshot RM-015AY-older-messages.png records retained history. No artificial state/message injection.

Short1280×600: log253px/content1120, Home/End reaches0/867. Settled panel68..600 with scrollTop0/content532; heading88..132.3, composer and44px Send fit. Earlier transient resize geometry was inspected again after it settled; actual RM-015AY-short-history.png shows independent history and composer.

390×844: no horizontal overflow375/375, history489px/content1090 then1461 as real conversation grows; Home reaches0/oldest hi. Actual shelf finish request produces correlated preview→Apply→Undo: Change Open shelf to walnut; focus returns to composer, Undo restores original finish. Filling composer makes Send enabled/44px fully reachable767.6..811.6, textarea681.1..761.6. Actual thanks reply preserves friendly text; older history still scrolls. Screenshot RM-015AY-phone-history.png inspected. Natural page scrolling can place the last composer row below the initial view; focusing it/Send brings it fully into view without trapping history.

320×568: document305/305; log237px versus1653 content, Home0/End1416. Textarea265×80.5 at20/405.6 through486.1 and enabled Send70.16×44 at214.8/492.1 through536.1. Screenshot RM-015AY-narrow-composer.png inspected. Shared body/history/composer remain usable; no clipped horizontal text/actions. Browser error entries empty; test viewport reset and room tab closed.

Landing desktop1280×720 and phone390×844: proper Medy identity/CTA/ARIA, one shared sparkle; visitor right with warm background, reply plain left (LTR start), no horizontal overflow1265/1265 and375/375. Exchange480px desktop/327px phone, existing readable feathered substrate preserved. Screenshot RM-015AY-landing-desktop.png inspected; RM-015AY-landing-phone.png also inspected, with the same plain reply and right visitor bubble. Keyboard focus reached real CTA without navigation/provider action.

These are native Windows/emulated viewport, keyboard/log and actual local fake edit observations, not physical touch/AT, a full tour/viewport matrix, sustained frame/paint/native heap, Linux/hosted or paid/live-model-quality evidence. Existing external and fixed-expiry limits remain. No new static-label/CSS mirror tests for a presentation correction.

## Read-only review

Reviewed all10 executable/style owners against db4348b and the ticket, plus9 allocated documentation owners. Actual source snapshot .release/AY-source-review.json, combined SHA256bc3c1a1f76ecb7c436c619881e9a47592a369fd4968da47f0c0cc0bba2bf6aa4. Existing command/provider algorithms and stricter runtime fences are unchanged. Settled root gate and final identity/closeout recorded below when complete.

Read-only pass1: **Meets ticket; no actionable findings**. Casing, decorative accessible icon ownership, actual reply/user styles including cards/proposals, keyboard scrolling/history bounds, reachable composition and motion are Covered. Empty/welcome, live/unavailable copy and error/progress paths retain existing structure/authority; no fake live quality or complete failure-state browser matrix claimed. Finite retention/lifecycle and existing manual controls/proposals are unchanged. Source/controller ownership, no duplicated history/schema/network owner and exact backend/fake identity-only comparison verified. No source/index edits, extra tests, delegation or paid/live call during the pass; the independent settled gate was already running.

Initial root run passed format/lint/types,7 boundaries and827/829 tests, then stopped before builds: two existing tests hit the unchanged5000ms timeout (design-export graphics-failure cleanup and release actual-input hashing). No assertion/schema/security relaxation or test/config edit. After native browser verification finished and all temporary tabs were closed, both suites passed unchanged:33 tests/2 files in8.31s, .release/AY-timeout-recheck.log. The full settled gate is being repeated on the same source bytes; original log .release/local-apps/run-20261020-ab0cdbf3/AY-check.log retained. No causal performance claim is inferred from this single rerun.

## Final gate and exact checkpoint

Repeated telemetry-disabled pnpm check passes format, lint, all types,7 executable boundaries, exact catalogue/material assets,829 tests/55 files and both builds, with unchanged tests/config/timeouts/source bytes. Final log .release/local-apps/run-20261020-ab0cdbf3/AY-check-complete.log.268 runtime inputs/3,371,633bytes; before/after inventories identical and production BUILD_ID equals4a116cbbfd6943ec50c505f03cf70d47e4ab84793d7c5a9a8f3c5034cfadcfa9. All10 executable/style hashes match the reviewed snapshot after the gate. Production artifact remains distinct from the hot-reloaded development app.

Final read-only19-path closeout: **Meets ticket; no actionable findings**. Initial timeout disposition is confirmed by unchanged focused and complete reruns, without speculative performance/test changes. All allocated paths/current documentation, empty index and local targets checked before exact local checkpoint. Build-state helper returns visual review to awaiting_owner; no owner approval inferred. Q held, guide paused and RM-016 Planned. No key/config/mode, paid/live, delegation, new dependencies/services/ports, push or deploy. Temporary test tabs closed and viewport reset.
