# Plugins site into the manual — design

**Date:** 2026-11-25 · **Branch:** `docs/manual-plugins` · **Status:** approved 25 Nov; revised the same day, see Revision below

## Intent

Port the 53 pages of plugins.audacityteam.org (GitBook, Git-synced to
`audacity/audacity-support` branch `plugins`) into this site's manual, so the
plugin directory, the Nyquist plugin archive and the plugin-developer docs
live on audacityteam.org. Same reason as the support-site move on 24 Nov: one
property, one search, one design, and a redirect path for the GitBook later.

Alex's call: build the pages inside the manual first. Where they live is
cheap to change afterwards (a page's stream and section are frontmatter, its
address is its file path), so the layout question is deferred, not decided.

## Goals

- Every published GitBook page exists as a manual page that builds and reads
  correctly, including downloads, images and tabs.
- Addresses mirror the GitBook paths under `/manual/plugins/`, so a later
  one-to-one redirect from `plugins.audacityteam.org/<path>` is mechanical.
- Nothing is lost: every `.ny`, EQ curve, sample and image the pages link to
  is served from this site.

## Non-goals and anti-goals

- No change to the plugins GitBook, its repo or its redirects. That is a
  later, separately authorised step.
- No rewriting for Audacity 4. The text is ported as written (Audacity 3
  menu paths and all); an Audacity 4 pass is its own job. Audacity 4 does run
  Nyquist (the manual already has `tools/nyquist` and
  `tools/nyquist-plugin-installer`), so the whole site comes over.
- Not a redesign of the manual sidebar. If 53 nested pages render badly in
  it, that is reported, not fixed here.

## Constraints

- Minimal, scoped change (AGENTS.md). Bun. Conventional Commits.
- Nothing merged or pushed without Alex's word.
- MDX gotchas learned on 24 Nov: a bare `&` or `{` in JSX attributes and a
  bare `<` in prose break the parse; component tags sit flush left after
  lists.

## Approaches considered

1. **Own `/plugins` section** with a catalogue landing and its own
   collection. Best fit for a directory, most work. Deferred.
2. **Inside the manual, reference stream** (picked). Reuses the collection,
   sidebar, search and components; cheapest; moveable later.
3. **Split** (catalogue to `/plugins`, developer docs to `/dev`, extras to
   how-to). Most "right", most work, hardest to redirect. Not now.

## The how, as decided

- **Files:** `src/content/manual/plugins/<gitbook-path>.mdx`, one per page,
  `README.md` becoming `index.mdx` of its folder (the pattern
  `accessibility/index.mdx` already uses). `stream: "reference"`, one
  `section: "Plugins"` with the site's home page as the single root, so the
  sidebar heading links to it and the GitBook hierarchy becomes the tree
  (`sectionOrder` after the existing reference sections). `draft: false`;
  the branch stays unmerged until Alex says.
- **Group pages:** GitBook's five sidebar groups (Realtime effects, AI
  plugins, Nyquist plugins, Analyzers, Contributing, Additional resources)
  are headings without pages, and the manual sidebar nests only by path.
  Each group gets a short `index.mdx` listing its pages, so the tree keeps
  its shape and `/manual/plugins/realtime-effects/` is a page rather than a 404. These are additions, not ports; the 53 GitBook pages still map one to
  one.
- **Conversion:** a one-off script in the scratchpad (not committed) does
  the mechanical part, hand-fixes follow. Mapping: GitBook frontmatter
  `description` → `description`; first `# H1` → `title` (removed from the
  body); `{% hint %}` → `<Callout type>` (success/info → info, warning/danger
  → warning); `{% tabs %}` → `<Tabs>`/`<Tab label>`; `{% file %}` → a
  download link to the served file; `{% embed %}` → a plain link with the
  caption as text (YouTube embeds → the manual's `Video` component);
  `{% code %}` → fenced code; `<details>` kept as HTML; the home page's card
  table → a list of links; `"mention"` links and relative `.md` links →
  `/manual/plugins/...` paths; `<figure><img>` → markdown images.
- **Downloads:** `.ny`, `.txt`, `.xml`, `.wav`, `.mp3` served from
  `public/manual/plugins/files/<filename>` (spaces and parentheses in names
  normalised; duplicates like `European_78_3.2.2 (1).txt` dropped when
  byte-identical). The two MuseFX zips (31 MB + 24 MB) are **not** carried:
  MuseFX is distributed via MuseHub now and the Plugin Suites page already
  points there (MUSH-2326).
- **Images:** the 49 PNGs into `src/assets/img/manual/plugins/`, referenced
  by relative markdown image paths as the handout pages do.
- **Outbound links:** `manual.audacityteam.org` (Audacity 3 manual, 82 links)
  stay as they are — that manual is live and the text is Audacity 3 text.
  `support.audacityteam.org` links whose pages moved on 24 Nov are repointed
  to their manual page (FFmpeg, realtime effects); the rest stay.
  MuseHub links go through `museHubURL` with each link's existing
  `utm_content` value; the helper's launch day is already 231126, so the
  output matches the source. Two links to GitBook's own `/broken/pages/...`
  in the scripting reference are already dead and become plain text.
- **Verification:** `bun run build` passes; a crawl of the built
  `dist/manual/plugins/**` finds no internal link or download that does not
  resolve; 53 ported pages plus the group index pages;
  a sample of pages read in the dev server (Nyquist code blocks, tabs,
  details, downloads).

## Left to the builder

- Exact `sectionOrder`, and whether the deepest branch (Nyquist →
  Basics/Tutorials, five levels) needs flattening a level for the sidebar.
- Which `support.audacityteam.org` links have a manual counterpart.
- Escaping of Nyquist's `*SCRATCH*`, `;;` and `<` in prose.
- Whether to keep GitBook's `<details><summary>Details</summary>` blocks or
  open them inline; keep them unless they break MDX.

## Revision, 25 Nov 2026: its own space at /plugins

Having seen the pages in the manual, Alex drew the line differently: the
manual documents what ships in the box (including the stock Nyquist
plugins), while this content is a directory of third-party and downloadable
plugins. So it moves out to `audacityteam.org/plugins`, approach 1, with
the cheapest build: a fourth stream, `plugins`, in the same collection.
The pages stay in `src/content/manual/plugins/` and keep the sidebar,
search, pagination and components; `streams.ts` gives each stream a base
path, and a `/plugins/[...slug]` route renders the stream through the
shared `ManualArticle` template with the `plugins/` folder dropped from
the address. The stream is marked standalone: out of the manual's switcher
and landing cards, listed on the /help hub, and the sidebar shows a
"Plugins" block with a way back to the manual instead of the switcher.
Downloads moved to `/plugins/files/`. The old `/download/plug-ins/` and
`/about/features/plug-ins/` redirects now land on `/plugins/`. A designed
catalogue landing for `/plugins` is a later, separate job.
