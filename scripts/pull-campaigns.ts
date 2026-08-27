import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import type { PromoData } from "../src/assets/data/promos/types";

/**
 * Campaign promo pull pipeline.
 *
 * Confluence is the single source of truth for partner campaign promos. The
 * watched page holds a reverse-chronological "Promo Calendar" table. This
 * script:
 *
 *   1. Fetches the page storage HTML.
 *   2. Deterministically extracts the calendar table into structured rows,
 *      preserving destination URLs verbatim (UTM params must never change).
 *   3. Resolves the (year-less) date ranges via a monotonic walk anchored on
 *      today, then keeps only currently-active and upcoming promos.
 *   4. Maps each row to a typed PromoData entry using fixed site conventions.
 *   5. Optionally runs an LLM pass that may only tidy human-authored copy
 *      (typos, length) — never URLs, dates, types, or tracking. Skipped when
 *      no backend is available, and a no-op when the copy is already clean.
 *   6. Validates that every emitted URL appears verbatim in the source page.
 *   7. Renders src/assets/data/promos/campaigns.ts (or prints it with --dry-run).
 *
 * The script never commits or pushes. Review the generated diff yourself.
 */

const DEFAULT_OUTPUT_PATH = resolve(
  import.meta.dir,
  "../src/assets/data/promos/campaigns.ts",
);
const DEFAULT_CLAUDE_COMMAND = "claude";
const DEFAULT_LLM_API_URL = "https://api.openai.com/v1/chat/completions";

// Site conventions that Confluence does not encode. Centralised so the
// generated output stays consistent and reviewable.
const PARTNER_OS_TARGETS = ["Windows", "OS X"];
const DEFAULT_PRIORITY = 50;
const VIDEO_SLOT = 2; // slot 1 is reserved for the first-party Audacity 4 video
const BANNER_CTA_FALLBACK = "Get it on MuseHub";
const BANNER_TRACKING = {
  category: "Promo CTA",
  action: "Promo CTA button",
} as const;
const VIDEO_TRACKING = {
  category: "Video embed",
  action: "Watch release video",
} as const;

const MONTHS: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

export type CliOptions = {
  cleanCopy: boolean;
  dryRun: boolean;
  help: boolean;
  outputPath: string;
  pageUrl?: string;
};

export type ConfluencePageReference = {
  pageId: string;
  pageUrl: string;
  origin: string;
};

export type ConfluencePagePayload = ConfluencePageReference & {
  title: string;
  version: number;
  storageHtml: string;
};

/** A single row of the calendar table, reduced to plain text + collected URLs. */
export type ExtractedRow = {
  dates: string;
  product: string;
  copy: string;
  placement: string; // the "Audacity" column
  urls: string[];
};

export type ResolvedDates = {
  /** ISO YYYY-MM-DD, or undefined for an open-ended ("to xx") range. */
  startDate?: string;
  endDate?: string;
};

export type CampaignBundle = {
  bannerPromos: Record<string, PromoData>;
  videoPromos: Record<string, PromoData>;
  summary: string;
  ignoredEntries: string[];
};

type ExistingCampaignPromos = {
  bannerPromos: Record<string, PromoData>;
  videoPromos: Record<string, PromoData>;
};

type ClaudeCliConfig = { command: string; model?: string };
type ApiConfig = { apiKey: string; apiUrl: string; model: string };
type LlmBackend =
  | { kind: "none" }
  | { kind: "claude"; config: ClaudeCliConfig }
  | { kind: "api"; config: ApiConfig };

type ConfluenceContentResponse = {
  title?: string;
  version?: { number?: number };
  body?: { storage?: { value?: string } };
};

const execFileAsync = promisify(execFile);

const HELP_TEXT = `Pull the Confluence promo calendar into src/assets/data/promos/campaigns.ts.

Usage:
  bun run pull-campaigns [--dry-run] [--clean-copy] [--page-url <url>] [--output <file>]

Required env:
  CONFLUENCE_CAMPAIGN_PAGE_URL   (or pass --page-url)
  CONFLUENCE_PERSONAL_TOKEN

Flags:
  --dry-run     print the generated module instead of writing it
  --clean-copy  run an LLM pass that may tidy human-authored copy (typos,
                length). Off by default so the output stays faithful to
                Confluence. URLs, dates, types, and tracking are never touched.

Optional env (only used with --clean-copy):
  CAMPAIGN_LLM_BACKEND=claude|api|none   default: claude if on PATH, else none
  CAMPAIGN_CLAUDE_COMMAND                 default: claude
  CAMPAIGN_LLM_MODEL                      claude/api model override
  CAMPAIGN_LLM_API_KEY (or OPENAI_API_KEY)
  CAMPAIGN_LLM_API_URL                    default: OpenAI chat completions

The script never commits or pushes. Review the generated diff before shipping.
`;

// ---------------------------------------------------------------------------
// CLI + Confluence fetch
// ---------------------------------------------------------------------------

export function parseCliArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    cleanCopy: false,
    dryRun: false,
    help: false,
    outputPath: DEFAULT_OUTPUT_PATH,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--clean-copy") {
      options.cleanCopy = true;
    } else if (arg === "--output") {
      const value = args[(index += 1)];
      if (!value) throw new Error("Missing value for --output");
      options.outputPath = resolve(process.cwd(), value);
    } else if (arg === "--page-url") {
      const value = args[(index += 1)];
      if (!value) throw new Error("Missing value for --page-url");
      options.pageUrl = value;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

export function parseConfluencePageReference(
  pageUrl: string,
): ConfluencePageReference {
  const parsedUrl = new URL(pageUrl);
  const parts = parsedUrl.pathname.split("/").filter(Boolean);
  const pagesIndex = parts.findIndex((part) => part === "pages");
  const pageId = pagesIndex >= 0 ? parts[pagesIndex + 1] : undefined;

  if (!pageId || !/^\d+$/.test(pageId)) {
    throw new Error(
      `Could not determine Confluence page id from URL: ${pageUrl}`,
    );
  }

  return {
    pageId,
    pageUrl,
    origin: `${parsedUrl.protocol}//${parsedUrl.host}`,
  };
}

export async function fetchConfluencePage(
  reference: ConfluencePageReference,
  token: string,
  fetchImpl: typeof fetch = fetch,
): Promise<ConfluencePagePayload> {
  const apiUrl = `${reference.origin}/rest/api/content/${reference.pageId}?expand=title,body.storage,version`;
  const response = await fetchImpl(apiUrl, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const bodyText = await response.text();
    throw new Error(
      `Confluence request failed (${response.status} ${response.statusText}): ${bodyText.slice(0, 400)}`,
    );
  }

  const payload = (await response.json()) as ConfluenceContentResponse;
  const title = payload.title;
  const version = payload.version?.number;
  const storageHtml = payload.body?.storage?.value;

  if (!title || typeof version !== "number" || !storageHtml) {
    throw new Error(
      "Confluence response is missing title, version, or body.storage.value",
    );
  }

  return { ...reference, title, version, storageHtml };
}

// ---------------------------------------------------------------------------
// HTML helpers + table extraction
// ---------------------------------------------------------------------------

export function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

/** Strip tags from a fragment, decode entities, collapse whitespace. */
export function cellText(fragment: string): string {
  const withBreaks = fragment.replace(/<br\s*\/?>/gi, " ");
  const withoutTags = withBreaks.replace(/<[^>]+>/g, " ");
  return decodeEntities(withoutTags).replace(/\s+/g, " ").trim();
}

function collectUrls(fragment: string): string[] {
  const urls = new Set<string>();
  for (const match of fragment.matchAll(/href="([^"]+)"/g)) {
    urls.add(decodeEntities(match[1]));
  }
  // Plain-text URLs that were never linked.
  for (const match of fragment.matchAll(/https?:\/\/[^\s"<)]+/g)) {
    urls.add(decodeEntities(match[0]));
  }
  return [...urls];
}

/**
 * Locate the promo calendar table (identified by its "Partner/product" header)
 * and return one ExtractedRow per data row. Returns [] if the table is absent.
 */
export function extractPromoTable(storageHtml: string): ExtractedRow[] {
  const anchor = storageHtml.indexOf("Partner/product");
  if (anchor < 0) return [];

  const tableStart = storageHtml.lastIndexOf("<table", anchor);
  const tableEnd = storageHtml.indexOf("</table>", anchor);
  if (tableStart < 0 || tableEnd < 0) return [];

  const table = storageHtml.slice(tableStart, tableEnd);
  const rowFragments = table.split(/(?=<tr\b)/i).slice(1);
  const rows: ExtractedRow[] = [];

  for (const rowFragment of rowFragments) {
    // Skip the header row (uses <th>).
    if (/<th\b/i.test(rowFragment)) continue;

    const cells = rowFragment.split(/(?=<td\b)/i).slice(1);
    if (cells.length < 4) continue;

    rows.push({
      dates: cellText(cells[0]),
      product: cellText(cells[1]),
      copy: cellText(cells[2]),
      placement: cellText(cells[3]),
      urls: [
        ...collectUrls(cells[1]),
        ...collectUrls(cells[2]),
        ...collectUrls(cells[3]),
      ],
    });
  }

  return rows;
}

// ---------------------------------------------------------------------------
// Date resolution
// ---------------------------------------------------------------------------

type MonthDay = { month: number; day: number };

function parseMonthDay(token: string): MonthDay | null {
  const match = token.toLowerCase().match(/([a-z]{3})[a-z]*\.?\s+(\d{1,2})/);
  if (!match) return null;
  const month = MONTHS[match[1]];
  const day = Number(match[2]);
  if (month === undefined || day < 1 || day > 31) return null;
  return { month, day };
}

/** True when the end of a range is open ("to xx", "to xxx", blank). */
function hasOpenEnd(dates: string): boolean {
  const tail = dates.split(/\s*(?:-|to|–)\s*/i).pop() ?? "";
  return parseMonthDay(tail) === null && /x{2,}|^\s*$/.test(tail.trim() + " ");
}

function isoDate(year: number, md: MonthDay): string {
  const month = String(md.month + 1).padStart(2, "0");
  const day = String(md.day).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Resolve year-less date ranges over the whole (reverse-chronological) table.
 *
 * The newest promos sit at the top, so dates strictly decrease as we walk down.
 * We anchor the first row to the year that puts its start closest to `today`,
 * then for each subsequent row pick the latest year keeping it no later than
 * the previous (newer) row. End months earlier than their start month roll the
 * end into the following year.
 */
export function resolveTimeline(
  rows: ExtractedRow[],
  today = new Date(),
): ResolvedDates[] {
  const todayMs = today.getTime();
  let ceilingMs = Number.POSITIVE_INFINITY; // previous (newer) row's start
  let anchored = false;

  return rows.map((row) => {
    const [startToken, ...rest] = row.dates.split(/\s*(?:-|to|–)\s*/i);
    const startMd = parseMonthDay(startToken);
    if (!startMd) return {};

    const endMd = parseMonthDay(rest.join(" "));
    const open = !endMd && hasOpenEnd(row.dates);

    // Candidate years to consider for the start, newest first.
    const baseYear = today.getFullYear();
    let startYear: number;

    if (!anchored) {
      // Anchor: minimise distance from today.
      startYear = [baseYear - 1, baseYear, baseYear + 1].reduce(
        (best, year) => {
          const diff = Math.abs(
            new Date(isoDate(year, startMd)).getTime() - todayMs,
          );
          const bestDiff = Math.abs(
            new Date(isoDate(best, startMd)).getTime() - todayMs,
          );
          return diff < bestDiff ? year : best;
        },
        baseYear,
      );
      anchored = true;
    } else {
      // Latest year keeping the end no later than the newer row's start.
      startYear = baseYear + 1;
      while (startYear > baseYear - 20) {
        const endYear =
          endMd && endMd.month < startMd.month ? startYear + 1 : startYear;
        const refMd = endMd ?? startMd;
        if (new Date(isoDate(endYear, refMd)).getTime() <= ceilingMs) break;
        startYear -= 1;
      }
    }

    const startDate = isoDate(startYear, startMd);
    ceilingMs = new Date(startDate).getTime();

    if (open) return { startDate };
    if (!endMd) return { startDate };

    const endYear = endMd.month < startMd.month ? startYear + 1 : startYear;
    return { startDate, endDate: isoDate(endYear, endMd) };
  });
}

// ---------------------------------------------------------------------------
// Row -> PromoData mapping
// ---------------------------------------------------------------------------

type PromoType = "banner" | "video" | "skip";

function classifyPlacement(placement: string): PromoType {
  const value = placement.toLowerCase();
  if (value.includes("taken down")) return "skip";
  if (value.includes("video")) return "video";
  if (value.includes("banner")) return "banner";
  return "skip"; // "N/A", blank, MuseScore-only
}

export function toCamelCaseId(label: string): string {
  const words = label
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/);
  if (words.length === 0) return "promo";
  return words
    .map((word, index) =>
      index === 0
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join("");
}

/** Product name = text before the first colon in the copy, else the URL slug. */
function deriveProductName(row: ExtractedRow): string {
  const colon = row.copy.indexOf(":");
  if (colon > 0 && colon < 60) return row.copy.slice(0, colon).trim();

  const url = row.urls[0];
  if (url) {
    const slug = url.split(/[?#]/)[0].split("/").filter(Boolean).pop() ?? "";
    return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return "Promo";
}

/** Split copy into the displayed message and an optional CTA label. */
function splitCopy(copy: string): { message: string; ctaText?: string } {
  const match = copy.match(/cta(?:\s*copy)?\s*:\s*(.+)$/i);
  if (!match) return { message: copy.trim() };
  return {
    message: copy.slice(0, match.index).trim(),
    ctaText: match[1].trim(),
  };
}

function firstMuseHubUrl(urls: string[]): string | undefined {
  return urls.find((url) => url.includes("musehub.com"));
}

function youtubeId(urls: string[]): string | undefined {
  for (const url of urls) {
    const match = url.match(/(?:youtu\.be\/|v=|embed\/|\/vi\/)([\w-]{6,})/);
    if (match) return match[1];
  }
  return undefined;
}

/** Convert one extracted row + resolved dates into a keyed PromoData, or null. */
export function mapRowToPromo(
  row: ExtractedRow,
  dates: ResolvedDates,
): { id: string; promo: PromoData } | null {
  const type = classifyPlacement(row.placement);
  if (type === "skip") return null;

  const product = deriveProductName(row);
  const id = toCamelCaseId(product);
  const { message, ctaText } = splitCopy(row.copy);
  if (!message) return null;

  const dateFields: Partial<PromoData> = {};
  if (dates.startDate) dateFields.startDate = dates.startDate;
  if (dates.endDate) dateFields.endDate = dates.endDate;

  if (type === "video") {
    const videoId = youtubeId(row.urls);
    const ctaLink = firstMuseHubUrl(row.urls);
    if (!videoId) return null; // a video promo with no video is unusable
    const promo: PromoData = {
      type: "video",
      isActive: true,
      priority: DEFAULT_PRIORITY,
      slot: VIDEO_SLOT,
      ...dateFields,
      message,
      tracking: { ...VIDEO_TRACKING, name: product },
      video: {
        placeholderImage: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
        imageAltText: `Video thumbnail: ${product}`,
        videoURL: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`,
      },
      ...(ctaLink
        ? { cta: { text: ctaText ?? BANNER_CTA_FALLBACK, link: ctaLink } }
        : {}),
    };
    return { id, promo };
  }

  const ctaLink = firstMuseHubUrl(row.urls) ?? row.urls[0];
  if (!ctaLink) return null; // a banner with no destination is unusable
  const promo: PromoData = {
    type: "banner",
    isActive: true,
    priority: DEFAULT_PRIORITY,
    osTargets: [...PARTNER_OS_TARGETS],
    ...dateFields,
    message,
    tracking: { ...BANNER_TRACKING, name: `${product} MuseHub` },
    cta: { text: ctaText ?? BANNER_CTA_FALLBACK, link: ctaLink },
  };
  return { id, promo };
}

// ---------------------------------------------------------------------------
// Bundle assembly
// ---------------------------------------------------------------------------

/** Keep promos that are still active today or scheduled for the future. */
function isCurrentOrUpcoming(promo: PromoData, today: string): boolean {
  if (promo.endDate && promo.endDate < today) return false;
  return true;
}

export function buildCampaignBundle(
  rows: ExtractedRow[],
  timeline: ResolvedDates[],
  today = new Date().toISOString().slice(0, 10),
): CampaignBundle {
  const bannerPromos: Record<string, PromoData> = {};
  const videoPromos: Record<string, PromoData> = {};
  const ignoredEntries: string[] = [];
  const usedIds = new Set<string>();

  rows.forEach((row, index) => {
    const mapped = mapRowToPromo(row, timeline[index] ?? {});
    if (!mapped) {
      if (row.dates || row.copy) {
        ignoredEntries.push(`${row.dates} — ${row.product || row.copy}`.trim());
      }
      return;
    }

    if (!isCurrentOrUpcoming(mapped.promo, today)) {
      ignoredEntries.push(`${row.dates} — ${mapped.id} (past)`);
      return;
    }

    // Ensure unique keys when product names collide.
    let key = mapped.id;
    let suffix = 2;
    while (usedIds.has(key)) key = `${mapped.id}${suffix++}`;
    usedIds.add(key);

    if (mapped.promo.type === "video") videoPromos[key] = mapped.promo;
    else bannerPromos[key] = mapped.promo;
  });

  const bannerCount = Object.keys(bannerPromos).length;
  const videoCount = Object.keys(videoPromos).length;
  const summary = `${bannerCount} banner + ${videoCount} video promo(s) active or upcoming as of ${today}`;

  return { bannerPromos, videoPromos, summary, ignoredEntries };
}

export function mergeCampaignBundleAdditively(
  existing: ExistingCampaignPromos,
  fresh: CampaignBundle,
  today = new Date().toISOString().slice(0, 10),
): CampaignBundle {
  const bannerPromos = {
    ...existing.bannerPromos,
    ...fresh.bannerPromos,
  };
  const videoPromos = {
    ...existing.videoPromos,
    ...fresh.videoPromos,
  };
  const summary = `${Object.keys(bannerPromos).length} banner + ${Object.keys(videoPromos).length} video promo(s) after additive merge as of ${today}`;

  return {
    bannerPromos,
    videoPromos,
    summary,
    ignoredEntries: fresh.ignoredEntries,
  };
}

async function loadExistingCampaignPromos(
  outputPath: string,
): Promise<ExistingCampaignPromos> {
  try {
    const moduleHref = `${pathToFileURL(outputPath).href}?t=${Date.now()}`;
    const imported = (await import(moduleHref)) as {
      campaignBannerPromos?: Record<string, PromoData>;
      campaignVideoPromos?: Record<string, PromoData>;
    };

    return {
      bannerPromos: imported.campaignBannerPromos ?? {},
      videoPromos: imported.campaignVideoPromos ?? {},
    };
  } catch {
    return { bannerPromos: {}, videoPromos: {} };
  }
}

// ---------------------------------------------------------------------------
// URL integrity
// ---------------------------------------------------------------------------

function promoUrls(promo: PromoData): string[] {
  const urls: string[] = [];
  if (promo.cta?.link) urls.push(promo.cta.link);
  if (promo.video?.videoURL) urls.push(promo.video.videoURL);
  if (promo.video?.placeholderImage) urls.push(promo.video.placeholderImage);
  return urls;
}

/**
 * Guarantee every emitted destination URL traces back to the source page.
 * Derived YouTube embed/thumbnail URLs are allowed when the video id appears
 * in a source URL. Throws on any URL we cannot account for.
 */
export function assertUrlsFromSource(
  bundle: CampaignBundle,
  sourceUrls: string[],
): void {
  const source = new Set(sourceUrls);
  const sourceIds = new Set(
    sourceUrls.map((url) => youtubeId([url])).filter(Boolean),
  );

  const check = (url: string) => {
    if (source.has(url)) return;
    const id = youtubeId([url]);
    if (id && sourceIds.has(id)) return; // derived embed/thumbnail
    throw new Error(`Emitted URL not found in Confluence source: ${url}`);
  };

  for (const promo of [
    ...Object.values(bundle.bannerPromos),
    ...Object.values(bundle.videoPromos),
  ]) {
    promoUrls(promo).forEach(check);
  }
}

// ---------------------------------------------------------------------------
// Optional LLM copy cleanup
// ---------------------------------------------------------------------------

export function resolveLlmBackend(env: NodeJS.ProcessEnv): LlmBackend {
  const requested = env.CAMPAIGN_LLM_BACKEND;
  if (requested === "none") return { kind: "none" };

  const apiKey = env.CAMPAIGN_LLM_API_KEY ?? env.OPENAI_API_KEY;
  const model = env.CAMPAIGN_LLM_MODEL;

  if (requested === "api") {
    if (!apiKey)
      throw new Error("CAMPAIGN_LLM_BACKEND=api requires an API key.");
    return {
      kind: "api",
      config: {
        apiKey,
        apiUrl: env.CAMPAIGN_LLM_API_URL ?? DEFAULT_LLM_API_URL,
        model: model ?? env.OPENAI_MODEL ?? "gpt-4o-mini",
      },
    };
  }

  const command = env.CAMPAIGN_CLAUDE_COMMAND ?? DEFAULT_CLAUDE_COMMAND;
  const claudePath = typeof Bun !== "undefined" ? Bun.which(command) : null;

  if (requested === "claude") {
    if (!claudePath)
      throw new Error(`Claude CLI not found on PATH (${command}).`);
    return {
      kind: "claude",
      config: { command: claudePath, ...(model ? { model } : {}) },
    };
  }

  // Auto: prefer claude, then API, else skip.
  if (claudePath)
    return {
      kind: "claude",
      config: { command: claudePath, ...(model ? { model } : {}) },
    };
  if (apiKey) {
    return {
      kind: "api",
      config: {
        apiKey,
        apiUrl: env.CAMPAIGN_LLM_API_URL ?? DEFAULT_LLM_API_URL,
        model: model ?? env.OPENAI_MODEL ?? "gpt-4o-mini",
      },
    };
  }
  return { kind: "none" };
}

type CopyEntry = { id: string; message: string };

function collectCopyEntries(bundle: CampaignBundle): CopyEntry[] {
  return [
    ...Object.entries(bundle.bannerPromos),
    ...Object.entries(bundle.videoPromos),
  ].map(([id, promo]) => ({ id, message: promo.message }));
}

function applyCleanedCopy(bundle: CampaignBundle, cleaned: CopyEntry[]): void {
  const byId = new Map(cleaned.map((entry) => [entry.id, entry.message]));
  for (const promo of [
    ...Object.entries(bundle.bannerPromos),
    ...Object.entries(bundle.videoPromos),
  ]) {
    const [id, value] = promo;
    const message = byId.get(id);
    // Only accept rewrites that keep the copy URL-free; never lose content.
    if (message && message.trim() && !/https?:\/\//.test(message)) {
      value.message = message.trim();
    }
  }
}

const CLEANUP_PROMPT = `You tidy human-authored promo copy for the Audacity website.
Return JSON: {"entries":[{"id":"...","message":"..."}]} with the same ids.
For each message you may fix typos, fix capitalisation, and trim it to a single
concise sentence or two. Do NOT invent facts, add URLs, change product names,
or change meaning. If a message is already clean, return it unchanged.`;

function buildCleanupInput(entries: CopyEntry[]): string {
  return `${CLEANUP_PROMPT}\n\nInput:\n${JSON.stringify({ entries }, null, 2)}`;
}

function parseCleanupResponse(text: string): CopyEntry[] {
  const trimmed = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");
  const parsed = JSON.parse(trimmed) as { entries?: unknown };
  if (!Array.isArray(parsed.entries)) return [];
  return parsed.entries.flatMap((entry) =>
    entry &&
    typeof entry === "object" &&
    typeof (entry as CopyEntry).id === "string" &&
    typeof (entry as CopyEntry).message === "string"
      ? [{ id: (entry as CopyEntry).id, message: (entry as CopyEntry).message }]
      : [],
  );
}

async function runClaudeCleanup(
  entries: CopyEntry[],
  config: ClaudeCliConfig,
): Promise<CopyEntry[]> {
  // `--tools` is variadic, so keep it ahead of another flag (never directly
  // before the positional prompt, or it would swallow the prompt).
  const args = ["-p", "--tools", "", "--output-format", "json"];
  if (config.model) args.push("--model", config.model);
  args.push(buildCleanupInput(entries));

  const { stdout } = await execFileAsync(config.command, args, {
    maxBuffer: 20 * 1024 * 1024,
  });
  const envelope = JSON.parse(String(stdout)) as { result?: unknown };
  const result = typeof envelope.result === "string" ? envelope.result : "";
  return parseCleanupResponse(result);
}

async function runApiCleanup(
  entries: CopyEntry[],
  config: ApiConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<CopyEntry[]> {
  const response = await fetchImpl(config.apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: buildCleanupInput(entries) }],
    }),
  });
  if (!response.ok) {
    throw new Error(
      `LLM cleanup failed (${response.status} ${response.statusText})`,
    );
  }
  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return parseCleanupResponse(payload.choices?.[0]?.message?.content ?? "");
}

export async function cleanCopy(
  bundle: CampaignBundle,
  backend: LlmBackend,
): Promise<void> {
  if (backend.kind === "none") return;
  const entries = collectCopyEntries(bundle);
  if (entries.length === 0) return;

  const cleaned =
    backend.kind === "claude"
      ? await runClaudeCleanup(entries, backend.config)
      : await runApiCleanup(entries, backend.config);

  applyCleanedCopy(bundle, cleaned);
}

// ---------------------------------------------------------------------------
// Render + write
// ---------------------------------------------------------------------------

export function renderCampaignModule(bundle: CampaignBundle): string {
  // One-line banner: warn against hand-edits. The internal Confluence URL is
  // deliberately NOT emitted here (it lives in .env); source provenance is
  // printed to stdout at pull time instead.
  return [
    '// Generated by "bun run pull-campaigns" — do not edit. Source of truth is the Confluence promo calendar (see .env).',
    'import type { PromoData } from "./types";',
    "",
    `export const campaignBannerPromos: Record<string, PromoData> = ${JSON.stringify(bundle.bannerPromos, null, 2)};`,
    "",
    `export const campaignVideoPromos: Record<string, PromoData> = ${JSON.stringify(bundle.videoPromos, null, 2)};`,
    "",
  ].join("\n");
}

async function writeGeneratedModule(
  outputPath: string,
  content: string,
): Promise<void> {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, content, "utf8");
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

export async function runPullCampaigns(
  args: string[],
  env: NodeJS.ProcessEnv = process.env,
): Promise<void> {
  const options = parseCliArgs(args);
  if (options.help) {
    process.stdout.write(HELP_TEXT);
    return;
  }

  const pageUrl = options.pageUrl ?? env.CONFLUENCE_CAMPAIGN_PAGE_URL;
  if (!pageUrl) {
    throw new Error(
      "Missing Confluence page URL. Set CONFLUENCE_CAMPAIGN_PAGE_URL or pass --page-url.",
    );
  }
  const token = env.CONFLUENCE_PERSONAL_TOKEN;
  if (!token) throw new Error("Missing CONFLUENCE_PERSONAL_TOKEN.");

  const page = await fetchConfluencePage(
    parseConfluencePageReference(pageUrl),
    token,
  );

  const rows = extractPromoTable(page.storageHtml);
  if (rows.length === 0) {
    throw new Error(
      "Could not find the promo calendar table on the Confluence page.",
    );
  }

  const timeline = resolveTimeline(rows);
  const freshBundle = buildCampaignBundle(rows, timeline);
  const existingPromos = await loadExistingCampaignPromos(options.outputPath);
  const bundle = mergeCampaignBundleAdditively(existingPromos, freshBundle);

  if (options.cleanCopy) {
    const backend = resolveLlmBackend(env);
    if (backend.kind === "none") {
      process.stderr.write(
        "--clean-copy requested but no LLM backend is available; using source copy.\n",
      );
    } else {
      try {
        await cleanCopy(bundle, backend);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        process.stderr.write(`LLM copy cleanup skipped: ${message}\n`);
      }
    }
  }

  const sourceUrls = rows.flatMap((row) => row.urls);
  assertUrlsFromSource(bundle, sourceUrls);

  const moduleText = renderCampaignModule(bundle);

  if (options.dryRun) {
    process.stdout.write(moduleText);
    return;
  }

  await writeGeneratedModule(options.outputPath, moduleText);
  process.stdout.write(formatReport(page, bundle, options.outputPath));
}

/** The sync report for the operator: source, what was written, what was dropped. */
export function formatReport(
  page: ConfluencePagePayload,
  bundle: CampaignBundle,
  outputPath: string,
): string {
  const lines = [
    `Source: ${page.title} (version ${page.version})`,
    bundle.summary,
    `Wrote ${outputPath}`,
  ];
  if (bundle.ignoredEntries.length > 0) {
    lines.push("", "Ignored rows (past, or not an Audacity placement):");
    lines.push(...bundle.ignoredEntries.map((entry) => `  - ${entry}`));
  }
  return `${lines.join("\n")}\n`;
}

if (import.meta.main) {
  runPullCampaigns(Bun.argv.slice(2)).catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  });
}
