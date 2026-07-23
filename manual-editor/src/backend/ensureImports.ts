/**
 * Injects the MDX `import` statements a manual page needs for the
 * components the editor can emit.
 *
 * The Astro site provides NO global component mapping for the manual
 * collection — every page must import what it uses (see any corpus page:
 * `import Callout from "../../../components/manual/Callout.astro"`). Pages
 * that already had components keep their imports through the editor's
 * round-trip (they parse as preserved `mdxjsEsm` blocks), but a component
 * INSERTED by the editor — via the slash menu into a new page, or into an
 * existing page that never used it — had no import at all, so the page
 * compiled in the editor's preview-free world but broke the site's Astro
 * build ("Callout is not defined" → whole-site build failure on every
 * deploy preview / branch deploy of the drafts branch).
 *
 * This runs server-side on the serialized MDX right before each draft
 * commit (`netlify/functions/draft.mts`). It only ever ADDS missing
 * imports; imports left over after the last use of a component is deleted
 * are harmless to the build and are deliberately not collected (removing
 * them would mean proving non-use across edge cases — not worth the risk
 * of breaking a page over an unused line).
 */

/**
 * Import specifiers (relative to `src/`) for every JSX component the
 * editor can put into a document. `Tab` is listed separately from `Tabs`
 * because the serializer emits both tags and the site defines them as two
 * files (`Tabs/Tabs.astro`, `Tabs/Tab.astro` — see any tabs-using corpus
 * page).
 */
const COMPONENT_MODULES: Record<string, string> = {
  Callout: "components/manual/Callout.astro",
  Notes: "components/manual/Notes.astro",
  Pitfalls: "components/manual/Pitfalls.astro",
  BestPractices: "components/manual/BestPractices.astro",
  TipsAndTricks: "components/manual/TipsAndTricks.astro",
  Tabs: "components/manual/Tabs/Tabs.astro",
  Tab: "components/manual/Tabs/Tab.astro",
  Shortcut: "components/manual/Shortcut.jsx",
  UIExample: "components/manual/UIExample/UIExample",
};

/**
 * How many `../` segments reach `src/` from the page's directory.
 * `src/content/manual/x.mdx` → dir `src/content/manual` → 2 ups;
 * every folder nested under `manual/` adds one more.
 */
function upsToSrc(pagePath: string): number {
  const m = pagePath.match(/^src\/content\/manual\/(.+)$/);
  if (!m) throw new Error(`not a manual page path: ${pagePath}`);
  const segments = m[1]!.split("/");
  return segments.length - 1 + 2;
}

/** Splits `source` into `[frontmatterBlock, body]`; frontmatter may be "". */
function splitFrontmatter(source: string): [string, string] {
  const m = source.match(/^---\n[\s\S]*?\n---\n/);
  if (!m) return ["", source];
  return [m[0], source.slice(m[0].length)];
}

/**
 * Returns `source` with an import line added (right after the frontmatter
 * block, merged onto any import lines already there) for every known
 * component that appears as a JSX tag in the body but has no import yet.
 * Returns the input unchanged when nothing is missing.
 */
export function ensureComponentImports(
  source: string,
  pagePath: string,
): string {
  const [frontmatter, body] = splitFrontmatter(source);

  const missing = Object.keys(COMPONENT_MODULES).filter((name) => {
    const used = new RegExp(`<${name}[\\s/>]`).test(body);
    if (!used) return false;
    const imported = new RegExp(`^\\s*import\\s+${name}\\s+from\\b`, "m").test(
      body,
    );
    return !imported;
  });
  if (missing.length === 0) return source;

  const prefix = "../".repeat(upsToSrc(pagePath));
  const importLines = missing
    .map((name) => `import ${name} from "${prefix}${COMPONENT_MODULES[name]}";`)
    .join("\n");

  // Merge onto an existing leading import block (skip blank lines first)
  // so all imports stay in one group; otherwise open a new block with a
  // blank line separating it from the content.
  const leading = body.match(/^\n*((?:import .*from .*;\n)+)/);
  if (leading) {
    const insertAt = leading[0].length;
    return `${frontmatter}${body.slice(0, insertAt)}${importLines}\n${body.slice(insertAt)}`;
  }
  return `${frontmatter}\n${importLines}\n${body.replace(/^\n*/, "\n")}`;
}
