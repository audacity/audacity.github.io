import { Fragment, useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import type { ReactNodeViewProps } from "@tiptap/react";
import { readShortcutKeys } from "../../adapter/registry";
import type { JsxAttr } from "../../adapter/registry";

/**
 * Returns `attributes` with its `keys` entry set to `keys`, preserving every
 * other attribute (notably Astro's valueless `client:load`) and their
 * original source order — appends a `keys` entry if one wasn't present.
 */
function withUpdatedKeys(
  attributes: readonly JsxAttr[],
  keys: string,
): JsxAttr[] {
  const index = attributes.findIndex((attr) => attr.name === "keys");
  if (index === -1) return [...attributes, { name: "keys", value: keys }];
  const next = [...attributes];
  next[index] = { name: "keys", value: keys };
  return next;
}

/**
 * Node view for the `shortcut` inline atom node (`<Shortcut keys="..." />`).
 * Renders the key combo as keycaps (split on "+"); clicking swaps to an
 * inline text input to edit the raw `keys` string. Since the node is
 * `atom: true` + `inline: true` it has no PM content, so this view never
 * renders `NodeViewContent` — it's a self-contained `<span>`.
 */
export function ShortcutView({ node, updateAttributes }: ReactNodeViewProps) {
  const attributes = (node.attrs.attributes ?? []) as JsxAttr[];
  const keys = readShortcutKeys(attributes);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(keys);

  function commit() {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== keys) {
      updateAttributes({ attributes: withUpdatedKeys(attributes, trimmed) });
    } else {
      setDraft(keys);
    }
  }

  if (editing) {
    return (
      <NodeViewWrapper
        as="span"
        className="shortcut shortcut--editing"
        data-testid="shortcut"
        contentEditable={false}
      >
        <input
          className="shortcut__input"
          aria-label="Shortcut keys"
          autoFocus
          value={draft}
          size={Math.max(4, draft.length)}
          onChange={(event) => setDraft(event.target.value)}
          onMouseDown={(event) => event.stopPropagation()}
          onKeyDown={(event) => {
            event.stopPropagation();
            if (event.key === "Enter") {
              event.preventDefault();
              commit();
            } else if (event.key === "Escape") {
              setDraft(keys);
              setEditing(false);
            }
          }}
          onBlur={commit}
        />
      </NodeViewWrapper>
    );
  }

  const parts = keys.split("+").filter(Boolean);

  return (
    <NodeViewWrapper
      as="span"
      className="shortcut"
      data-testid="shortcut"
      contentEditable={false}
      onClick={() => {
        setDraft(keys);
        setEditing(true);
      }}
    >
      {parts.length > 0 ? (
        parts.map((part, index) => (
          <Fragment key={`${part}-${index}`}>
            {index > 0 && <span className="shortcut__plus">+</span>}
            <kbd className="shortcut__key">{part}</kbd>
          </Fragment>
        ))
      ) : (
        <kbd className="shortcut__key shortcut__key--empty">?</kbd>
      )}
    </NodeViewWrapper>
  );
}

export default ShortcutView;
