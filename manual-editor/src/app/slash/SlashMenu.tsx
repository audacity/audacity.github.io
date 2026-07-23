import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { ReactRenderer } from "@tiptap/react";
import type {
  SuggestionKeyDownProps,
  SuggestionProps,
} from "@tiptap/suggestion";
import type { SlashItem } from "./slashItems";
import { positionMenuElement } from "../menuPosition";

/** The `props.command` payload shape `SlashCommand.ts` configures the suggestion plugin with. */
export interface SlashCommandSelection {
  item: SlashItem;
}

export interface SlashMenuListProps {
  items: SlashItem[];
  command: (selection: SlashCommandSelection) => void;
}

/** Imperative handle the suggestion plugin's `onKeyDown` glue delegates to. */
export interface SlashMenuListHandle {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean;
}

/** Declared group order the menu renders sections in — matches `SLASH_ITEMS`'. */
const GROUP_ORDER: SlashItem["group"][] = ["Basic blocks", "Manual blocks"];

/**
 * The slash menu's popup list: grouped sections with headers, a
 * right-aligned hint per row, active-row highlight, and wrapping ↑/↓
 * keyboard navigation. Exposes `onKeyDown` via `ref` (rather than listening
 * for DOM keyboard events itself) because the suggestion plugin owns the
 * actual keydown listener on the editor's `contentEditable` and forwards
 * matching keys here — the standard TipTap "command list" pattern.
 */
export const SlashMenuList = forwardRef<
  SlashMenuListHandle,
  SlashMenuListProps
>(function SlashMenuList({ items, command }, ref) {
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // A fresh filtered `items` array arrives on every keystroke; reset the
  // selection to the top row so it never points past the new list's end
  // (or at an item that scrolled out of view under the query).
  useEffect(() => {
    setActiveIndex(0);
  }, [items]);

  // Scroll the active item into view when keyboard navigation moves the
  // selection outside the visible portion of the menu.
  useEffect(() => {
    listRef.current
      ?.querySelector(".slash-menu__item.is-active")
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  function selectIndex(index: number) {
    const item = items[index];
    if (!item) return;
    command({ item });
  }

  useImperativeHandle(
    ref,
    () => ({
      onKeyDown({ event }) {
        if (items.length === 0) return false;
        if (event.key === "ArrowDown") {
          setActiveIndex((current) => (current + 1) % items.length);
          return true;
        }
        if (event.key === "ArrowUp") {
          setActiveIndex(
            (current) => (current - 1 + items.length) % items.length,
          );
          return true;
        }
        if (event.key === "Enter") {
          selectIndex(activeIndex);
          return true;
        }
        if (event.key === "Escape") {
          // The plugin/renderer owns tearing the popup down on Escape
          // (see `renderSlashMenu`'s `onKeyDown`); just report it as
          // handled so the editor doesn't also insert a literal escape.
          return true;
        }
        return false;
      },
    }),
    [items, activeIndex],
  );

  const groups = GROUP_ORDER.map((group) => ({
    group,
    groupItems: items.filter((item) => item.group === group),
  })).filter(({ groupItems }) => groupItems.length > 0);

  let flatIndex = 0;

  return (
    <div
      className="slash-menu"
      data-testid="slash-menu"
      role="listbox"
      ref={listRef}
    >
      {items.length === 0 ? (
        <div className="slash-menu__empty" data-testid="slash-menu-empty">
          No results
        </div>
      ) : (
        groups.map(({ group, groupItems }) => (
          <div className="slash-menu__group" key={group}>
            <div className="slash-menu__group-header">{group}</div>
            {groupItems.map((item) => {
              const index = flatIndex;
              flatIndex += 1;
              const isActive = index === activeIndex;
              return (
                <button
                  type="button"
                  key={item.id}
                  data-testid={`slash-item-${item.id}`}
                  className={`slash-menu__item${isActive ? " is-active" : ""}`}
                  aria-selected={isActive}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectIndex(index)}
                >
                  <span className="slash-menu__label">{item.label}</span>
                  {item.hint ? (
                    <span className="slash-menu__hint">{item.hint}</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
});

/**
 * The suggestion `render()` glue: creates one `ReactRenderer`-backed popup
 * per trigger session, positions it as a `fixed` element from
 * `props.clientRect()`, and appends it directly to `document.body` (no
 * tippy — per-frame repositioning is handled by re-reading `clientRect()` on
 * every `onUpdate`, same as the caret tracking any other fixed-position
 * popup needs).
 *
 * `render()` itself is called once per `Suggestion()` plugin instance (see
 * `@tiptap/suggestion`'s `suggestion.ts`), and the returned lifecycle
 * object is reused across every subsequent trigger session — so `component`
 * is a session-scoped mutable closure variable, nulled out in `onExit`.
 *
 * Placement (below the caret, flipping above near the viewport's bottom edge)
 * is delegated to `computeMenuPosition` — see `../menuPosition.ts`.
 */
export function renderSlashMenu() {
  let component: ReactRenderer<SlashMenuListHandle, SlashMenuListProps> | null =
    null;

  function updatePosition(
    props: SuggestionProps<SlashItem, SlashCommandSelection>,
  ) {
    if (!component) return;
    const element = component.element as HTMLElement;
    positionMenuElement(element, props.clientRect);
    // Re-measure next frame: on first open the menu's content is committed by
    // a React portal on a later tick, so the synchronous pass above sees a
    // zero-height (empty) element and can't yet decide whether to flip above.
    requestAnimationFrame(() => {
      if (!component) return;
      positionMenuElement(element, props.clientRect);
    });
  }

  return {
    onStart: (props: SuggestionProps<SlashItem, SlashCommandSelection>) => {
      component = new ReactRenderer(SlashMenuList, {
        editor: props.editor,
        props: {
          items: props.items,
          command: props.command,
        },
      });

      if (!props.clientRect) return;

      document.body.appendChild(component.element);
      updatePosition(props);
    },

    onUpdate: (props: SuggestionProps<SlashItem, SlashCommandSelection>) => {
      if (!component) return;
      component.updateProps({ items: props.items, command: props.command });
      updatePosition(props);
    },

    onKeyDown: (props: SuggestionKeyDownProps) => {
      if (!component) return false;
      if (props.event.key === "Escape") {
        component.element.remove();
        component.destroy();
        component = null;
        return true;
      }
      return component.ref?.onKeyDown(props) ?? false;
    },

    onExit: () => {
      component?.element.remove();
      component?.destroy();
      component = null;
    },
  };
}

export default SlashMenuList;
