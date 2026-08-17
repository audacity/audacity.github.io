import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import type { Editor } from "@tiptap/core";
import type { BlockAction } from "./blockActions";

/** Rendered group order — matches the task brief: transform, edit, move,
 * danger (danger — `delete` — always sits last and is styled red, mirroring
 * Notion's convention of keeping the destructive action furthest from the
 * pointer's natural rest position after opening the menu). */
const GROUP_ORDER: BlockAction["group"][] = [
  "transform",
  "edit",
  "move",
  "danger",
];

export interface HandleMenuProps {
  editor: Editor;
  actions: BlockAction[];
  /** Anchor rect (e.g. the drag handle button's `getBoundingClientRect()`)
   * the popup positions itself just below/right of, in viewport (`fixed`)
   * coordinates. */
  anchorRect: DOMRect;
  onClose: () => void;
}

/**
 * The block-handle context menu: a small `fixed`-positioned popup (portaled
 * to `document.body`, same pattern as `SlashMenu.tsx`'s `renderSlashMenu`)
 * listing `getBlockActions`' rows for whichever block the handle was
 * clicked on. Reuses the `.slash-menu`/`.slash-menu__item` visual language
 * via shared classes, layered with `.handle-menu`-prefixed classes for the
 * bits that differ (group dividers instead of group headers, a red
 * "danger" row).
 *
 * Keyboard: ↑/↓ move the active row (wrapping), Enter runs it, Esc closes.
 * Mouse: hover sets the active row, click runs it. Click-away (a
 * `mousedown` outside the menu) closes without running anything.
 */
export function HandleMenu({
  editor,
  actions,
  anchorRect,
  onClose,
}: HandleMenuProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // A fresh `actions` array arrives whenever the hovered block changes
  // while the menu happens to still be open; reset to the top row so the
  // active index never points past the new list's end.
  useEffect(() => {
    setActiveIndex(0);
  }, [actions]);

  function runIndex(index: number) {
    const action = actions[index];
    if (!action) return;
    action.run(editor);
    onClose();
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (actions.length === 0) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((current) => (current + 1) % actions.length);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex(
          (current) => (current - 1 + actions.length) % actions.length,
        );
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        runIndex(activeIndex);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions, activeIndex, editor]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [onClose]);

  const groups = GROUP_ORDER.map((group) => ({
    group,
    groupActions: actions.filter((action) => action.group === group),
  })).filter(({ groupActions }) => groupActions.length > 0);

  const style: CSSProperties = {
    position: "fixed",
    left: `${anchorRect.right + 6}px`,
    top: `${anchorRect.top}px`,
  };

  let flatIndex = 0;

  return createPortal(
    <div
      ref={menuRef}
      className="handle-menu slash-menu"
      data-testid="handle-menu"
      role="menu"
      style={style}
    >
      {groups.map(({ group, groupActions }) => (
        <div
          className="handle-menu__group slash-menu__group"
          role="none"
          key={group}
        >
          {groupActions.map((action) => {
            const index = flatIndex;
            flatIndex += 1;
            const isActive = index === activeIndex;
            const classNames = [
              "handle-menu__item",
              "slash-menu__item",
              isActive ? "is-active" : "",
              action.group === "danger" ? "handle-menu__item--danger" : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <button
                type="button"
                key={action.id}
                role="menuitem"
                data-testid={`handle-action-${action.id}`}
                className={classNames}
                aria-selected={isActive}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => runIndex(index)}
              >
                <span className="slash-menu__label">{action.label}</span>
              </button>
            );
          })}
        </div>
      ))}
    </div>,
    document.body,
  );
}

export default HandleMenu;
