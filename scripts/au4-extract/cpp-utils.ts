/**
 * Small helpers for scanning the handful of stereotyped C++ files the
 * extractor reads. These are idiom-level scanners for those specific files,
 * not a C++ parser — anything they cannot resolve must be reported loudly
 * by the caller, never dropped.
 */

/**
 * Given source text and the index of an opening "(", returns the substring
 * up to (not including) its balanced closing ")", ignoring parens inside
 * double-quoted string literals. Returns null if unbalanced.
 */
export function captureParens(text: string, openIndex: number): string | null {
  if (text[openIndex] !== "(") return null;
  let depth = 0;
  let inString = false;
  for (let i = openIndex; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      if (c === "\\") i++;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') inString = true;
    else if (c === "(") depth++;
    else if (c === ")") {
      depth--;
      if (depth === 0) return text.slice(openIndex + 1, i);
    }
  }
  return null;
}

/** Like captureParens but for a "{ … }" block starting at openIndex. */
export function captureBraces(text: string, openIndex: number): string | null {
  if (text[openIndex] !== "{") return null;
  let depth = 0;
  let inString = false;
  for (let i = openIndex; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      if (c === "\\") i++;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') inString = true;
    else if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return text.slice(openIndex + 1, i);
    }
  }
  return null;
}

/**
 * Splits a C++ argument list on top-level commas (commas inside nested
 * parens/braces/strings don't split). Angle brackets are deliberately not
 * treated as nesting: `->` arrows are everywhere in these sources, template
 * arguments in split positions are not.
 */
export function splitArgs(argText: string): string[] {
  const args: string[] = [];
  let depth = 0;
  let inString = false;
  let start = 0;
  for (let i = 0; i < argText.length; i++) {
    const c = argText[i];
    if (inString) {
      if (c === "\\") i++;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') inString = true;
    else if (c === "(" || c === "{") depth++;
    else if (c === ")" || c === "}") depth--;
    else if (c === "," && depth === 0) {
      args.push(argText.slice(start, i).trim());
      start = i + 1;
    }
  }
  const last = argText.slice(start).trim();
  if (last) args.push(last);
  return args;
}

/** Extracts the user-facing text of a TranslatableString("ctx", "text") expression. */
export function translatableText(expr: string): string | null {
  const m = expr.match(
    /TranslatableString(?:::untranslatable)?\s*\(\s*(?:"(?:[^"\\]|\\.)*"\s*,\s*)?"((?:[^"\\]|\\.)*)"/,
  );
  return m ? unescapeCpp(m[1]) : null;
}

/**
 * Collects `static const ActionQuery NAME("action://…")` / `static const
 * ActionCode NAME("…")` file-level constants into a name → value map.
 */
export function collectActionConstants(source: string): Map<string, string> {
  const constants = new Map<string, string>();
  for (const m of source.matchAll(
    /(?:static\s+)?const\s+(?:[\w:]+::)?Action(?:Query|Code)\s+(\w+)\s*\(\s*"((?:[^"\\]|\\.)*)"\s*\)/g,
  )) {
    constants.set(m[1], unescapeCpp(m[2]));
  }
  return constants;
}

export function unescapeCpp(s: string): string {
  return s.replace(/\\(["\\'])/g, "$1");
}

/** True when the occurrence at `index` sits on a `//`-commented line. */
export function isCommentedOut(text: string, index: number): boolean {
  const lineStart = text.lastIndexOf("\n", index) + 1;
  return /^\s*\/\//.test(text.slice(lineStart, index));
}
