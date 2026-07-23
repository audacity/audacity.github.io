import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { ReactRenderer } from "@tiptap/react";
import type {
  SuggestionKeyDownProps,
  SuggestionProps,
} from "@tiptap/suggestion";
import type { ManualPageMeta } from "../../backend/types";
import { positionMenuElement } from "../menuPosition";

/** The `props.command` payload shape `pageMention.ts` configures the suggestion plugin with. */
export interface PageMentionSelection {
  page: ManualPageMeta;
}

export interface PageMentionMenuListProps {
  items: ManualPageMeta[];
  command: (selection: PageMentionSelection) => void;
}

/** Imperative handle the suggestion plugin's `onKeyDown` glue delegates to. */
export interface PageMentionMenuListHandle {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean;
}

/**
 * The `@` mention menu's popup list: a flat (ungrouped, unlike the `/`
 * menu's sectioned layout — there's no natural grouping for pages) list of
 * matching pages, each row showing the title plus a muted "section · slug"
 * line, with active-row highlight and wrapping ↑/↓ keyboard navigation.
 * Structurally a near-copy of `slash/SlashMenu.tsx`'s `SlashMenuList` — see
 * that component's doc comment for why `onKeyDown` is exposed via `ref`
 * rather than a DOM listener (the suggestion plugin owns the actual
 * `contentEditable` keydown listener and forwards matching keys here).
 */
export const PageMentionMenuList = forwardRef<
  PageMentionMenuListHandle,
  PageMentionMenuListProps
>(function PageMentionMenuList({ items, command }, ref) {
  const [activeIndex, setActiveIndex] = useState(0);

  // A fresh filtered `items` array arrives on every keystroke; reset the
  // selection to the top row (same reasoning as `SlashMenuList`).
  useEffect(() => {
    setActiveIndex(0);
  }, [items]);

  function selectIndex(index: number) {
    const page = items[index];
    if (!page) return;
    command({ page });
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
          // The plugin/renderer owns tearing the popup down on Escape (see
          // `renderPageMentionMenu`'s `onKeyDown`); just report it handled.
          return true;
        }
        return false;
      },
    }),
    [items, activeIndex],
  );

  return (
    <div
      className="slash-menu page-mention-menu"
      data-testid="page-mention-menu"
      role="listbox"
    >
      {items.length === 0 ? (
        <div
          className="slash-menu__empty"
          data-testid="page-mention-menu-empty"
        >
          No results
        </div>
      ) : (
        items.map((page, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              type="button"
              key={page.slug}
              data-testid={`page-mention-${page.slug}`}
              className={`page-mention-menu__item${isActive ? " is-active" : ""}`}
              aria-selected={isActive}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => selectIndex(index)}
            >
              <span className="page-mention-menu__title">{page.title}</span>
              <span className="page-mention-menu__meta">
                {page.section} · {page.slug}
              </span>
            </button>
          );
        })
      )}
    </div>
  );
});

/**
 * The suggestion `render()` glue: creates one `ReactRenderer`-backed popup
 * per trigger session and positions it `fixed` under the caret. Identical
 * machinery to `slash/SlashMenu.tsx`'s `renderSlashMenu` — see that
 * function's doc comment for the per-frame repositioning/lifecycle details;
 * only the rendered component and prop/selection types differ here.
 * Placement (including the flip-above-when-near-the-bottom behaviour) is
 * shared via `computeMenuPosition` — see `../menuPosition.ts`.
 */
export function renderPageMentionMenu() {
  let component: ReactRenderer<
    PageMentionMenuListHandle,
    PageMentionMenuListProps
  > | null = null;

  function updatePosition(
    props: SuggestionProps<ManualPageMeta, PageMentionSelection>,
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
    onStart: (props: SuggestionProps<ManualPageMeta, PageMentionSelection>) => {
      component = new ReactRenderer(PageMentionMenuList, {
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

    onUpdate: (
      props: SuggestionProps<ManualPageMeta, PageMentionSelection>,
    ) => {
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

export default PageMentionMenuList;
