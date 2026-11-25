# Plugins site into the manual — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every page of plugins.audacityteam.org builds as a page under `/manual/plugins/`, with its downloads, images and links working.

**Architecture:** A one-off Python script in the scratchpad reads the GitBook clone (`SUMMARY.md` for order, each `.md` for content) and writes one `.mdx` per page into `src/content/manual/plugins/`, mapping GitBook blocks to the manual's components. Binaries copy to `public/manual/plugins/files/`, images to `src/assets/img/manual/plugins/`. Hand fixes follow the build.

**Tech Stack:** Astro 7 content collection (`manual`), MDX, existing `Callout`, `Tabs`/`Tab`, `Video` components, `museHubURL` helper. Bun.

**Spec:** `docs/superpowers/specs/2026-11-25-plugins-into-manual-design.md`

## Global Constraints

- No change to the plugins GitBook or its repo. No merge; push only for the Netlify preview Alex asked for.
- Conventional Commits; minimal scope; Bun.
- Addresses mirror GitBook paths: `<gitbook path>.md` → `/manual/plugins/<gitbook path>/`, `README.md` → folder index.
- MuseFX zips not carried. Audacity 3 manual links left as they are.

## Review Focus

- A `.ny` download whose name was normalised must still be the file the page describes: the crawl checks every download link returns 200. (Task 4)
- Nyquist prose with `<`, `{`, `*SCRATCH*` or `;;` must not be swallowed by MDX: the build fails loudly on parse errors, and the sample read covers the Nyquist reference pages. (Task 3, 5)
- A `<details>` block that holds a markdown image or list must still render it: the sample read covers Dynamics processing (realtime) and a Nyquist effects page. (Task 5)
- GitBook `"mention"` links with anchors (`page.md#anchor`) must keep the anchor on the new path. (Task 4)
- Group index pages must render as sidebar parents, not siblings: the sidebar check in Task 5 confirms the tree shape.

---

### Task 1: Assets

**Files:**

- Create: `public/manual/plugins/files/*` (ny, txt, xml, wav, mp3), `src/assets/img/manual/plugins/*.png`

- [ ] Copy every non-png, non-zip asset with a normalised name (lowercase extension, spaces → `-`, parentheses stripped); drop a ` (1)` twin only when byte-identical to its sibling. Record the old→new name map for Task 2.
- [ ] Copy the 49 PNGs with normalised names into the image folder.
- [ ] Verify: file counts match the source minus the dropped duplicates and zips.
- [ ] Commit: `docs(manual): plugin downloads and screenshots from plugins.audacityteam.org`

### Task 2: Conversion script

**Files:**

- Create (scratchpad, uncommitted): `scratchpad/plugins-convert.py`
- Create: `src/content/manual/plugins/**/*.mdx`

**Produces:** one `.mdx` per GitBook page with frontmatter `title`, `description`, `section: "Plugins"`, `sectionOrder`, `order`, `stream: "reference"`, `draft: false`; group `index.mdx` files for the five pageless groups.

- [ ] Parse `SUMMARY.md` into an ordered list of (depth, title, path | external url, group).
- [ ] For each `.md`: lift GitBook frontmatter `description`; take the first `# ` heading as `title` and drop it; convert `{% hint %}`, `{% tabs %}`/`{% tab title %}`, `{% file src %}caption{% endfile %}`, `{% embed url %}caption{% endembed %}`, `{% code %}`, `<figure><img>`, card `<table data-view="cards">`, `"mention"` links, relative `.md` links (incl. anchors), `.gitbook/assets/` image paths, MuseHub URLs (→ `museHubURL(path, utm_content)`), the two `/broken/pages/` links (→ plain text). Escape `{`, `}` and stray `<` in prose outside code.
- [ ] Emit imports only for components the page uses. Tab/Callout tags flush left.
- [ ] Write the five group `index.mdx` pages: title from SUMMARY heading, one-line intro, bullet list of child pages.
- [ ] `order` = position in SUMMARY; the home page `plugins/index.mdx` is the section's single root.
- [ ] Run the script; verify 53 + 5 files exist.

### Task 3: Build

- [ ] `bun run build`; fix every MDX parse error at its source in the script where it is a pattern, by hand where it is a one-off. Re-run until green.
- [ ] Commit: `docs(manual): the plugins site's 53 pages under /manual/plugins`

### Task 4: Link and download crawl

- [ ] Script over `dist/manual/plugins/**/index.html`: every `href`/`src` that starts with `/` must exist in `dist/`; every `/manual/plugins/files/` link must exist; anchors on internal links preserved. Expected: 0 missing.
- [ ] Repoint `support.audacityteam.org` links that have a manual counterpart (installing-ffmpeg → `/manual/installing-ffmpeg/`, using-realtime-effects → `/manual/getting-started/apply-your-first-effect/`, installing-plugins → `/manual/preferences/plugin/` if that page covers it).
- [ ] Commit fixes: `docs(manual): plugin pages link to their manual counterparts`

### Task 5: Read and hand over

- [ ] Dev server: open the plugins home, Realtime › Dynamics processing, Nyquist › Effect plugins › Dynamics processing, Nyquist dev › Widgets reference, EQ curves › Playback equalization. Check tabs, details, downloads, images, sidebar tree depth.
- [ ] Fix what reads wrong; commit.
- [ ] Push `docs/manual-plugins`, open a draft PR against main with the page table; hand the Netlify preview URL to Alex. No merge.
