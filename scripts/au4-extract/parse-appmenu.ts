import type { Au4MenuNode } from "./types";
import {
  captureBraces,
  captureParens,
  collectActionConstants,
  splitArgs,
  translatableText,
  unescapeCpp,
} from "./cpp-utils";

/**
 * Reconstructs the menu-bar tree from appshell's appmenumodel.cpp.
 *
 * This is deliberately a scanner for that one file's house idioms — menus
 * are built per `makeXxxMenu()` function from `MenuItemList` initializers,
 * `items << …` appends and helper `makeXxxItems()` calls — not a C++ parser.
 * Regions populated at runtime (recent files, workspaces, the effect lists
 * from the plugin registry, extensions) become `{ type: "dynamic" }` nodes.
 * Anything the scanner cannot resolve is emitted into `warnings`.
 */
export function parseAppMenu(source: string): {
  menus: Au4MenuNode[];
  warnings: string[];
} {
  const warnings: string[] = [];
  const constants = collectActionConstants(source);
  const functions = extractFunctions(source);
  const resolving = new Set<string>();

  const DYNAMIC_MARKERS: Array<[RegExp, string]> = [
    [
      /effectsMenuProvider\(\)->destructiveEffectMenu[\s\S]*?EffectFilter::(\w+)/,
      "effects-registry:",
    ],
    [/recentFilesController\(\)/, "recent-files"],
    [/extensionsProvider\(\)->manifestList/, "extensions"],
    [/m_workspacesMenuModel->items\(\)/, "workspaces"],
  ];

  function dynamicSource(expr: string): string | null {
    for (const [re, label] of DYNAMIC_MARKERS) {
      const m = expr.match(re);
      if (m) return label.endsWith(":") ? `${label}${m[1]}` : label;
    }
    return null;
  }

  function resolveFunction(name: string): Au4MenuNode[] {
    const body = functions.get(name);
    if (body === undefined) {
      warnings.push(`appmenumodel: no body found for ${name}()`);
      return [{ type: "dynamic", source: name }];
    }
    if (resolving.has(name)) {
      warnings.push(`appmenumodel: recursive resolution of ${name}()`);
      return [];
    }
    resolving.add(name);
    try {
      return scanBody(body);
    } finally {
      resolving.delete(name);
    }
  }

  type Var = { nodes: Au4MenuNode[] };

  function scanBody(body: string): Au4MenuNode[] {
    const vars = new Map<string, Var>();

    // Single-node and helper-call variables are collected before the
    // `MenuItemList { … }` initializers that reference them.
    // 1. `MenuItem* name = makeMenuItem(…)` single items.
    for (const m of body.matchAll(
      /MenuItem\*\s+(\w+)\s*=\s*makeMenuItem\s*\(/g,
    )) {
      const argText = captureParens(body, m.index + m[0].length - 1);
      if (argText === null) continue;
      const node = parseMenuItemArgs(argText);
      if (node) vars.set(m[1], { nodes: [node] });
    }
    // 2. `auto name = makeMenu(…)` / `auto name = makeXxx()` submenus.
    for (const m of body.matchAll(
      /(?:const\s+)?auto\s+(\w+)\s*=\s*(makeMenu|make\w+)\s*\(/g,
    )) {
      if (m[2] === "makeMenu") {
        const argText = captureParens(body, m.index + m[0].length - 1);
        if (argText === null) continue;
        vars.set(m[1], { nodes: [parseMenuArgs(argText, vars)] });
      } else {
        vars.set(m[1], { nodes: resolveFunction(m[2]) });
      }
    }
    // 3. `MenuItemList name = <expr>;` — helper calls or runtime providers.
    for (const m of body.matchAll(/MenuItemList\s+(\w+)\s*=\s*([^;]+);/g)) {
      const expr = m[2].trim();
      const call = expr.match(/^(make\w+)\s*\(\s*\)$/);
      if (call) {
        vars.set(m[1], { nodes: resolveFunction(call[1]) });
        continue;
      }
      const source = dynamicSource(expr);
      if (source) vars.set(m[1], { nodes: [{ type: "dynamic", source }] });
    }
    // 4. `MenuItemList name { … }` initializer blocks (the consumers).
    for (const m of body.matchAll(/MenuItemList\s+(\w+)\s*\{/g)) {
      const init = captureBraces(body, m.index + m[0].length - 1);
      if (init === null) {
        warnings.push(`appmenumodel: unbalanced init block for ${m[1]}`);
        continue;
      }
      vars.set(m[1], { nodes: scanSequence(init, vars) });
    }

    // `name << …` / `name.push_front(…)` appends, applied once per list
    // variable now that every definition is known — a list is consumed both
    // by `return name;` and as a `makeMenu(…, name, …)` argument, so the
    // appends can't wait for the return path.
    for (const [name, v] of vars) {
      v.nodes = applyAppends(name, v.nodes, body, vars);
    }

    // Disabled-after-construction: `x->setState(x->state().make_disabled())`.
    for (const m of body.matchAll(
      /(\w+)->setState\(\1->state\(\)\.make_disabled\(\)\)/g,
    )) {
      const v = vars.get(m[1]);
      const node = v?.nodes[0];
      if (node && (node.type === "menu" || node.type === "item")) {
        node.disabled = true;
      }
    }

    // The function's result: `return makeMenu(…)` wins, else `return name;`,
    // else load()'s `items` list. A body that resolves to nothing but touches
    // a runtime provider is a fully dynamic list (e.g. recent projects).
    const returnMenu = body.match(/return\s+makeMenu\s*\(/);
    if (returnMenu) {
      const argText = captureParens(
        body,
        returnMenu.index! + returnMenu[0].length - 1,
      );
      if (argText !== null) return [parseMenuArgs(argText, vars)];
    }
    const returnVar = body.match(/return\s+(\w+)\s*;/);
    if (returnVar) {
      const v = vars.get(returnVar[1]);
      if (v) return v.nodes;
    }
    const items = vars.get("items");
    if (items) return items.nodes;

    const source = dynamicSource(body);
    if (source) return [{ type: "dynamic", source }];
    if (returnVar) {
      warnings.push(`appmenumodel: return of unknown variable ${returnVar[1]}`);
    }
    return [];
  }

  /** Applies `name << …` and `name.push_front(…)` found after the initializer. */
  function applyAppends(
    name: string,
    initial: Au4MenuNode[],
    body: string,
    vars: Map<string, Var>,
  ): Au4MenuNode[] {
    const nodes = [...initial];
    for (const m of body.matchAll(
      new RegExp(`(?<![\\w.])${name}\\s*(<<|\\.push_front\\()`, "g"),
    )) {
      if (m[1] === "<<") {
        const chain = body.slice(m.index, endOfStatement(body, m.index));
        const sequence = chain
          .replace(new RegExp(`^${name}\\s*<<`), "")
          .replace(/<</g, ",");
        nodes.push(...scanSequence(sequence, vars));
      } else {
        const inner = captureParens(body, m.index + m[0].length - 1);
        if (inner !== null) nodes.unshift(...scanSequence(inner, vars));
      }
    }
    return nodes;
  }

  /** Parses a comma-separated expression sequence (an initializer or `<<` chain). */
  function scanSequence(text: string, vars: Map<string, Var>): Au4MenuNode[] {
    const nodes: Au4MenuNode[] = [];

    // Commented-out `makeMenuItem` lines are audit signal: the item exists
    // upstream but is deliberately switched off, so the manual must not
    // document it as present. They're rewritten to sentinel-tagged live
    // expressions so they keep their position in the sequence; every other
    // comment line is dropped.
    const COMMENTED = "__COMMENTED__";
    const prepared = text
      .split("\n")
      .map((line) => {
        const commentedItem = line.match(
          /^\s*\/\/!?\s*(makeMenuItem\s*\(.*?)\s*,?\s*$/,
        );
        if (commentedItem) return `${COMMENTED}${commentedItem[1]},`;
        return /^\s*\/\//.test(line) ? "" : line;
      })
      .join("\n");

    for (const piece of splitArgs(prepared)) {
      let expr = piece.replace(/^#\w+.*$/gm, "").trim();
      if (!expr) continue;
      const commented = expr.startsWith(COMMENTED);
      if (commented) expr = expr.slice(COMMENTED.length);
      if (/^makeSeparator\s*\(\s*\)$/.test(expr)) {
        nodes.push({ type: "separator" });
        continue;
      }
      const itemCall = expr.match(/^makeMenuItem\s*\(/);
      if (itemCall) {
        const argText = captureParens(expr, itemCall[0].length - 1);
        const node = argText !== null ? parseMenuItemArgs(argText) : null;
        if (node && node.type === "item") {
          nodes.push(commented ? { ...node, commentedOut: true } : node);
        } else if (!commented) {
          warnings.push(
            `appmenumodel: unresolved makeMenuItem: ${expr.slice(0, 60)}`,
          );
        }
        continue;
      }
      const menuCall = expr.match(/^makeMenu\s*\(/);
      if (menuCall) {
        const argText = captureParens(expr, menuCall[0].length - 1);
        if (argText !== null) nodes.push(parseMenuArgs(argText, vars));
        continue;
      }
      const fnCall = expr.match(/^(make\w+)\s*\(\s*\)$/);
      if (fnCall) {
        nodes.push(...resolveFunction(fnCall[1]));
        continue;
      }
      const bare = expr.match(/^(\w+)$/);
      if (bare) {
        const v = vars.get(bare[1]);
        if (v) nodes.push(...v.nodes);
        else warnings.push(`appmenumodel: unknown identifier ${bare[1]}`);
        continue;
      }
      const source = dynamicSource(expr);
      if (source) {
        nodes.push({ type: "dynamic", source });
        continue;
      }
      warnings.push(
        `appmenumodel: unrecognised expression: ${expr.slice(0, 80)}`,
      );
    }
    return nodes;
  }

  function parseMenuItemArgs(argText: string): Au4MenuNode | null {
    const args = splitArgs(argText);
    if (args.length === 0) return null;

    let code: string | null = null;
    const literal = args[0].match(/^"((?:[^"\\]|\\.)*)"$/);
    if (literal) code = unescapeCpp(literal[1]);
    else {
      const viaConstant = args[0].match(/^(\w+)(?:\.toString\(\))?$/);
      if (viaConstant) code = constants.get(viaConstant[1]) ?? null;
    }
    if (code === null) return null;

    const node: Au4MenuNode = { type: "item", code };
    for (const arg of args.slice(1)) {
      const title = translatableText(arg);
      if (title !== null) node.titleOverride = title;
    }
    return node;
  }

  function parseMenuArgs(argText: string, vars: Map<string, Var>): Au4MenuNode {
    const args = splitArgs(argText);
    const title = (args[0] ? translatableText(args[0]) : null) ?? "(dynamic)";
    const node: Au4MenuNode = {
      type: "menu",
      // "&File" → "File": & marks the Windows accelerator, not the name.
      title: title.replace(/&(?!&)/g, ""),
      children: [],
    };

    const idArg = args[2]?.match(/^"([^"]*)"$/);
    if (idArg) node.id = idArg[1];
    if (args[3] === "false") node.disabled = true;

    const listExpr = args[1]?.trim() ?? "";
    const fnCall = listExpr.match(/^(make\w+)\s*\(\s*\)$/);
    if (fnCall) node.children = resolveFunction(fnCall[1]);
    else if (vars.has(listExpr)) node.children = vars.get(listExpr)!.nodes;
    else {
      const source = dynamicSource(listExpr);
      if (source) node.children = [{ type: "dynamic", source }];
      else if (listExpr) {
        warnings.push(
          `appmenumodel: unresolved menu items: ${listExpr.slice(0, 60)}`,
        );
      }
    }
    return node;
  }

  const menus = resolveFunction("load").filter(
    (n): n is Extract<Au4MenuNode, { type: "menu" }> => n.type === "menu",
  );

  // The Diagnostics menu only exists in dev-mode builds (guarded by
  // devModeEnabled() in load()); everything else in the bar always ships.
  for (const menu of menus) {
    if (menu.id === "menu-diagnostic") menu.devOnly = true;
  }

  return { menus, warnings };
}

/** Bodies of every AppMenuModel member function, keyed by name. */
function extractFunctions(source: string): Map<string, string> {
  const functions = new Map<string, string>();
  for (const m of source.matchAll(
    /AppMenuModel::(\w+)\s*\(([^)]*)\)\s*(?:const\s*)?\{/g,
  )) {
    const body = captureBraces(source, m.index + m[0].length - 1);
    // Overloads (makeMenuItem has two): keep the longest body, which is the
    // list-building one rather than a forwarding wrapper.
    if (body !== null && body.length > (functions.get(m[1])?.length ?? 0)) {
      functions.set(m[1], body);
    }
  }
  return functions;
}

/** Index just past the statement's terminating top-level semicolon. */
function endOfStatement(text: string, from: number): number {
  let depth = 0;
  let inString = false;
  for (let i = from; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      if (c === "\\") i++;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') inString = true;
    else if (c === "(" || c === "{") depth++;
    else if (c === ")" || c === "}") depth--;
    else if (c === ";" && depth === 0) return i;
  }
  return text.length;
}
