import type { Au4Shortcut } from "./types";

/**
 * Parses src/app/configs/data/shortcuts.xml from the Audacity 4 repo.
 *
 * The file is regular enough that a real XML parser would only add a
 * dependency: a flat list of <SC> blocks, each with one <key>, 1..n <seq>
 * and an optional <autorepeat>, under XML comment headings that act as the
 * file's only grouping ("<!-- Edit -->", "<!-- Playback -->", …).
 */
export function parseShortcuts(xml: string): {
  shortcuts: Au4Shortcut[];
  warnings: string[];
} {
  const shortcuts: Au4Shortcut[] = [];
  const warnings: string[] = [];

  let currentGroup: string | null = null;

  // Walk comments and <SC> blocks in document order so each block picks up
  // the heading above it. NOTE-style comments are annotations, not headings.
  const tokens = xml.matchAll(/<!--([\s\S]*?)-->|<SC>([\s\S]*?)<\/SC>/g);

  for (const token of tokens) {
    if (token[1] !== undefined) {
      const comment = token[1].trim();
      // "NOTE …" comments are annotations; "end …" comments close a group.
      if (/^end\b/i.test(comment)) currentGroup = null;
      else if (!/^NOTE\b/i.test(comment)) currentGroup = comment;
      continue;
    }

    const block = token[2];
    const key = block.match(/<key>([\s\S]*?)<\/key>/);
    if (!key) {
      warnings.push(
        `shortcuts.xml: <SC> block without <key>: ${block.trim().slice(0, 80)}`,
      );
      continue;
    }
    const sequences = [...block.matchAll(/<seq>([\s\S]*?)<\/seq>/g)].map((m) =>
      decodeXmlEntities(m[1]),
    );
    const autorepeat = block.match(/<autorepeat>(\d)<\/autorepeat>/);

    const shortcut: Au4Shortcut = {
      action: key[1].trim(),
      sequences,
      sourceGroup: currentGroup,
    };
    if (autorepeat) shortcut.autorepeat = autorepeat[1] === "1";
    shortcuts.push(shortcut);
  }

  const scCount = (xml.match(/<SC>/g) ?? []).length;
  if (scCount !== shortcuts.length) {
    warnings.push(
      `shortcuts.xml: parsed ${shortcuts.length} of ${scCount} <SC> blocks`,
    );
  }

  return { shortcuts, warnings };
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}
