# Manual Editor — Tab Removal, Multi-Block Selection, @Page Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** (1) Remove tabs via an × on the active tab header. (2) Notion-style multi-block selection — Cmd/Ctrl+Click blocks (contiguous or not) to select them, with a floating action bar for batch Turn-into / Duplicate / Delete. (3) `@`-mention page links — type `@`, search manual pages by title, insert an internal link (`[Title](/manual/<slug>)`).

## Global Constraints

- Bun; Conventional Commits; TS strict. NO `src/mdx` or `src/adapter` changes (schema frozen — multi-select is a PLUGIN + decorations, never new node types; links use the existing link mark; parity + corpus-mount suites untouched).
- All destructive actions single-transaction and undoable (⌘Z restores a removed tab / deleted blocks).
- Browser verification is the controller's job (incl. the known hidden-pane rAF shim).

---

### Task 1: Remove tabs (small)

**Files:** `src/app/nodeviews/TabsView.tsx`, `src/app/editor.css`, tests in `nodeviews.test.tsx`/`tabsView` tests.

- The ACTIVE tab's header shows a small `×` (`data-testid="tabs-remove-tab"`, title "Remove tab", appears only on the active header, subtle until hover — browser-tab style).
- Click: if the tabs node has >1 tab → delete the active `tab` node (one transaction), activate the nearest remaining neighbor (prefer same index, else previous). If it's the ONLY tab → delete the ENTIRE tabs block (the group without tabs is meaningless; schema requires tab+ anyway). No confirm — it's one undo step (comment this rationale).
- Tests: remove middle tab of 3 (structure, neighbor activation, single transaction/undo restores); remove last remaining tab → whole tabs block gone; undo restores.

### Task 2: Multi-block selection + batch actions (the big one)

**Files:**

- Create `src/app/blockSelection.ts` — a TipTap Extension wrapping a PM plugin:
  - Plugin state = `DecorationSet` of `Decoration.node(from, to, {class:"block-multiselected"})` over selected TOP-LEVEL blocks (positions auto-remap through transactions via `set.map(tr.mapping, tr.doc)` — free correctness under edits).
  - Commands (extension commands or exported helpers): `toggleBlockSelected(pos)`, `clearBlockSelection()`, `selectBlockRange(fromPos, toPos)` (contiguous fill), and `getSelectedBlocks(editor): Array<{node, pos}>` (read the decoration set, sorted by pos).
  - `editorProps.handleClickOn` (or handleClick) in the extension: **Cmd/Ctrl+Click** on content → resolve the TOP-LEVEL block containing the click → toggle its selection, return true (no caret move). **Shift+Cmd/Ctrl+Click** → contiguous range from the last-toggled block (track lastAnchor in plugin state) to the clicked one. Plain click ANYWHERE (no modifier) → clear selection (and let the click proceed normally). Esc keymap → clear when non-empty (return true), else false.
- Create `src/app/SelectionBar.tsx` — floating bar (bottom-center of `.editor-frame`, above the save pill; `data-testid="selection-bar"`), rendered by `Editor.tsx` when ≥1 selected (subscribe to editor transactions to re-read count):
  - "N blocks selected" · **Turn into**: Text / Heading 2 / Heading 3 / Code — shown ONLY when every selected block is text-convertible (paragraph/heading/codeBlock — lists are out of v1 scope for batch conversion, note in code); applies `setNodeMarkup`/setBlockType to EVERY selected block in ONE chained transaction (iterate positions DESCENDING so earlier positions stay valid, or rely on tr.mapping — pick the robust one and test multi-block).
  - **Duplicate** (insert a copy after each selected block, one transaction, descending) · **Delete** (delete all selected ranges, one transaction, descending, red) · **✕ Clear**.
  - Buttons: `data-testid="selection-turn-h2"` etc.
- Wire the extension into `buildAppExtensions()` (plugin-only — parity safe). CSS: `.block-multiselected { background: rgba(79,70,229,.08); outline: 2px solid rgba(79,70,229,.35); border-radius: 4px; }` + bar styles matching the app.
- **Tests (this is where the correctness lives):** toggle/clear/range commands on a headless editor; decorations REMAP under edits (insert text before a selected block → selection follows); cmd-click handler resolves nested click → top-level block; batch turn-H2 converts THREE non-adjacent paragraphs in one undo step (undo restores all three); batch delete of non-adjacent blocks deletes exactly those (descending-order correctness with size-changing blocks between); duplicate; turn-into hidden when a callout is in the selection; Esc clears.

### Task 3: `@` page mentions → internal links

**Files:** `src/app/mentions/pageMention.ts` + `PageMentionMenu.tsx` (mirror the slash machinery — same Suggestion util, char `"@"`), context registry (reuse the WeakMap pattern from imageUpload: `registerPageContext(editor, pages)` — App/Editor registers the loaded `ManualPageMeta[]`), wiring in `buildAppExtensions` + `Editor.tsx`, CSS reusing the slash-menu look.

- Typing `@` opens a popup listing pages (title + muted section/slug line), filtered by title/slug as you type; ↑/↓/Enter/Esc; Enter inserts a **link-marked text run**: text = page title, href = `/manual/<slug>` (the corpus' internal-link convention), plus a trailing space, replacing the `@query` text. No new node type — plain text+link mark (round-trips through the adapter as a standard markdown link).
- Tests: registry round-trip; filter; insertion replaces the @query and yields `[Title](/manual/slug)` semantics in the doc JSON (text node with link mark, correct href); works inside tabs/callouts (any textblock).

### Task 4 (controller): browser verify all three + deploy.

---

## Self-Review

- Placeholders: none — interaction rules, transaction-ordering concerns (descending positions), and scope cuts (no list batch-convert; top-level blocks only for multi-select v1) are explicit.
- Type consistency: `toggleBlockSelected`/`getSelectedBlocks`/`selectBlockRange`, `registerPageContext` naming consistent.
- Schema untouched throughout — decorations + marks only. ✓
