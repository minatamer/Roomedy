# RM-015BN — Device-aware scroll-cue evidence

28 October 2026, base ff11054. [Ticket](../tickets/RM-015BN-use-device-aware-scroll-cues.md), [allocation](../commit-plans/RM-015BN.md). The owner rejects the arrow/circle and selects the previously used mouse/finger cue. Read-only sibling search found the exact pair in Choreograph and the same finger outline in Retailor; no sibling files were edited.

Implemented in the two allocated landing files. The existing SectionScroll button now contains Choreograph's mouse/finger outlines, with Scroll to explore or Swipe up to explore selected solely by the primary coarse-pointer media query. The circle and arrow are removed. Roomedy's cocoa colour, centered normal flow, existing focus outline and48px button are retained. Each small icon demonstration runs twice over4.4seconds and rests; there is no new JavaScript, listener, timer, dependency or renderer. 3D preparation/reveal and CPQ are untouched.

## Actual checks

- Scoped Prettier completes with both runtime files unchanged by formatting; scoped ESLint exits0; frontend `next typegen && tsc --noEmit` exits0. Existing section-scroll regressions pass2tests/1file. No new CSS/SVG/source-mirror tests or full root/build run for this presentation-only correction.
- Actual in-app-browser observations at1366×768,1280×600,390×844 and768×1024 show one mouse instruction, the touch branch hidden,48px target height, zero horizontal overflow, and cue center within0.01px of half the usable width. Cue bottoms616.19/505.03/800/720.58px fit those viewports. The narrow desktop window correctly retains its mouse instruction; resizing is not represented as touch-device emulation.
- The actual screenshot was inspected and saved at `C:/Users/minat/.codex/visualizations/2026/10/28/01a1816d-460f-7202-8b7f-cad5889a78ac/output/roomedy-mouse-cue.png`; companion `roomedy-cue-layout.json` records the four geometry observations. Temporary viewport overrides were reset.
- Native keyboard Enter and mouse click invoke the existing section action, focus `how-title`, and preserve the clean root URL. Existing finite journey/cancellation regressions remain green. The original page was returned to the hero after checks.
- The in-app tab connection initially failed; resetting the tool connection restored access to the same tab. A read-only observation attempted an unavailable DOM animation API; replaced it with supported computed-style observations. No application workaround or additional browser tab/service was created.

## Browser limitation and owner correction

The in-app viewport control resizes a desktop pointer; it does not expose touch/coarse-pointer emulation. An unnecessary desktop Chrome access attempt was not approved, and no Chrome device test ran. The owner then explicitly required that this never prompt or interrupt chat/AFK work again. AGENTS.md now requires the in-app browser, forbids desktop Chrome use/access prompts while it is available, and requires unsupported tests to remain unverified. No further desktop Chrome access was attempted.

The coarse-pointer finger branch is source-reviewed, including the actual sibling path, visible-label exclusivity and shared hit target/action. Actual coarse-pointer rendering, physical-device touch and owner visual approval remain **unverified/pending**. This limit is not a passing emulation claim.

## Read-only validation

Reviewed the selected ticket, both runtime diffs, existing shared action/focus rules and exact documentation allocation. No actionable source finding: both SVGs are decorative, exactly one instruction is exposed by the active media branch, the shared button remains the only interaction owner, motion is finite and settles within the standing five-second policy, and the old circle-specific rules are retired. Required local checks pass within their stated scope; actual touch/owner acceptance remains pending. The browser-rule follow-up is explicitly recorded in root instructions and canonical context.

Local fake-mode services and the hosted release are preserved; no provider call, local env edit, staging, commit, push or deployment. The exact ten allocated files remain available for owner review.
