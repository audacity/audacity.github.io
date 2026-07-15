# Manual Editor — Notion-Style Slash Command Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Replace the floating bottom toolbar with a Notion-style slash command menu: typing `/` in the editor opens a filterable, keyboard-navigable popup of block commands (basic blocks + manual blocks) at the caret. Text marks move to keyboard shortcuts (⌘B/⌘I/⌘E built-in; add ⌘K for links). The floating toolbar is removed.

**Architecture:** Two tasks. (1) Extract the toolbar's insert/turn-into logic into a shared, testable `insertCommands.ts`; build the slash machinery on `@tiptap/suggestion` (a `SlashCommand` extension configured with char `/`, filtered items, and a command that deletes the typed `/query` then runs the insert) plus a React `SlashMenu` popup positioned at the caret rect, with full keyboard nav. (2) Wire it into the editor extensions, add the ⌘K link shortcut, remove the Toolbar, migrate tests, and style the menu.

**Tech Stack:** `@tiptap/suggestion` (+ `@tiptap/react`'s `ReactRenderer`), existing TipTap v3 stack. No schema changes — the slash extension is plugin-only, so the adapter/schema parity is untouched.

## Global Constraints

- Bun; Conventional Commits; TypeScript strict. Do NOT modify `src/mdx` or `src/adapter` (no schema/node changes — parity test must keep passing unchanged).
- Menu content (two groups):
  - **Basic blocks:** Text (paragraph), Heading 2, Heading 3, Bulleted list, Numbered list, Code block — each with its markdown-shortcut hint shown right-aligned (`##`, `###`, `-`, `1.`, ` ``` `) since StarterKit input rules already support those.
  - **Manual blocks:** Callout, Note, Pitfall, Tip, Best practice, Tabs, Shortcut — same insert semantics as the old toolbar (admonition with correct `component`/`type` + empty paragraph; tabs with 2 starter tabs; shortcut with `client:load` + `keys` attrs).
- Slash behavior: menu opens on `/` (empty query shows everything); typing filters by fuzzy/starts-with match on label; ↑/↓ move selection (wrapping), Enter/click executes, Esc closes; selecting an item deletes the `/query` text from the doc before inserting. When the query matches nothing, show "No results" (Esc/continue typing closes naturally per suggestion behavior).
- Marks: rely on StarterKit's built-in ⌘B/⌘I/⌘E. Add **⌘K**: prompts for a URL (same `window.prompt` UX the toolbar used) and toggles a link on the selection; on a collapsed selection it does nothing. Removing a link = ⌘K on linked text with empty prompt input.
- The floating Toolbar component is REMOVED (component, CSS, and its render in `Editor.tsx`). Its tests are migrated to cover the same behaviors through the new homes (insertCommands unit tests + slash integration tests), not deleted wholesale — every insert behavior asserted in `Toolbar.test.tsx` must have an equivalent assertion afterwards.
- Keep `data-testid`s stable where reused; new ones: `slash-menu`, `slash-item-<id>`.

---

### Task 1: Shared insert commands + slash extension + menu UI

**Files:**

- Create: `manual-editor/src/app/insertCommands.ts` (extracted from `Toolbar.tsx` — read it first)
- Create: `manual-editor/src/app/slash/slashItems.ts` (the item registry: id, label, group, hint, keywords, `run(editor)`)
- Create: `manual-editor/src/app/slash/SlashCommand.ts` (TipTap extension wrapping `@tiptap/suggestion`)
- Create: `manual-editor/src/app/slash/SlashMenu.tsx` (popup list component + suggestion `render()` glue via `ReactRenderer`, positioned from `clientRect`)
- Test: `manual-editor/src/app/insertCommands.test.ts`, `manual-editor/src/app/slash/slashItems.test.ts`

**Interfaces:**

- `insertCommands.ts` exports: `insertAdmonition(editor, component, type?)`, `insertTabs(editor)`, `insertShortcut(editor)`, `setParagraph(editor)`, `setHeading(editor, level)`, `toggleBulletList(editor)`, `toggleOrderedList(editor)`, `setCodeBlock(editor)` — pure functions over the editor instance, byte-equivalent behavior to the old toolbar handlers.
- `slashItems.ts` exports `SLASH_ITEMS: SlashItem[]` and `filterSlashItems(query: string): SlashItem[]` (case-insensitive; match on label or keywords; preserves group order).
- `SlashCommand.ts` exports `SlashCommand` extension (configure with `{ items, renderer }` or self-contained); uses `@tiptap/suggestion` with `char: "/"`, `allowSpaces: false`, `startOfLine: false`; `command({editor, range, props})` deletes `range` then `props.item.run(editor)`.
- `SlashMenu.tsx` handles suggestion lifecycle (`onStart/onUpdate/onKeyDown/onExit`), renders a fixed-position portal at the caret rect, grouped sections, active-index highlight, wrapping ↑/↓, Enter/click/Esc.

- [ ] Install: `cd manual-editor && bun add @tiptap/suggestion` (match the installed TipTap v3 minor).
- [ ] TDD `insertCommands.ts`: port the exact insert logic from `Toolbar.tsx`; unit tests mirror the existing Toolbar tests' assertions (admonition shape incl. child paragraph, tabs with 2 tabs, shortcut attrs incl. `client:load`) via a real headless editor (same harness pattern as `Toolbar.test.tsx`).
- [ ] TDD `slashItems.ts`: registry covers every Global-Constraints item with group + hint + keywords (e.g. Callout keywords: callout, info, warning, admonition); `filterSlashItems("call")` → Callout; empty query → all, grouped order stable; unknown query → [].
- [ ] Implement `SlashCommand.ts` + `SlashMenu.tsx` (keyboard nav logic in the component; suggestion glue per TipTap v3 docs — `ReactRenderer` + manual fixed positioning from `props.clientRect()`, no tippy dependency).
- [ ] Full `bun test` green; `bun run typecheck` clean. Commit: `feat(manual-editor): slash command registry and menu machinery`

### Task 2: Wire in, ⌘K links, remove toolbar, migrate tests, style

**Files:**

- Modify: `manual-editor/src/app/editorExtensions.ts` (add SlashCommand + a small `LinkShortcut` keymap extension), `manual-editor/src/app/Editor.tsx` (drop Toolbar render), `manual-editor/src/app/editor.css` (slash menu styles; remove toolbar styles)
- Delete: `manual-editor/src/app/Toolbar.tsx`, `manual-editor/src/app/Toolbar.test.tsx` (after migrating assertions)
- Test: `manual-editor/src/app/slash/slashIntegration.test.tsx` (headless editor + simulated suggestion flow: typing `/call` + Enter inserts a Callout admonition and removes the `/call` text; Esc closes; ↑/↓ selection moves)

**Interfaces:**

- `editorExtensions.ts`: `buildAppExtensions()` gains `SlashCommand` + `LinkShortcut` (a tiny `Extension.create({ addKeyboardShortcuts: { "Mod-k": ... } })` that prompts and toggles the link, no-op on empty selection). Schema parity test must still pass (extensions add no nodes/marks).
- CSS: `.slash-menu` styled like the app's dialogs (white card, shadow, rounded, ~280px, max-height with scroll, group headers like the sidebar's section headers, hint text right-aligned muted, active row highlighted).

- [ ] Wire extensions; remove Toolbar from `Editor.tsx`; delete component + CSS after migrating every Toolbar test assertion into insertCommands/slash tests.
- [ ] Integration test per above (drive the suggestion plugin via real keystrokes/transactions in the headless editor, or invoke the extension's command path directly where key simulation is impractical — but at minimum prove: menu items execute correct inserts AND the `/query` text is removed from the doc).
- [ ] Full `bun test` green; `bun run typecheck` clean; `bun run build` succeeds.
- [ ] Commit: `feat(manual-editor): notion-style slash menu replaces the floating toolbar`
- [ ] Controller: browser verification (type `/`, filter, keyboard nav, insert Callout/Tabs/Shortcut, ⌘B/⌘I/⌘K, no toolbar remnants), then push → deploy.

---

## Self-Review

- Spec coverage: shared commands, registry+filter, extension, menu UI, keyboard nav, ⌘K, toolbar removal with test migration, styling. ✓
- Placeholder scan: insert semantics defined by reference to existing Toolbar code (read-first, byte-equivalent) — concrete, not TBD. Suggestion-glue implementation details deliberately delegated to TipTap v3's documented pattern. ✓
- Type consistency: `SlashItem`, `SLASH_ITEMS`, `filterSlashItems`, `insert*`/`set*`/`toggle*` names used consistently across tasks. ✓
- Scope: app-layer only; no schema/adapter/engine changes; parity test untouched. ✓
