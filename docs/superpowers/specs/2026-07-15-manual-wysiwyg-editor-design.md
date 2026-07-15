# Manual WYSIWYG Editor — Design

**Date:** 2026-07-15
**Status:** Approved (design), pending implementation plan
**Author:** Alex Dawson (design lead) + Claude

## Purpose

Give the QA writer a friendly WYSIWYG editor for the Audacity 4 user manual so they
can create and edit pages without hand-writing MDX (YAML frontmatter, `import`
statements, JSX components). The manual stays exactly where it is today — MDX files
in this git repo, rendered by the existing Astro pipeline. The editor is a
**front-end over those files**; publishing is a git commit that flows through the
existing Netlify build.

## Confirmed decisions

| Decision        | Choice                                             | Rationale                                                                                                                                                                             |
| --------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source of truth | **MDX in git** (unchanged)                         | Keeps custom components, Pagefind search, sidebar/pagination from frontmatter, git history, `getLastUpdated`, and review-before-publish. Storage isn't the pain; the authoring UI is. |
| Access model    | **Hosted web app**                                 | QA needs no local dev setup; reachable from anywhere.                                                                                                                                 |
| Editor scope    | **All custom blocks**, incl. complex ones          | Callouts/Notes/Pitfalls, Shortcuts, Tabs, and (Phase 2) UIMap/AudacityButton/Toolbar.                                                                                                 |
| Publish flow    | **Draft in-app → batch-publish → PR**              | QA edits several pages as drafts, then publishes them together as one reviewable PR.                                                                                                  |
| Images          | **Committed into the repo** (compressed on upload) | Versioned with the text, shows in PR preview, no external service/secret. Compression tames git weight.                                                                               |
| Auth            | **GitHub OAuth** (QA + Alex, both have GitHub)     | Correct commit attribution; GitHub repo permissions _are_ the access control; no passwords stored.                                                                                    |
| Architecture    | **A — Standalone editor app**                      | Public marketing site stays 100% static and untouched; lowest blast radius.                                                                                                           |

The standalone app is architecturally decoupled but can present a friendly front
door: host at e.g. `editor.audacityteam.org` (its own Netlify site) and optionally
add a discreet "Edit this page" deep-link on the live manual. Same GitHub sign-in.

## Repo facts this design relies on

- Manual = Astro content collection `manual`, `.mdx`/`.md` files under
  `src/content/manual/`, organized into section folders.
- Frontmatter schema (`src/content/config.ts`): `title`, `description?`, `section`,
  `sectionOrder` (default 99), `order` (default 99), `draft` (default false).
- Rendered by `src/pages/manual/[...slug].astro` via `getStaticPaths` +
  `entry.render()`. Sidebar/pagination/"last updated" derive from frontmatter + git.
- Custom components in `src/components/manual/`:
  - Presentational `.astro`: `Callout` (`type` info/tip/warning + `title` + markdown
    children), `Notes`, `Pitfalls`, `BestPractices`, `TipsAndTricks`, `Tabs`/`Tab`.
  - React `.jsx`: `Shortcut` (`keys` string), `UIMap`, `AudacityButton`,
    `Toolbar/ManualToolbarDemo`.
- Repo: `github.com/audacity/audacity.github.io`. Public site is **fully static**
  (no SSR adapter). Netlify build (`npm run build` → `dist`), Netlify edge functions
  already in use. Repo uses **Prettier** (`.prettierrc.json`) + Bun.

## System topology

```
QA browser ──GitHub OAuth──► Editor SPA (React, Netlify)
           ◄──edit/preview──
                                    │ calls
                          Netlify Functions (OAuth callback, GitHub API proxy, image opt)
                                    │ Git Data API
                          GitHub repo: drafts branch → PR
                                    │ merge → build
                          Existing Netlify build of the manual (unchanged)
```

The editor never touches the production build directly. It only writes git; the
existing pipeline publishes.

## Component 1 — MDX round-trip engine (the crux)

The technical heart. Must never corrupt a file.

- **Parse**: MDX → `mdast` via `unified` + `remark-parse` + `remark-mdx` +
  `remark-gfm` + `remark-frontmatter`.
- **Map mdast → editor doc** (TipTap / ProseMirror):
  - Standard markdown (headings, lists, bold/italic, links, inline/block code,
    images) → standard editor nodes.
  - **Known components** (`Callout`, `Notes`, `Pitfalls`, `BestPractices`,
    `TipsAndTricks`, `Tabs`/`Tab`, `Shortcut`) → first-class editor blocks; JSX
    attributes become editable fields; markdown children stay editable inline.
  - **Unknown / complex JSX** (`UIMap`, `AudacityButton`, `ManualToolbarDemo`, or
    anything unrecognized) → an **opaque "preserved block"** that stores the exact
    source text and re-emits it verbatim. Preview + raw/props panel; the editor
    never rewrites bytes it wasn't taught. **This is the core safety guarantee.**
- **Serialize editor doc → mdast → `remark-stringify`**, then run output through the
  repo's Prettier config so it matches hand-authored formatting and diffs stay
  minimal.
- **Idempotency requirement**: every existing manual file must survive
  parse→serialize with a stable, minimal diff (see Testing) before the engine is
  trusted.

**Interface:** `parse(mdxSource) → EditorDoc` and `serialize(EditorDoc) → mdxSource`.
Pure, dependency-free of the UI, independently testable.

## Component 2 — Editor UI & block authoring

- **Prose toolbar**: headings, bold/italic, lists, links, inline code, block code.
- **Callout / Notes / Pitfalls / BestPractices / TipsAndTricks**: "Insert block"
  menu; body edited inline as a mini-document; side panel sets `type` and `title`.
- **Shortcut**: inline widget; type `Ctrl+Shift+K` → renders as keycaps.
- **Tabs**: block with named tabs (Windows/macOS/Linux), each holding editable prose.
  _(Rich editing = Phase 2; Phase 1 preserves it as an opaque block.)_
- **Complex blocks** (`UIMap`, `AudacityButton`, Toolbar demos): **Phase 1** =
  preserved block (preview + edit-raw-props), safe to use/tweak but not built from
  scratch visually. **Phase 2** = props-form UIs driven by a small per-component
  schema.

## Component 3 — Frontmatter & imports

- **Frontmatter** → a form (Title, Description, Section, Section order, Order, Draft
  toggle) with Section fed by existing sections.
- **Imports — enabling refactor (accepted):** register the manual components
  **globally** by passing a shared `components={{…}}` map in
  `src/pages/manual/[...slug].astro`, so MDX files no longer need per-file `import`
  lines. Removes an entire class of editor complexity (managing import statements)
  and cleans existing files. Mechanical, low-risk; done as a preparatory step and
  existing files updated to drop now-redundant imports.

## Component 4 — Image pipeline

- Paste/drag a screenshot → Netlify Function compresses & resizes (max ~1600px wide,
  WebP/optimized PNG) → commits to `src/assets/img/manual/<page-slug>/<name>` on the
  drafts branch, atomically with the text change (single tree+commit) → inserts a
  relative reference. Alt-text prompt required on insert (accessibility).

## Component 5 — Draft & publish flow (git model)

- One long-lived **drafts branch** (e.g. `manual/editor-drafts`) based off `main`.
- **Autosave**: debounced (~10s idle) commit of the current page via GitHub **Git
  Data API** (tree+commit atomically, so text + new images land together). Drafts
  persist across devices; **no separate database**.
- QA may edit **several pages** as drafts (matches batch-publish).
- **Publish**: opens/refreshes a **PR** from the drafts branch → `main`. Netlify
  builds a deploy preview. Reviewer merges. After merge, drafts branch resets to
  `main`.
- **Known limitation:** a single shared drafts branch assumes low concurrency (fine
  for one QA + Alex; last-write-wins on simultaneous same-page edits). Per-user
  branches are a Phase-2 upgrade.

## Component 6 — Auth & backend

- **GitHub OAuth** login. User's own token authorizes commits (correct attribution);
  GitHub repo permissions are the access control (no access ⇒ can't edit).
- **Netlify Functions**: OAuth callback (code→token exchange; token held in an
  httpOnly server-side session, never exposed to browser JS), a thin GitHub API
  proxy, and the image optimizer.
- Secrets (OAuth client secret) live in Netlify env, server-side only.

## Component 7 — Preview fidelity

- `.jsx` blocks (`Shortcut`, `UIMap`, `AudacityButton`, Toolbar) render directly in
  the React editor.
- `.astro` presentational blocks (`Callout` family, `Tabs`) get **thin React
  mirrors** sharing the exact Tailwind classes. Risk: two copies to keep in sync;
  mitigation: mirrors are tiny/pure-presentational, guarded by snapshot tests that
  flag drift.

## Tech stack

React + Vite (matches React 18 setup) · **TipTap** (ProseMirror) for the structured
editor · `unified`/`remark`/`remark-mdx`/`remark-gfm`/`remark-frontmatter` for
round-trip · Netlify Functions + `@octokit` for git · `sharp` (or Netlify image
tooling) for compression · Playwright for e2e.

## Risk register (hardest parts)

1. **Round-trip fidelity** — opaque preservation + Prettier normalization +
   golden-file idempotency tests over all existing manual files.
2. **Minimal git diffs** — match Prettier output so PRs are reviewable, not full-file
   rewrites.
3. **Preview mirror drift** — snapshot tests.
4. **Auth/token security** — httpOnly server-side sessions; never expose tokens to
   the SPA.

## Phasing

- **Phase 1 (MVP)** — OAuth → list pages → open one → edit prose + Callout +
  Shortcut + insert image → autosave to drafts branch → publish PR. Complex blocks
  (`UIMap`/`AudacityButton`/Toolbar/Tabs) are **preserved** (safe view/raw-edit), not
  visually authored. Proves the whole pipeline end-to-end.
- **Phase 2** — rich Tabs editing; props-form UIs for `UIMap`/`AudacityButton`/
  Toolbar; create/rename/delete/reorder pages; per-user branches if the team grows.
- **Phase 3** — side-by-side live preview via real components; link/alt-text checks;
  section-reordering UX.

## Testing strategy

- **Golden-file round-trip tests**: every existing manual file is idempotent under
  parse→serialize (stable, minimal diff).
- **Per-block unit tests** for parse/serialize of each known component.
- **Playwright e2e**: login → edit → autosave → publish PR.
- **Prettier-diff assertions** on serialized output.
- **Snapshot tests** for the React preview mirrors vs. the `.astro` originals.

## Out of scope (YAGNI)

- Translations/i18n of the manual (site has fr/de/es locales; manual is English-only
  today).
- Multi-user real-time collaboration.
- A full visual builder for `UIMap` from scratch.
- WYSIWYG editing of arbitrary hand-written JSX (always falls back to preserved
  block + raw edit).

## Open reactions folded in

- Enabling refactor (global component registration): **accepted**.
- Phase-1 treatment of `UIMap`/`AudacityButton`/Toolbar as preserved-but-not-visually
  -authored: **accepted**.
- Draft/publish git model: **accepted**.
