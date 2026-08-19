import type { Au4PreferencePage } from "./types";
import { captureParens, splitArgs } from "./cpp-utils";

/**
 * The Preferences dialog's page registry lives in preferencesmodel.cpp as
 *
 *   makeItem("id", QT_TRANSLATE_NOOP("preferences", "Title"), IconCode::…,
 *            "Preferences/SomePage.qml")
 *
 * with QT_TRANSLATE_NOOP's arguments sometimes wrapped across lines.
 */
export function parsePreferences(source: string): {
  pages: Au4PreferencePage[];
  warnings: string[];
} {
  const pages: Au4PreferencePage[] = [];
  const warnings: string[] = [];

  let occurrences = 0;
  for (const m of source.matchAll(/\bmakeItem\s*\(/g)) {
    // Skip the factory function's own definition, `makeItem(const QString& …)`.
    const argText = captureParens(source, m.index + m[0].length - 1);
    if (argText === null || argText.includes("const QString")) continue;
    occurrences++;

    const args = splitArgs(argText);
    const id = args[0]?.match(/^"([^"]*)"$/);
    const title = args[1]?.match(
      /QT_TRANSLATE_NOOP\s*\(\s*"[^"]*"\s*,\s*"((?:[^"\\]|\\.)*)"\s*\)/,
    );
    if (!id || !title) {
      warnings.push(
        `preferences: unparsed makeItem: ${argText.slice(0, 60).replace(/\s+/g, " ")}…`,
      );
      continue;
    }
    const qmlPage = args[3]?.match(/^"([^"]*)"$/)?.[1] || null;
    pages.push({ id: id[1], title: title[1], qmlPage });
  }

  if (occurrences !== pages.length + warnings.length) {
    warnings.push(
      `preferences: parsed ${pages.length} of ${occurrences} makeItem calls`,
    );
  }

  return { pages, warnings };
}
