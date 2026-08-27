import type { Au4Effect } from "./types";

/**
 * Built-in effects declare their user-facing name as
 *
 *   const ComponentInterfaceSymbol X::Symbol { TranslatableString("ctx", "Name") };
 *   const ComponentInterfaceSymbol X::Symbol { wxT("Internal"), TranslatableString("ctx", "Name") };
 *
 * (the second form when the internal id differs from the display name).
 * Call once per builtin_collection .cpp file.
 */
export function parseBuiltinEffectSymbols(
  source: string,
  sourceDir: string,
): {
  effects: Array<{ className: string; name: string; source: string }>;
  warnings: string[];
} {
  const effects: Array<{ className: string; name: string; source: string }> =
    [];
  const warnings: string[] = [];

  // A stray `/*: noun */` translator comment can sit before the brace, and
  // the name may come via TranslatableString(ctx, name[, disambiguation]),
  // the au3 XO(name) macro, or a bare wxT(internal-id).
  for (const m of source.matchAll(
    /const ComponentInterfaceSymbol\s+(\w+)::Symbol\s*(?:\/\*[\s\S]*?\*\/\s*)?\{([\s\S]*?)\};/g,
  )) {
    const className = m[1];
    const translatable = m[2].match(
      /TranslatableString\s*\(\s*"(?:[^"\\]|\\.)*"\s*,\s*"((?:[^"\\]|\\.)*)"/,
    );
    const xo = m[2].match(/XO\s*\(\s*"((?:[^"\\]|\\.)*)"\s*\)/);
    const wxOnly = m[2].match(/^\s*wxT\("((?:[^"\\]|\\.)*)"\)\s*$/);
    const name = translatable?.[1] ?? xo?.[1] ?? wxOnly?.[1] ?? null;
    if (name === null) {
      warnings.push(
        `effects: unparsed Symbol for ${className} in ${sourceDir}`,
      );
      continue;
    }
    effects.push({ className, name, source: sourceDir });
  }

  return { effects, warnings };
}

/**
 * builtincollectionloader.cpp is the registry: `Registration<ClassName>`
 * makes an effect exist, `regView(ClassName::Symbol, …)` gives it a QML
 * dialog. Class names join to the Symbol declarations above.
 */
export function parseBuiltinLoader(source: string): {
  registered: string[];
  withView: string[];
} {
  const registered = [
    ...source.matchAll(/BuiltinEffectsModule::Registration<\s*(\w+)\s*>/g),
  ].map((m) => m[1]);
  const withView = [...source.matchAll(/regView\(\s*(\w+)::Symbol/g)].map(
    (m) => m[1],
  );
  return { registered, withView };
}

/**
 * Shipped Nyquist plug-ins carry their metadata in `$key value` headers:
 * `$name (_ "Delay")`, `$type process delayandreverb`, `$type tool analyze`.
 */
export function parseNyquistHeader(
  source: string,
  fileName: string,
): { effect: Au4Effect | null; warning: string | null } {
  // Two header dialects ship: `$name (_ "Delay")` and the legacy
  // `;name "Measure RMS"` (no translation wrapper).
  const name = source.match(/^[$;]name\s+(?:\(_\s+)?"((?:[^"\\]|\\.)*)"\)?/m);
  const type = source.match(/^[$;]type\s+([\w ]+?)\s*$/m);
  if (!name) {
    return { effect: null, warning: `nyquist: no $name in ${fileName}` };
  }
  const typeTokens = type?.[1].trim().split(/\s+/) ?? [];
  return {
    effect: {
      name: name[1],
      family: "nyquist",
      kind: typeTokens[0] ?? null,
      source: fileName,
      subcategory: typeTokens[1] ?? null,
    },
    warning: null,
  };
}
