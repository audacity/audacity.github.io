# About this repo

This is the source of [www.audacityteam.org](https://www.audacityteam.org). It uses [Astro](https://docs.astro.build/en/getting-started/).

This repo uses [Bun](https://bun.sh) as its package manager (CI builds with it too — only `bun.lock` is tracked).

- Install dependencies: `bun install`
- Run dev server: `bun run dev`
- Build: `bun run build`

## Translation

Translations are not yet supported. Please join our [dev discord](https://discord.gg/sFHfRbUVZj) to get notified when they are.

## Security

This is a static website, with no user input. As such, regular vulnerabilities likely won't affect us. That said, it probably is good to run `npx @astrojs/upgrade` (or `bunx @astrojs/upgrade`) every now and then to update astro to fix security vulnerabilities.

## Promos

Promos shown on the site come from two places:

- **Campaign promos** (MuseHub partners) are the single source of truth on the
  watched Confluence "Promo Calendar" page. They are generated into
  [`src/assets/data/promos/campaigns.ts`](src/assets/data/promos/campaigns.ts) by
  the pull command below — **never edit that file by hand.**
- **First-party promos** (the Audio.com exit popup, Audacity 4 alpha/video, the
  survey banner) do not live on Confluence and are maintained by hand in
  [`src/assets/data/promos/firstParty.ts`](src/assets/data/promos/firstParty.ts).

[`promotions.ts`](src/assets/data/promotions.ts) merges the two; the React/Astro
components consume only that merged map.

### Pulling campaign promos from Confluence

```sh
bun run pull-campaigns              # write campaigns.ts
bun run pull-campaigns --dry-run    # print the module instead of writing
```

The pipeline:

1. Fetches the watched page's storage HTML.
2. Deterministically extracts the calendar table, preserving destination URLs
   verbatim (UTM params must never change).
3. Resolves the year-less date ranges and keeps only **active and upcoming**
   promos — past rows are dropped (listed under `ignoredEntries` in the output).
4. Maps each row to a typed `PromoData` entry using fixed site conventions
   (banner ⇄ "Top/Promo Banner", video ⇄ "Video embed"; MuseScore-only and
   "Taken down" rows are skipped).
5. Validates that every emitted URL traces back to the source page.
6. Writes `campaigns.ts`. **It never commits or pushes — review the diff yourself.**

Required environment variables (see `.env`):

- `CONFLUENCE_CAMPAIGN_PAGE_URL` (or pass `--page-url <url>`)
- `CONFLUENCE_PERSONAL_TOKEN`

#### Optional LLM copy cleanup

The calendar copy is human-authored. Pass `--clean-copy` to run an LLM pass that
may fix typos and shorten copy — it never touches URLs, dates, types, or
tracking, and re-runs the URL integrity check afterwards. It is **off by
default** so output stays faithful to Confluence.

```sh
bun run pull-campaigns --clean-copy
```

Backend is auto-selected (the local `claude` CLI if on `PATH`, else an
OpenAI-compatible API). Override with:

- `CAMPAIGN_LLM_BACKEND=claude|api|none`
- `CAMPAIGN_CLAUDE_COMMAND` (default `claude`)
- `CAMPAIGN_LLM_MODEL` (or `OPENAI_MODEL`)
- `CAMPAIGN_LLM_API_KEY` (or `OPENAI_API_KEY`)
- `CAMPAIGN_LLM_API_URL` (default: OpenAI chat completions)

Other flags: `--output <file>`, `--help`.
