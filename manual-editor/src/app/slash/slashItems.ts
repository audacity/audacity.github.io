import type { Editor } from "@tiptap/core";
import {
  insertAdmonition,
  insertShortcut,
  insertTabs,
  insertUIExample,
  setCodeBlock,
  setHeading,
  setParagraph,
  toggleBulletList,
  toggleOrderedList,
} from "../insertCommands";
import { insertImageViaPicker } from "../imageUpload";
import { UI_EXAMPLE_META } from "../../uiExample/meta";

/**
 * A single row in the `/` slash menu. `group` controls the section it's
 * rendered under (`filterSlashItems` and `SlashMenu` both preserve
 * `SLASH_ITEMS`' declaration order within and across groups); `hint` is the
 * markdown shorthand shown right-aligned in the row (e.g. `##` for Heading
 * 2); `keywords` widen what the fuzzy filter matches beyond the visible
 * label (e.g. "warning" finding Callout).
 */
export interface SlashItem {
  id: string;
  label: string;
  group: "Basic blocks" | "Manual blocks" | "Audacity UI";
  hint?: string;
  keywords: string[];
  run(editor: Editor): void;
}

/**
 * The full slash-command registry. Every `run` delegates to the shared
 * `insertCommands` functions — the same ones the app's (now-retired)
 * floating toolbar used to call — so slash insert behavior is provably
 * identical to what the old toolbar buttons inserted.
 */
const STATIC_ITEMS: SlashItem[] = [
  {
    id: "text",
    label: "Text",
    group: "Basic blocks",
    keywords: ["text", "paragraph", "plain"],
    run: (editor) => setParagraph(editor),
  },
  {
    id: "heading-2",
    label: "Heading 2",
    group: "Basic blocks",
    hint: "##",
    keywords: ["heading", "h2", "subtitle", "title"],
    run: (editor) => setHeading(editor, 2),
  },
  {
    id: "heading-3",
    label: "Heading 3",
    group: "Basic blocks",
    hint: "###",
    keywords: ["heading", "h3", "subheading"],
    run: (editor) => setHeading(editor, 3),
  },
  {
    id: "bulleted-list",
    label: "Bulleted list",
    group: "Basic blocks",
    hint: "-",
    keywords: ["bullet", "list", "ul", "unordered"],
    run: (editor) => toggleBulletList(editor),
  },
  {
    id: "numbered-list",
    label: "Numbered list",
    group: "Basic blocks",
    hint: "1.",
    keywords: ["numbered", "list", "ol", "ordered"],
    run: (editor) => toggleOrderedList(editor),
  },
  {
    id: "code-block",
    label: "Code block",
    group: "Basic blocks",
    hint: "```",
    keywords: ["code", "codeblock", "fence", "pre"],
    run: (editor) => setCodeBlock(editor),
  },
  {
    id: "image",
    label: "Image",
    group: "Basic blocks",
    keywords: ["image", "picture", "photo", "screenshot", "img", "upload"],
    run: (editor) => insertImageViaPicker(editor),
  },
  {
    id: "callout",
    label: "Callout",
    group: "Manual blocks",
    keywords: ["callout", "info", "warning", "admonition"],
    run: (editor) => insertAdmonition(editor, "Callout", "info"),
  },
  {
    id: "note",
    label: "Note",
    group: "Manual blocks",
    keywords: ["note", "notes"],
    run: (editor) => insertAdmonition(editor, "Notes"),
  },
  {
    id: "pitfall",
    label: "Pitfall",
    group: "Manual blocks",
    keywords: ["pitfall", "pitfalls", "caution", "danger"],
    run: (editor) => insertAdmonition(editor, "Pitfalls"),
  },
  {
    id: "tip",
    label: "Tip",
    group: "Manual blocks",
    keywords: ["tip", "tips", "tricks", "hint"],
    run: (editor) => insertAdmonition(editor, "TipsAndTricks"),
  },
  {
    id: "best-practice",
    label: "Best practice",
    group: "Manual blocks",
    keywords: ["best", "practice", "bestpractice", "recommend"],
    run: (editor) => insertAdmonition(editor, "BestPractices"),
  },
  {
    id: "tabs",
    label: "Tabs",
    group: "Manual blocks",
    keywords: ["tabs", "tab", "platform", "windows", "macos"],
    run: (editor) => insertTabs(editor),
  },
  {
    id: "shortcut",
    label: "Shortcut",
    group: "Manual blocks",
    keywords: ["shortcut", "keys", "keyboard", "hotkey"],
    run: (editor) => insertShortcut(editor),
  },
];

/**
 * "Audacity UI" rows are generated from the curated metadata so the menu
 * and the registry can never drift: adding an entry to UI_EXAMPLE_META is
 * all it takes to surface it here (id prefixed `ui-` to avoid colliding
 * with hand-written item ids).
 */
const UI_EXAMPLE_ITEMS: SlashItem[] = UI_EXAMPLE_META.map((meta) => ({
  id: `ui-${meta.id}`,
  label: meta.label,
  group: "Audacity UI",
  hint: meta.hint,
  keywords: meta.keywords,
  run: (editor) => insertUIExample(editor, meta.id, meta.variants[0]!.id),
}));

export const SLASH_ITEMS: SlashItem[] = [...STATIC_ITEMS, ...UI_EXAMPLE_ITEMS];

/**
 * Case-insensitive filter over `SLASH_ITEMS`, matching against the label or
 * any keyword (substring match, e.g. "call" matches "Callout" via its
 * label). An empty/whitespace-only query returns every item, preserving
 * `SLASH_ITEMS`' declared group order.
 */
export function filterSlashItems(query: string): SlashItem[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return SLASH_ITEMS;
  return SLASH_ITEMS.filter((item) => {
    if (item.label.toLowerCase().includes(normalized)) return true;
    return item.keywords.some((keyword) =>
      keyword.toLowerCase().includes(normalized),
    );
  });
}
