/**
 * Shapes of the data extracted from the Audacity 4 source tree into
 * src/data/au4/*.json. The JSON is the build input for the site; the C++
 * repo is only ever the regeneration input (see scripts/au4-extract.ts).
 */

export type Au4Shortcut = {
  /** Action code, joining key to actions.json (e.g. "duplicate"). */
  action: string;
  /** Key sequences in Qt notation, e.g. "Ctrl+Shift+A". */
  sequences: string[];
  autorepeat?: boolean;
  /**
   * The XML comment heading the entry sits under ("Edit", "Playback", …) —
   * the only grouping structure shortcuts.xml has.
   */
  sourceGroup: string | null;
};

export type Au4Action = {
  /** Action code as registered (e.g. "action://trackedit/undo" or "split"). */
  code: string;
  /** Source module, derived from the defining file (e.g. "trackedit"). */
  module: string;
  title: string;
  description: string | null;
  uiContext: string | null;
  shortcutContext: string | null;
  checkable?: boolean;
};

export type Au4MenuNode =
  | {
      type: "item";
      code: string;
      /** Menu-specific label when it differs from the action title. */
      titleOverride?: string;
      /** Present (true) when the source line is commented out upstream. */
      commentedOut?: boolean;
      /** Item registered disabled in the source. */
      disabled?: boolean;
    }
  | { type: "separator" }
  | {
      type: "menu";
      title: string;
      /** Menu id from the source, e.g. "menu-file" (absent on dynamic menus). */
      id?: string;
      disabled?: boolean;
      /** Menu bar entry only present in dev-mode builds. */
      devOnly?: boolean;
      children: Au4MenuNode[];
    }
  | {
      type: "dynamic";
      /** What populates this region at runtime (e.g. "effects-registry"). */
      source: string;
    };

export type Au4Effect = {
  name: string;
  family: "builtin" | "nyquist";
  /** Registered as effect/generator/analyzer/tool where derivable. */
  kind: string | null;
  /** builtin: source dir under builtin_collection; nyquist: .ny filename. */
  source: string;
  /** builtin only: effect has a registered QML view (a real dialog). */
  hasView?: boolean;
  /** nyquist only: category token from the $type header, e.g. "eqandfilters". */
  subcategory?: string | null;
};

export type Au4PreferencePage = {
  id: string;
  title: string;
  qmlPage: string | null;
};

export type Au4Meta = {
  au4Commit: string;
  extractedAt: string;
  counts: Record<string, number>;
  warnings: string[];
};
