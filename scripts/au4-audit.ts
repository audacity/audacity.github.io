import { existsSync } from "node:fs";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import type {
  Au4Action,
  Au4Effect,
  Au4MenuNode,
  Au4Meta,
  Au4PreferencePage,
  Au4Shortcut,
} from "./au4-extract/types";

/**
 * Compares the manual's content against the extracted Audacity 4 surface
 * (src/data/au4/*.json) and regenerates docs/au4-manual-audit.md.
 *
 * The report is the gap map that drives manual authoring: which menu items,
 * effects, preference pages and shortcuts have real pages, which have only
 * stubs, which have nothing, and which manual content is stale — documenting
 * things AU4 no longer has.
 *
 * scripts/au4-audit-map.json is the audit's curated memory. When fuzzy
 * title-matching can't connect an item to its page — or an item should never
 * be documented — add an entry there rather than editing the report:
 *
 *   "menu:duplicate":       { "page": "manual-index/header/edit/duplicate" }
 *   "effect:Repair":        { "page": "some/other/slug" }
 *   "pref:advanced":        { "status": "wont-document", "reason": "…" }
 *   "shortcut:diagnostics-show": { "status": "wont-document", "reason": "dev tool" }
 *
 * Run with `bun run audit:au4`.
 */

const ROOT = resolve(import.meta.dir, "..");
const DATA_DIR = join(ROOT, "src/data/au4");
const CONTENT_DIR = join(ROOT, "src/content/manual");
const PAGES_DIR = join(ROOT, "src/pages/manual");
const MAP_PATH = join(ROOT, "scripts/au4-audit-map.json");
const REPORT_PATH = join(ROOT, "docs/au4-manual-audit.md");

type MapEntry = { page?: string; status?: string; reason?: string };
type AuditMap = Record<string, MapEntry>;

type ManualPage = {
  slug: string;
  title: string;
  description: string | null;
  section: string | null;
  stream: string | null;
  draft: boolean;
  isStub: boolean;
  headings: string[];
  shortcutUsages: string[];
  internalLinks: string[];
};

/* ------------------------------------------------------------------ */
/* Manual content walk                                                 */
/* ------------------------------------------------------------------ */

function parseFrontmatter(raw: string): Record<string, string> {
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  const data: Record<string, string> = {};
  if (!m) return data;
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (!kv) continue;
    data[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, "");
  }
  return data;
}

async function walkManual(): Promise<ManualPage[]> {
  const pages: ManualPage[] = [];
  for (const entry of await readdir(CONTENT_DIR, {
    recursive: true,
    withFileTypes: true,
  })) {
    if (!entry.isFile() || !/\.(md|mdx)$/.test(entry.name)) continue;
    const abs = join(entry.parentPath, entry.name);
    const raw = await readFile(abs, "utf8");
    const fm = parseFrontmatter(raw);
    const body = raw.replace(/^---\n[\s\S]*?\n---/, "");
    pages.push({
      slug: abs.slice(CONTENT_DIR.length + 1).replace(/\.(md|mdx)$/, ""),
      title: fm.title ?? "",
      description: fm.description ?? null,
      section: fm.section ?? null,
      stream: fm.stream ?? null,
      draft: fm.draft === "true",
      isStub: /_This page is a stub/i.test(body) || body.trim().length < 120,
      headings: [...body.matchAll(/^#{1,4}\s+(.+)$/gm)].map((h) => h[1].trim()),
      shortcutUsages: [...body.matchAll(/<Shortcut[^>]*\bkeys="([^"]+)"/g)].map(
        (s) => s[1],
      ),
      internalLinks: [
        ...body.matchAll(/\]\((\/manual\/[^)#\s]+)/g),
        ...body.matchAll(/href="(\/manual\/[^"#]+)"/g),
      ].map((l) => l[1]),
    });
  }
  return pages.sort((a, b) => a.slug.localeCompare(b.slug));
}

/* ------------------------------------------------------------------ */
/* Matching                                                            */
/* ------------------------------------------------------------------ */

/** "Loudness Normalization" ≈ "loudness-normalisation" ≈ "Loudness normalization". */
function normTitle(s: string): string {
  return s
    .toLowerCase()
    .replace(/isation\b/g, "ization")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** "Cmd+Shift+A" / "Ctrl + Shift + A" → "ctrl+shift+a" (Qt Ctrl means ⌘ on mac). */
function normSeq(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s*\+\s*/g, "+")
    .replace(/\bcmd\b/g, "ctrl")
    .trim();
}

type Match = { page: ManualPage; via: "title" | "heading" };

function buildTitleIndex(pages: ManualPage[]): Map<string, Match[]> {
  const index = new Map<string, Match[]>();
  const add = (key: string, match: Match) => {
    const norm = normTitle(key);
    if (!norm) return;
    const existing = index.get(norm);
    if (existing) existing.push(match);
    else index.set(norm, [match]);
  };
  for (const page of pages) {
    add(page.title, { page, via: "title" });
    for (const heading of page.headings) add(heading, { page, via: "heading" });
  }
  return index;
}

type Coverage =
  | { status: "written"; page: string; via?: string }
  | { status: "stub"; page: string; via?: string }
  | { status: "missing" }
  | { status: "wont-document"; reason: string };

function resolveCoverage(
  mapKey: string,
  displayName: string,
  map: AuditMap,
  pagesBySlug: Map<string, ManualPage>,
  titleIndex: Map<string, Match[]>,
  warnings: string[],
): Coverage {
  const entry = map[mapKey];
  if (entry?.status === "wont-document") {
    return { status: "wont-document", reason: entry.reason ?? "" };
  }
  if (entry?.page) {
    const page = pagesBySlug.get(entry.page);
    if (!page) {
      warnings.push(`${mapKey}: mapped page "${entry.page}" does not exist`);
      return { status: "missing" };
    }
    return { status: page.isStub ? "stub" : "written", page: page.slug };
  }
  const matches = titleIndex.get(normTitle(displayName)) ?? [];
  // A dedicated page beats a heading mention; a written page beats a stub.
  const best =
    matches.find((m) => m.via === "title" && !m.page.isStub) ??
    matches.find((m) => m.via === "title") ??
    matches.find((m) => !m.page.isStub) ??
    matches[0];
  if (!best) return { status: "missing" };
  return {
    status: best.page.isStub ? "stub" : "written",
    page: best.page.slug,
    via: best.via === "heading" ? "heading" : undefined,
  };
}

/* ------------------------------------------------------------------ */
/* Menu flattening                                                     */
/* ------------------------------------------------------------------ */

type FlatItem = {
  code: string;
  label: string;
  path: string;
  commentedOut: boolean;
  disabled: boolean;
};

function flattenMenus(
  menus: Au4MenuNode[],
  actionsByCode: Map<string, Au4Action>,
): { items: FlatItem[]; dynamicRegions: string[] } {
  const items: FlatItem[] = [];
  const dynamicRegions: string[] = [];

  function walk(node: Au4MenuNode, trail: string[], disabled: boolean) {
    if (node.type === "item") {
      const action = actionsByCode.get(node.code);
      items.push({
        code: node.code,
        // Qt titles carry "&" accelerator marks ("&New…"); not display text.
        label: (node.titleOverride ?? action?.title ?? node.code).replace(
          /&(?!&)/g,
          "",
        ),
        path: trail.join(" → "),
        commentedOut: node.commentedOut ?? false,
        disabled: disabled || (node.disabled ?? false),
      });
    } else if (node.type === "menu") {
      if (node.devOnly) return;
      for (const child of node.children) {
        walk(
          child,
          [...trail, node.title],
          disabled || (node.disabled ?? false),
        );
      }
    } else if (node.type === "dynamic") {
      dynamicRegions.push(`${trail.join(" → ")} ← ${node.source}`);
    }
  }
  for (const menu of menus) walk(menu, [], false);
  return { items, dynamicRegions };
}

/* ------------------------------------------------------------------ */
/* Report rendering                                                    */
/* ------------------------------------------------------------------ */

function statusCell(c: Coverage): string {
  switch (c.status) {
    case "written":
      return `✅ written${c.via ? " (heading)" : ""}`;
    case "stub":
      return "🚧 stub";
    case "missing":
      return "❌ missing";
    case "wont-document":
      return `➖ won't document${c.reason ? ` — ${c.reason}` : ""}`;
  }
}

function pageCell(c: Coverage): string {
  return "page" in c && c.page
    ? `[${c.page}](../src/content/manual/${c.page}.mdx)`
    : "—";
}

function tally(coverages: Coverage[]): Record<string, number> {
  const t: Record<string, number> = {
    written: 0,
    stub: 0,
    missing: 0,
    "wont-document": 0,
  };
  for (const c of coverages) t[c.status]++;
  return t;
}

/* ------------------------------------------------------------------ */

async function main() {
  const load = async <T>(name: string): Promise<T> =>
    JSON.parse(await readFile(join(DATA_DIR, name), "utf8")) as T;

  const shortcuts = await load<Au4Shortcut[]>("shortcuts.json");
  const actions = await load<Au4Action[]>("actions.json");
  const menus = await load<Au4MenuNode[]>("menus.json");
  const effects = await load<Au4Effect[]>("effects.json");
  const preferences = await load<Au4PreferencePage[]>("preferences.json");
  const meta = await load<Au4Meta>("meta.json");

  const map: AuditMap = existsSync(MAP_PATH)
    ? JSON.parse(await readFile(MAP_PATH, "utf8"))
    : {};

  const pages = await walkManual();
  const published = pages.filter((p) => !p.draft);
  const pagesBySlug = new Map(pages.map((p) => [p.slug, p]));
  const titleIndex = buildTitleIndex(published);
  const actionsByCode = new Map(actions.map((a) => [a.code, a]));
  const warnings: string[] = [];

  const lines: string[] = [];
  const out = (s = "") => lines.push(s);

  /* ---- Menus ---- */
  const { items: menuItems, dynamicRegions } = flattenMenus(
    menus,
    actionsByCode,
  );
  const liveItems = menuItems.filter((i) => !i.commentedOut);
  const menuCoverage = liveItems.map((item) => ({
    item,
    coverage: resolveCoverage(
      `menu:${item.code}`,
      item.label,
      map,
      pagesBySlug,
      titleIndex,
      warnings,
    ),
  }));

  /* ---- Effects ---- */
  const effectCoverage = effects.map((effect) => ({
    effect,
    coverage: resolveCoverage(
      `effect:${effect.name}`,
      effect.name,
      map,
      pagesBySlug,
      titleIndex,
      warnings,
    ),
  }));

  /* ---- Preferences ---- */
  const prefCoverage = preferences.map((pref) => ({
    pref,
    coverage: resolveCoverage(
      `pref:${pref.id}`,
      pref.title,
      map,
      pagesBySlug,
      titleIndex,
      warnings,
    ),
  }));

  /* ---- Shortcuts (inline <Shortcut> coverage, both directions) ---- */
  const usageIndex = new Map<string, string[]>();
  for (const page of published) {
    for (const usage of page.shortcutUsages) {
      const norm = normSeq(usage);
      const existing = usageIndex.get(norm);
      if (existing) existing.push(page.slug);
      else usageIndex.set(norm, [page.slug]);
    }
  }
  const documentableShortcuts = shortcuts.filter(
    (s) => s.sourceGroup !== "Dev" && s.sequences.length > 0,
  );
  const shortcutHits = documentableShortcuts.map((s) => ({
    shortcut: s,
    usedOn: s.sequences.flatMap((seq) => usageIndex.get(normSeq(seq)) ?? []),
  }));
  const knownSequences = new Set(
    shortcuts.flatMap((s) => s.sequences.map(normSeq)),
  );
  // Bare keys (arrows, tab, enter…) appear constantly in accessibility prose
  // without being bound app shortcuts; only flag modifier/function-key usages.
  const staleUsages = [...usageIndex.entries()]
    .filter(([seq]) => !knownSequences.has(seq))
    .filter(([seq]) => seq.includes("+") || /^f\d+$/.test(seq));

  /* ---- Site-internal debt ---- */
  const sectionsByNorm = new Map<string, Set<string>>();
  for (const page of pages) {
    if (!page.section) continue;
    const norm = page.section.toLowerCase();
    const set = sectionsByNorm.get(norm) ?? new Set();
    set.add(page.section);
    sectionsByNorm.set(norm, set);
  }
  const sectionCollisions = [...sectionsByNorm.entries()].filter(
    ([, raws]) => raws.size > 1,
  );

  const streamProposal = (slug: string): string => {
    if (slug.startsWith("getting-started/")) return "getting-started";
    if (
      slug.startsWith("basics/") ||
      slug.startsWith("audio-editing/") ||
      slug.startsWith("special-uses/")
    )
      return "how-to";
    if (slug.startsWith("new-in-audacity-4/"))
      return "extract from manual (June note)";
    if (slug.startsWith("demo/") || slug.startsWith("alex/"))
      return "review for removal";
    return "reference";
  };
  const defaultedStream = pages.filter((p) => p.stream === null);

  const validTargets = new Set([
    ...pages.map((p) => `/manual/${p.slug}`),
    "/manual",
    "/manual/getting-started",
    "/manual/how-to",
    "/manual/reference",
    "/manual/shortcuts",
  ]);
  const deadLinks: Array<{ from: string; to: string }> = [];
  for (const page of pages) {
    for (const link of page.internalLinks) {
      if (!validTargets.has(link.replace(/\/$/, ""))) {
        deadLinks.push({ from: page.slug, to: link });
      }
    }
  }
  for (const entry of await readdir(PAGES_DIR, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".astro")) continue;
    const raw = await readFile(join(PAGES_DIR, entry.name), "utf8");
    for (const m of raw.matchAll(/["'](\/manual\/[^"'#]+)["']/g)) {
      if (!validTargets.has(m[1].replace(/\/$/, ""))) {
        deadLinks.push({ from: `src/pages/manual/${entry.name}`, to: m[1] });
      }
    }
  }

  const stubs = published.filter((p) => p.isStub);

  /* ---- Ranked next pages ---- */
  const nextPages: string[] = [];
  for (const { item, coverage } of menuCoverage) {
    if (coverage.status === "missing" && !item.disabled) {
      nextPages.push(
        `menu item **${item.label}** (${item.path}, \`${item.code}\`)`,
      );
    }
  }
  for (const { effect, coverage } of effectCoverage) {
    if (coverage.status === "missing") {
      nextPages.push(`effect **${effect.name}** (${effect.family})`);
    }
  }
  for (const { pref, coverage } of prefCoverage) {
    if (coverage.status === "missing") {
      nextPages.push(`preferences page **${pref.title}** (\`${pref.id}\`)`);
    }
  }

  /* ---- Render ---- */
  out("<!-- Generated by `bun run audit:au4`. Do not edit by hand:");
  out("     fix matches in scripts/au4-audit-map.json and regenerate. -->");
  out();
  out("# Audacity 4 manual coverage audit");
  out();
  out(
    `Audacity source: \`${meta.au4Commit.slice(0, 10)}\` · manual pages: ${pages.length} (${published.length} published, ${stubs.length} stubs) · extraction warnings: ${meta.warnings.length}`,
  );
  out();

  const menuTally = tally(menuCoverage.map((c) => c.coverage));
  const effectTally = tally(effectCoverage.map((c) => c.coverage));
  const prefTally = tally(prefCoverage.map((c) => c.coverage));
  out("| Category | Total | Written | Stub | Missing | Won't document |");
  out("| --- | --- | --- | --- | --- | --- |");
  const row = (label: string, total: number, t: Record<string, number>) =>
    out(
      `| ${label} | ${total} | ${t.written} | ${t.stub} | ${t.missing} | ${t["wont-document"]} |`,
    );
  row("Menu items", liveItems.length, menuTally);
  row("Effects", effects.length, effectTally);
  row("Preference pages", preferences.length, prefTally);
  out(
    `| Shortcuts (inline mentions) | ${documentableShortcuts.length} | ${shortcutHits.filter((h) => h.usedOn.length > 0).length} | — | ${shortcutHits.filter((h) => h.usedOn.length === 0).length} | — |`,
  );
  out();

  out("## Menu items");
  out();
  out("Every leaf item in the AU4 menu bar. “Stub” means a page exists but");
  out("has no real content yet.");
  out();
  out("| Menu path | Item | Action code | Status | Page |");
  out("| --- | --- | --- | --- | --- |");
  for (const { item, coverage } of menuCoverage) {
    const label = item.disabled ? `${item.label} _(disabled)_` : item.label;
    out(
      `| ${item.path} | ${label} | \`${item.code}\` | ${statusCell(coverage)} | ${pageCell(coverage)} |`,
    );
  }
  out();
  out("### Commented-out upstream (do not document as present)");
  out();
  for (const item of menuItems.filter((i) => i.commentedOut)) {
    out(`- ${item.path} → \`${item.code}\``);
  }
  out();
  out("### Dynamic regions (populated at runtime)");
  out();
  for (const region of dynamicRegions) out(`- ${region}`);
  out();

  out("## Effects, generators, analyzers and tools");
  out();
  out("| Effect | Family | Kind | Status | Page |");
  out("| --- | --- | --- | --- | --- |");
  for (const { effect, coverage } of effectCoverage) {
    out(
      `| ${effect.name} | ${effect.family} | ${effect.kind ?? "—"} | ${statusCell(coverage)} | ${pageCell(coverage)} |`,
    );
  }
  out();
  out("### Effect-ish pages matching no current AU4 effect (stale?)");
  out();
  const effectNames = new Set(effects.map((e) => normTitle(e.name)));
  const stalePagesSeen = new Set<string>();
  for (const page of published) {
    if (!/\/egat\//.test(page.slug)) continue;
    const isLeaf = ![...pagesBySlug.keys()].some((s) =>
      s.startsWith(`${page.slug}/`),
    );
    if (!isLeaf) continue;
    if (
      !effectNames.has(normTitle(page.title)) &&
      !stalePagesSeen.has(page.slug)
    ) {
      stalePagesSeen.add(page.slug);
      out(`- \`${page.slug}\` (“${page.title}”)`);
    }
  }
  out();

  out("## Preferences");
  out();
  out("| Page | Id | Status | Page |");
  out("| --- | --- | --- | --- |");
  for (const { pref, coverage } of prefCoverage) {
    out(
      `| ${pref.title} | \`${pref.id}\` | ${statusCell(coverage)} | ${pageCell(coverage)} |`,
    );
  }
  out();

  out("## Shortcuts");
  out();
  out("The generated `/manual/shortcuts` page covers every binding by");
  out("construction; this section tracks inline `<Shortcut>` mentions in");
  out("prose, both directions.");
  out();
  out("### AU4 shortcuts never mentioned inline");
  out();
  const missingByGroup = new Map<string, string[]>();
  for (const { shortcut, usedOn } of shortcutHits) {
    if (usedOn.length > 0) continue;
    const group = shortcut.sourceGroup ?? "(ungrouped)";
    const list = missingByGroup.get(group) ?? [];
    const action = actionsByCode.get(shortcut.action);
    list.push(
      `\`${shortcut.sequences.join("` / `")}\` — ${action?.title ?? shortcut.action}`,
    );
    missingByGroup.set(group, list);
  }
  for (const [group, list] of [...missingByGroup.entries()].sort()) {
    out(`**${group}**`);
    out();
    for (const item of list) out(`- ${item}`);
    out();
  }
  out("### Inline mentions matching no current AU4 binding (stale?)");
  out();
  out("Bare keys (arrows, tab, …) are ignored here — they appear in");
  out("accessibility prose legitimately. Only modifier and F-key combos are");
  out("checked.");
  out();
  for (const [seq, slugs] of staleUsages.sort()) {
    out(
      `- \`${seq}\` on ${[...new Set(slugs)].map((s) => `\`${s}\``).join(", ")}`,
    );
  }
  out();

  out("## Site-internal debt");
  out();
  out("### Section name collisions");
  out();
  if (sectionCollisions.length === 0) out("None.");
  for (const [, raws] of sectionCollisions) {
    out(`- ${[...raws].map((r) => `\`${r}\``).join(" vs ")}`);
  }
  out();
  out("### Dead internal links");
  out();
  if (deadLinks.length === 0) out("None.");
  for (const { from, to } of deadLinks) out(`- \`${from}\` → \`${to}\``);
  out();
  out(`### Stub pages (${stubs.length})`);
  out();
  for (const page of stubs) out(`- \`${page.slug}\``);
  out();
  out(
    `### Pages with defaulted stream (${defaultedStream.length}) — proposed assignment`,
  );
  out();
  out("Report output for human review; applying it re-homes pages across");
  out("sidebars and belongs in its own reviewed change.");
  out();
  out("| Page | Proposed stream |");
  out("| --- | --- |");
  for (const page of defaultedStream) {
    out(`| \`${page.slug}\` | ${streamProposal(page.slug)} |`);
  }
  out();

  out(`## Next pages to write (${nextPages.length} candidates)`);
  out();
  for (const [i, candidate] of nextPages.slice(0, 15).entries()) {
    out(`${i + 1}. ${candidate}`);
  }
  out();

  if (warnings.length > 0) {
    out("## Audit warnings");
    out();
    for (const w of warnings.sort()) out(`- ${w}`);
    out();
  }

  await writeFile(REPORT_PATH, `${lines.join("\n")}\n`);
  console.log(
    `Wrote docs/au4-manual-audit.md — menus ${menuTally.missing} missing/${menuTally.stub} stub, ` +
      `effects ${effectTally.missing} missing/${effectTally.stub} stub, ` +
      `prefs ${prefTally.missing} missing, ${deadLinks.length} dead links, ` +
      `${warnings.length} audit warning(s).`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
