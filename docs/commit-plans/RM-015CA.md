# RM-015CA — Solid manual starts, bedroom themes and a guided Medy path

29 October 2026. Direct owner corrects BX: fresh manual rooms need solid colours, white walls, flat concrete-grey floors and wood-toned bed/storage without grain. Add researched shared bedroom theme presets, accessible manual room/furniture selection and a useful Medy-led sequence: theme, furniture, openings, layout. Welcome choices are Show me around, Let's get started and What can you do for me?, with distinct icons. The tour must invoke its actual existing control.

Exact allocation:

- `packages/contracts/src/bedroom-themes.ts`
- `packages/contracts/src/furniture-materials.ts`
- `packages/contracts/src/surfaces.ts`
- `packages/contracts/src/commands.ts`
- `packages/spatial/src/commands.ts`
- `packages/spatial/src/medy.ts`
- `packages/spatial/src/medy-edits.ts`
- `packages/spatial/src/quick-replies.ts`
- `packages/spatial/src/design-opportunities.ts`
- `apps/frontend/src/features/session/entry/manual-room.ts`
- `apps/frontend/src/features/session/controller.ts`
- `apps/frontend/src/features/room-view/surfaces.ts`
- `apps/frontend/src/features/room-view/scene.tsx`
- `apps/frontend/src/features/design-export/scene.ts`
- `apps/frontend/src/features/room-editor/furniture-material-controls.tsx`
- `apps/frontend/src/features/room-editor/room-panel.tsx`
- `apps/frontend/src/features/room-editor/editor.tsx`
- `apps/frontend/src/features/room-editor/bedroom-themes.tsx`
- `apps/frontend/src/features/room-editor/bedroom-themes.module.css`
- `apps/frontend/src/features/assistant/guidance.ts`
- `apps/frontend/src/features/assistant/controller.ts`
- `apps/frontend/src/features/assistant/assistant.tsx`
- `apps/frontend/src/features/assistant/assistant.module.css`
- `apps/frontend/src/features/assistant/chat-icon.tsx`
- `apps/backend/src/assistant/assistant.ts`
- `test/manual-materials.test.ts`
- `test/assistant-guidance.test.ts`
- `test/bedroom-themes.test.ts`
- `docs/tickets/RM-015CA-guide-manual-room-design.md`
- `docs/commit-plans/RM-015CA.md`
- `docs/validation/RM-015CA.md`
- `docs/references/bedroom-themes-2026-10-29.md`
- `AGENTS.md`
- `docs/README.md`
- `docs/tickets/README.md`
- `docs/ROOMEDY.md`

Preserve all16prior dirty BZ paths and their hashes, owner env, other apps, saved/photo/import/recovered appearance, existing services/ports and hosted release. Use a visitor-only bounded atomic theme action so the40-piece room limit still supports one reviewed theme/Undo; model proposals gain no new authority. Per-piece presets use existing material commands. Whole-room themes leave opening colours alone until an explicit request. No paid/provider operation, Chrome, delegation, Git mutation or publication. Read-only research and offline/native in-app review only. Temporary review fixtures must be named here before use and removed before final gates. Canonical progress is updated through the existing build-state helper.

Temporary allocation: `apps/frontend/src/app/manual-theme-review/page.tsx` mounts the actual Editor with an isolated in-memory manual SessionController, blocks all operation POSTs, and never installs recovery/persistence. Remove its source/tab before the settled gate. Screenshots and content-free review proof stay in ignored `.release/runtime/` or this chat's output folder.
