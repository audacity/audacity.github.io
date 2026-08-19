import type { Au4Action } from "./types";
import {
  captureParens,
  collectActionConstants,
  isCommentedOut,
  splitArgs,
  translatableText,
  unescapeCpp,
} from "./cpp-utils";

/**
 * Parses one of the `*uiactions.cpp` files, which hold `UiActionList`
 * initializers of stereotyped `UiAction(…)` blocks. The argument list
 * varies — an optional alias list (`{ "action://…" }`) after the code, an
 * optional description, icon and Checkable flag — so rather than trusting
 * positions, the title/description are "the first two TranslatableString
 * arguments" and the contexts are recognised by their naming conventions.
 *
 * Action codes are string literals or ActionQuery/ActionCode constants;
 * `extraConstantSources` covers constants declared in other files (e.g.
 * spectrogramtypes.h). Every `UiAction(` occurrence must end up either
 * parsed or in `warnings` — a silent drop would falsify the audit.
 */
export function parseUiActions(
  source: string,
  module: string,
  extraConstantSources: string[] = [],
): { actions: Au4Action[]; warnings: string[] } {
  const actions: Au4Action[] = [];
  const warnings: string[] = [];

  const constants = collectActionConstants(
    [source, ...extraConstantSources].join("\n"),
  );
  const tsConstants = collectTranslatableConstants(source);

  const re = /\bUiAction\s*\(/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    if (isCommentedOut(source, m.index)) continue;

    const openIndex = m.index + m[0].length - 1;
    const argText = captureParens(source, openIndex);
    if (argText === null) {
      warnings.push(`${module}: unbalanced UiAction( at index ${m.index}`);
      continue;
    }
    const args = splitArgs(argText);
    if (args.length < 4) {
      warnings.push(
        `${module}: UiAction with ${args.length} args skipped: ${argText.slice(0, 60)}…`,
      );
      continue;
    }

    const code = resolveCode(args[0], constants);
    if (!code) {
      warnings.push(`${module}: unresolved action code: ${args[0]}`);
      continue;
    }

    const texts: string[] = [];
    let uiContext: string | null = null;
    let shortcutContext: string | null = null;
    for (const arg of args.slice(1)) {
      const text = translatableText(arg) ?? tsConstants.get(arg) ?? null;
      if (text !== null) {
        texts.push(text);
        continue;
      }
      const ui = arg.match(/\b(UiCtx\w+)/);
      if (ui) uiContext = ui[1];
      const sc = arg.match(/\b(CTX_\w+)/);
      if (sc) shortcutContext = sc[1];
    }

    if (texts.length === 0) {
      warnings.push(`${module}: no title parsed for action ${code}`);
      continue;
    }

    const action: Au4Action = {
      code,
      module,
      title: texts[0],
      description: texts[1] === texts[0] ? null : (texts[1] ?? null),
      uiContext,
      shortcutContext,
    };
    if (argText.includes("Checkable::Yes")) action.checkable = true;
    actions.push(action);
  }

  return { actions, warnings };
}

function resolveCode(
  expr: string,
  constants: Map<string, string>,
): string | null {
  const literal = expr.match(/^"((?:[^"\\]|\\.)*)"$/);
  if (literal) return unescapeCpp(literal[1]);

  const viaConstant = expr.match(/^(\w+)(?:\.toString\(\))?$/);
  if (viaConstant) return constants.get(viaConstant[1]) ?? null;

  return null;
}

/** `static const TranslatableString NAME("ctx", "text");` → NAME → text. */
function collectTranslatableConstants(source: string): Map<string, string> {
  const constants = new Map<string, string>();
  for (const m of source.matchAll(
    /(?:static\s+)?const\s+TranslatableString\s+(\w+)\s*\(\s*"[^"]*"\s*,\s*"((?:[^"\\]|\\.)*)"\s*\)/g,
  )) {
    constants.set(m[1], unescapeCpp(m[2]));
  }
  return constants;
}
