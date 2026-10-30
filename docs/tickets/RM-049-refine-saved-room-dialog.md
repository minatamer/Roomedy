# RM-049 — Refine the saved-room dialog

**Status: complete locally.**23 existing recovery tests, scoped format/lint/frontend types/production build and native desktop/phone/narrow/short/manual/photo/Continue/Escape/start checks pass. Owner visual/physical acceptance remains pending; no staging/commit/provider/other-app action.

30 October2026. Direct owner asks to improve the recovery-choice dialog shown in their screenshot. Use a compact warm Roomedy composition with a decorative room mark, clear saved-room identity, readable title/copy and full-width capsule actions. Continue saved room is the primary cocoa action; Start a new room / Start with photos is secondary. Clearly explain that starting fresh replaces the saved room in this tab.

Give this entry dialog its own CSS Module: existing studio-scoped button styles do not reach it. Reuse global button/theme tokens, retain the native modal, safe Escape→Continue, initial primary focus, focus containment and the unchanged onContinue/onStart callbacks. Support phone/narrow/short screens with44px or larger targets, bounded scrolling and no horizontal clipping. No storage/session/recovery/route, global/editor dialog, AI or other-app behavior change.

Verify scoped format/lint/frontend types/build, relevant existing recovery tests and a read-only final review. Native production-path checks should cover manual/photo variants, Continue/Escape/secondary callbacks, keyboard focus and desktop/phone/narrow/short presentation in a disposable in-app tab. No live/provider operation, Chrome, env change, service restart, dependency, delegation or Git/hosted mutation. Preserve current Roomedy and ClipBuilder instances. Owner visual/physical acceptance stays pending. [Allocation](../commit-plans/RM-049.md), [receipt](../validation/RM-049.md).

## Owner CTA consistency amendment —30 October2026

The owner accepts the dialog direction and requests matching internal CTA design. Both actions use identical typography, height/padding, left-aligned labels and18px trailing stroke icons in the same column. Primary cocoa and secondary outlined hierarchy remains. Reuse all native labels/focus/callbacks and keep the refinement within the existing recovery component/stylesheet. [Follow-up evidence](../validation/RM-049.md#cta-consistency-follow-up--30-october2026).
