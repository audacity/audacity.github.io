import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { parseAppMenu } from "./au4-extract/parse-appmenu";
import {
  parseBuiltinEffectSymbols,
  parseBuiltinLoader,
  parseNyquistHeader,
} from "./au4-extract/parse-effects";
import { parsePreferences } from "./au4-extract/parse-preferences";
import { parseShortcuts } from "./au4-extract/parse-shortcuts";
import { parseUiActions } from "./au4-extract/parse-uiactions";
import type { Au4Action, Au4Effect } from "./au4-extract/types";

/**
 * Extracts the user-facing surface of Audacity 4 — shortcuts, actions, the
 * menu tree, effects, preference pages — from its source tree into committed
 * JSON under src/data/au4/.
 *
 * The JSON is the site's build input: builds and CI never need the C++
 * checkout, only regeneration does. Serialization is deterministic, so drift
 * against a newer Audacity checkout is an ordinary `git diff`, and meta.json
 * records which upstream commit the data came from.
 *
 *   bun run extract:au4            regenerate src/data/au4/
 *   bun run extract:au4:check      exit 1 if regeneration would change it
 *
 * The Audacity repo is found via $AU4_REPO, defaulting to ../audacity.
 */

const execFileAsync = promisify(execFile);

const AU4_REPO = resolve(
  import.meta.dir,
  "..",
  process.env.AU4_REPO ?? "../audacity",
);
const OUTPUT_DIR = resolve(import.meta.dir, "../src/data/au4");

/**
 * The nine files holding UiAction registrations, keyed by module name.
 * `constants` lists extra files whose ActionQuery/ActionCode constants the
 * registrations reference (e.g. spectrogramtypes.h).
 */
const UIACTION_SOURCES: Record<string, { path: string; constants?: string[] }> =
  {
    appshell: { path: "src/appshell/internal/applicationuiactions.cpp" },
    cloud: { path: "src/au3cloud/internal/clouduiactions.cpp" },
    effects: { path: "src/effects/effects_base/internal/effectsuiactions.cpp" },
    playback: { path: "src/playback/internal/playbackuiactions.cpp" },
    project: { path: "src/project/internal/projectuiactions.cpp" },
    projectscene: {
      path: "src/projectscene/internal/projectsceneuiactions.cpp",
    },
    record: { path: "src/record/internal/recorduiactions.cpp" },
    spectrogram: {
      path: "src/spectrogram/internal/spectrogramuiactions.cpp",
      constants: ["src/spectrogram/spectrogramtypes.h"],
    },
    trackedit: { path: "src/trackedit/internal/trackedituiactions.cpp" },
  };

const SHORTCUTS_XML = "src/app/configs/data/shortcuts.xml";
const APPMENU_CPP = "src/appshell/qml/Audacity/AppShell/appmenumodel.cpp";
const BUILTIN_DIR = "src/effects/builtin_collection";
const BUILTIN_LOADER = `${BUILTIN_DIR}/internal/builtincollectionloader.cpp`;
const AU3_BASE_EFFECTS_DIR = "au3/libraries/au3-builtin-effects";
const NYQUIST_DIR = "share/nyquist-plug-ins";
const PREFERENCES_CPP =
  "src/preferences/qml/Audacity/Preferences/preferencesmodel.cpp";

async function au4File(relPath: string): Promise<string> {
  const abs = join(AU4_REPO, relPath);
  if (!existsSync(abs)) {
    throw new Error(
      `Expected Audacity source file missing: ${abs}\n` +
        `If the file moved upstream, that is itself drift — update the path ` +
        `in scripts/au4-extract.ts. If the repo is elsewhere, set AU4_REPO.`,
    );
  }
  return readFile(abs, "utf8");
}

async function extract() {
  if (!existsSync(AU4_REPO)) {
    throw new Error(
      `Audacity repo not found at ${AU4_REPO} — set AU4_REPO to its path.`,
    );
  }

  const warnings: string[] = [];
  const counts: Record<string, number> = {};

  // Shortcuts
  const shortcutsResult = parseShortcuts(await au4File(SHORTCUTS_XML));
  warnings.push(...shortcutsResult.warnings);
  counts.shortcuts = shortcutsResult.shortcuts.length;

  // Actions
  const actions: Au4Action[] = [];
  for (const [module, spec] of Object.entries(UIACTION_SOURCES)) {
    const source = await au4File(spec.path);
    const extraSources = await Promise.all(
      (spec.constants ?? []).map((p) => au4File(p)),
    );
    const result = parseUiActions(source, module, extraSources);
    warnings.push(...result.warnings);
    // Every UiAction( in the file must be accounted for — parsed, or
    // explained by one of this module's warnings.
    const rawCount = (source.match(/\bUiAction\s*\(/g) ?? []).length;
    const explained = result.actions.length + result.warnings.length;
    if (explained < rawCount) {
      warnings.push(
        `${module}: only ${explained} of ${rawCount} UiAction( occurrences accounted for`,
      );
    }
    actions.push(...result.actions);
  }
  counts.actions = actions.length;

  // Menus
  const menusResult = parseAppMenu(await au4File(APPMENU_CPP));
  warnings.push(...menusResult.warnings);
  counts.menus = menusResult.menus.length;

  // Effects: built-ins (Symbol declarations joined to the loader registry).
  // Some effects declare their Symbol on the au3 base class instead
  // (BassTrebleEffect → BassTrebleBase), so both trees are scanned.
  const symbols: Array<{ className: string; name: string; source: string }> =
    [];
  for (const dir of [BUILTIN_DIR, AU3_BASE_EFFECTS_DIR]) {
    const root = join(AU4_REPO, dir);
    for (const entry of await readdir(root, {
      recursive: true,
      withFileTypes: true,
    })) {
      if (!entry.isFile() || !entry.name.endsWith(".cpp")) continue;
      const abs = join(entry.parentPath, entry.name);
      const rel = abs.slice(root.length + 1);
      const result = parseBuiltinEffectSymbols(
        await readFile(abs, "utf8"),
        rel,
      );
      warnings.push(...result.warnings);
      symbols.push(...result.effects);
    }
  }
  const loader = parseBuiltinLoader(await au4File(BUILTIN_LOADER));
  const effects: Au4Effect[] = [];
  for (const className of loader.registered) {
    const baseName = `${className.replace(/(Effect|Generator)$/, "")}Base`;
    const symbol =
      symbols.find((s) => s.className === className) ??
      symbols.find((s) => s.className === baseName);
    if (!symbol) {
      warnings.push(`effects: registered ${className} has no parsed Symbol`);
      continue;
    }
    effects.push({
      name: symbol.name,
      family: "builtin",
      kind: className.includes("Generator") ? "generator" : "effect",
      source: symbol.source,
      hasView: loader.withView.includes(className),
    });
  }
  counts.builtinEffects = effects.length;

  // …and shipped Nyquist plug-ins.
  let nyquistCount = 0;
  for (const name of (await readdir(join(AU4_REPO, NYQUIST_DIR))).sort()) {
    if (!name.endsWith(".ny")) continue;
    const { effect, warning } = parseNyquistHeader(
      await readFile(join(AU4_REPO, NYQUIST_DIR, name), "utf8"),
      name,
    );
    if (warning) warnings.push(warning);
    if (effect) {
      effects.push(effect);
      nyquistCount++;
    }
  }
  counts.nyquistEffects = nyquistCount;

  // Preferences
  const prefsResult = parsePreferences(await au4File(PREFERENCES_CPP));
  warnings.push(...prefsResult.warnings);
  counts.preferencePages = prefsResult.pages.length;

  const au4Commit = (
    await execFileAsync("git", ["-C", AU4_REPO, "rev-parse", "HEAD"])
  ).stdout.trim();

  const sortedEffects = [...effects].sort(
    (a, b) => a.family.localeCompare(b.family) || a.name.localeCompare(b.name),
  );
  const sortedActions = [...actions].sort(
    (a, b) => a.module.localeCompare(b.module) || a.code.localeCompare(b.code),
  );
  const sortedShortcuts = [...shortcutsResult.shortcuts].sort((a, b) =>
    a.action.localeCompare(b.action),
  );

  return {
    files: {
      "shortcuts.json": sortedShortcuts,
      "actions.json": sortedActions,
      // Menu order is the menu bar's own order — not sorted.
      "menus.json": menusResult.menus,
      "effects.json": sortedEffects,
      "preferences.json": prefsResult.pages,
      "meta.json": {
        au4Commit,
        // Extraction date deliberately omitted from the data: it would make
        // every re-run a diff even when nothing changed upstream.
        counts,
        warnings: warnings.sort(),
      },
    } as Record<string, unknown>,
    warnings,
  };
}

function serialize(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function main() {
  const check = process.argv.includes("--check");
  const { files, warnings } = await extract();

  if (warnings.length > 0) {
    console.warn(`⚠ ${warnings.length} extraction warning(s):`);
    for (const w of warnings) console.warn(`  - ${w}`);
  }

  if (check) {
    const stale: string[] = [];
    for (const [name, value] of Object.entries(files)) {
      const target = join(OUTPUT_DIR, name);
      const current = existsSync(target)
        ? await readFile(target, "utf8")
        : null;
      if (current !== serialize(value)) stale.push(name);
    }
    if (stale.length > 0) {
      console.error(
        `Drift against ${AU4_REPO}: ${stale.join(", ")} would change. ` +
          `Run \`bun run extract:au4\` and review the diff.`,
      );
      process.exit(1);
    }
    console.log("src/data/au4 is up to date with the Audacity checkout.");
    return;
  }

  await mkdir(OUTPUT_DIR, { recursive: true });
  for (const [name, value] of Object.entries(files)) {
    await writeFile(join(OUTPUT_DIR, name), serialize(value));
  }
  const summary = Object.entries(
    (files["meta.json"] as { counts: Record<string, number> }).counts,
  )
    .map(([k, v]) => `${k} ${v}`)
    .join(", ");
  console.log(`Wrote src/data/au4/ (${summary}).`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
