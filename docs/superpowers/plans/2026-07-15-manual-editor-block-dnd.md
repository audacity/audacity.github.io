# Manual Editor — Block Drag-and-Drop Reordering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Notion-style block reordering: hovering a block shows a grab handle (⋮⋮) in the left gutter; dragging it moves the whole block (with its children — a Callout moves with its body, Tabs with its tabs) to a new position shown by a drop indicator. Plus keyboard reordering: **Alt+↑ / Alt+↓** moves the block containing the cursor up/down.

**Architecture:** Two tasks. (1) Pure, testable block-move commands (`moveBlockUp`/`moveBlockDown` acting on the top-level block containing the selection) + an `Extension` binding Alt-ArrowUp/ArrowDown — fully TDD-able headlessly. (2) The official `@tiptap/extension-drag-handle-react` (v3.27.4, public npm — same version as our stack) wired into the editor with a styled gutter handle; drop indicator via StarterKit's built-in Dropcursor; browser-verified by the controller.

**Tech Stack:** `@tiptap/extension-drag-handle-react` (+ whatever peer deps it declares — check `node_modules` after install), existing TipTap v3 stack. No schema changes (parity test untouched).

## Global Constraints

- Bun; Conventional Commits; TypeScript strict. Do NOT modify `src/mdx` or `src/adapter`. Schema parity test passes unchanged (drag/keymap extensions add no nodes/marks).
- "Block" = the **top-level node** (direct child of `doc`) containing the cursor/pointer: paragraphs, headings, lists (whole list), code blocks, admonitions, tabs, preserved blocks, images. Children always travel with their parent. (Reordering _within_ an admonition body or between nesting levels is out of scope for v1 — a dragged block drops at top-level positions.)
- Keyboard: Alt+ArrowUp / Alt+ArrowDown. Must not fire inside code blocks' own Alt-arrow behaviors (none exist in StarterKit — verify) and must be a no-op at the first/last block (no wrap, no error). Selection/cursor stays with the moved block.
- Drag: handle appears on hover near the block's left edge, styled to match the app (subtle grey ⋮⋮, `cursor: grab`); dragging shows ProseMirror's dropcursor (style it visibly — 2px indigo line); dropping moves the node (PM native move semantics — no duplication, no loss). Autosave must fire after a drop (it's a doc transaction — verify via the existing update listener, no new wiring expected).
- Node views (Admonition/Tabs/Preserved/Shortcut) must remain fully functional after wiring (the drag-handle extension wraps/decorates — regression-check nodeviews tests).

---

### Task 1: Block-move commands + keyboard reordering

**Files:**

- Create: `manual-editor/src/app/blockMove.ts` (commands + `BlockReorder` extension)
- Test: `manual-editor/src/app/blockMove.test.tsx`

**Interfaces:**

- `moveBlock(editor, dir: -1 | 1): boolean` — finds the top-level block containing `selection.$from` (depth-1 ancestor), computes its sibling in `dir`, and dispatches a transaction that moves the block before/after that sibling (delete + insert with mapped positions, or `tr.delete` + `tr.insert` at the mapped target). Returns false (no-op) at the boundary. Selection is mapped so the cursor stays inside the moved block.
- `BlockReorder` = `Extension.create({ addKeyboardShortcuts: { "Alt-ArrowUp": () => moveBlock(editor, -1), "Alt-ArrowDown": () => moveBlock(editor, 1) } })`.

- [ ] TDD `blockMove.test.tsx` (real headless editor with `buildAppExtensions()` — note it will not include BlockReorder until Task 2 wires it; construct with the extension added explicitly here): docs with [para A, callout B, para C]:
  - cursor in C + up → order [A, C, B]; cursor still in C's text.
  - cursor in A + up → no-op (returns false, doc unchanged).
  - cursor in B(callout body) + down → the WHOLE callout moves below C with its children intact.
  - a list (bulletList with 2 items) moves as one block.
  - undo restores the original order (history integration).
- [ ] Implement; full `bun test` green; `bun run typecheck` clean.
- [ ] Commit: `feat(manual-editor): keyboard block reordering (Alt+arrows)`

### Task 2: Drag handle + drop indicator

**Files:**

- Modify: `manual-editor/src/app/editorExtensions.ts` (add BlockReorder), `manual-editor/src/app/Editor.tsx` (render the `<DragHandle>` React component around/next to `EditorContent` per the extension's v3 API), `manual-editor/src/app/editor.css` (handle + dropcursor styles)
- Test: extend `manual-editor/src/app/editorExtensions.test.ts` (parity still holds; extensions registered), plus keep all nodeviews/autosave tests green (regression)

**Interfaces:**

- Install `@tiptap/extension-drag-handle-react@3.27.4` (public npm; it may pull `@tiptap/extension-drag-handle`, `@tiptap/extension-node-range`, floating-ui — accept them). READ the installed package's README/types in node_modules for the v3 component API (`<DragHandle editor={editor}>{children}</DragHandle>` with positioning options) — do not assume.
- Handle content: a ⋮⋮ glyph button, `data-testid="drag-handle"`, `aria-label="Drag to move block"`, `cursor: grab` / `grabbing` while dragging.
- Dropcursor: StarterKit bundles it — configure color/width via StarterKit options in `editorExtensions.ts` if exposed (`dropcursor: { color: "#4f46e5", width: 2 }`) else CSS.
- CSS: handle hidden until block hover (the extension manages visibility/position — style opacity/transition to match the sidebar's subtle-until-hover affordances); ensure it doesn't overlap the editor text (the `.editor-scroll` padding gives gutter room; adjust `padding-left` if needed).

- [ ] Wire + style; verify headlessly what's verifiable (extensions present, parity, nodeviews/autosave suites green); full `bun test` green; typecheck; build.
- [ ] Commit: `feat(manual-editor): notion-style drag handle for block reordering`
- [ ] Controller browser verification: hover shows handle on paragraphs AND admonitions/tabs/preserved; drag a paragraph below a callout (dropcursor visible, order changes, no duplication); drag a whole callout; Alt+↑/↓ moves blocks; autosave fires after a drop ("Saved draft ●"); undo restores; node views still interactive (tab switching, admonition type select). Then push → deploy.

---

## Self-Review

- Spec coverage: mouse drag (official ext), keyboard alternative, children-travel-with-parent, boundaries, drop indicator, autosave/undo integration, node-view regression. ✓
- Placeholder scan: the one deliberately-open point is the exact v3 `<DragHandle>` component API — resolved by reading the installed package (instructed), not assumed. ✓
- Type consistency: `moveBlock`, `BlockReorder`, `DragHandle` names consistent across tasks. ✓
- Scope: app layer only; no schema/adapter/engine changes. ✓
