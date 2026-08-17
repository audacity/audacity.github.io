import { expect, mock, test } from "bun:test";
import { createRef } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { SlashMenuList } from "./SlashMenu";
import type { SlashMenuListHandle, SlashCommandSelection } from "./SlashMenu";
import { SLASH_ITEMS } from "./slashItems";

/**
 * Covers everything about the popup that's testable without the real
 * suggestion plugin/ProseMirror keydown pipeline: rendering, grouping,
 * click-to-select, and the imperative `onKeyDown` handle the suggestion
 * glue (`renderSlashMenu` in `SlashMenu.tsx`) forwards matching keys to.
 * Caret-relative fixed positioning via `clientRect()` and the live `/`
 * trigger inside a real editor are browser-verified in Task 2 (per the
 * task brief) rather than fought through happy-dom here.
 */

function fakeKeyDown(
  key: string,
): Parameters<SlashMenuListHandle["onKeyDown"]>[0] {
  return {
    view: {} as never,
    range: { from: 0, to: 0 },
    event: new KeyboardEvent("keydown", { key }),
  };
}

test("renders every item, grouped, with data-testid rows and right-aligned hints", () => {
  render(<SlashMenuList items={SLASH_ITEMS} command={() => {}} />);

  expect(screen.getByTestId("slash-menu")).toBeDefined();
  for (const item of SLASH_ITEMS) {
    expect(screen.getByTestId(`slash-item-${item.id}`)).toBeDefined();
  }
  expect(screen.getByText("##")).toBeDefined(); // Heading 2's hint
  expect(screen.getByText("Basic blocks")).toBeDefined();
  expect(screen.getByText("Manual blocks")).toBeDefined();
});

test("shows a 'No results' row when items is empty", () => {
  render(<SlashMenuList items={[]} command={() => {}} />);
  expect(screen.getByTestId("slash-menu-empty")).toBeDefined();
  expect(screen.getByText("No results")).toBeDefined();
});

test("clicking a row invokes command with that item", () => {
  const command = mock((_selection: SlashCommandSelection) => {});
  render(<SlashMenuList items={SLASH_ITEMS} command={command} />);

  fireEvent.click(screen.getByTestId("slash-item-tabs"));

  expect(command).toHaveBeenCalledTimes(1);
  expect(command.mock.calls[0][0].item.id).toBe("tabs");
});

test("the first row is active by default", () => {
  render(<SlashMenuList items={SLASH_ITEMS} command={() => {}} />);
  const firstItem = screen.getByTestId(`slash-item-${SLASH_ITEMS[0].id}`);
  expect(firstItem.className).toContain("is-active");
});

test("ArrowDown advances the active row, and Enter selects it via the exposed onKeyDown handle", () => {
  const command = mock((_selection: SlashCommandSelection) => {});
  const ref = createRef<SlashMenuListHandle>();
  render(<SlashMenuList ref={ref} items={SLASH_ITEMS} command={command} />);

  act(() => {
    ref.current?.onKeyDown(fakeKeyDown("ArrowDown"));
  });

  const secondItem = screen.getByTestId(`slash-item-${SLASH_ITEMS[1].id}`);
  expect(secondItem.className).toContain("is-active");

  act(() => {
    ref.current?.onKeyDown(fakeKeyDown("Enter"));
  });

  expect(command).toHaveBeenCalledTimes(1);
  expect(command.mock.calls[0][0].item.id).toBe(SLASH_ITEMS[1].id);
});

test("ArrowUp from the first row wraps to the last row", () => {
  const command = mock((_selection: SlashCommandSelection) => {});
  const ref = createRef<SlashMenuListHandle>();
  render(<SlashMenuList ref={ref} items={SLASH_ITEMS} command={command} />);

  act(() => {
    ref.current?.onKeyDown(fakeKeyDown("ArrowUp"));
  });

  const lastItem = SLASH_ITEMS[SLASH_ITEMS.length - 1];
  expect(screen.getByTestId(`slash-item-${lastItem.id}`).className).toContain(
    "is-active",
  );

  act(() => {
    ref.current?.onKeyDown(fakeKeyDown("Enter"));
  });

  expect(command.mock.calls[0][0].item.id).toBe(lastItem.id);
});

test("ArrowDown from the last row wraps to the first row", () => {
  const ref = createRef<SlashMenuListHandle>();
  render(<SlashMenuList ref={ref} items={SLASH_ITEMS} command={() => {}} />);

  for (let i = 0; i < SLASH_ITEMS.length; i += 1) {
    act(() => {
      ref.current?.onKeyDown(fakeKeyDown("ArrowDown"));
    });
  }

  expect(
    screen.getByTestId(`slash-item-${SLASH_ITEMS[0].id}`).className,
  ).toContain("is-active");
});

test("Escape is reported as handled but does not select anything", () => {
  const command = mock((_selection: SlashCommandSelection) => {});
  const ref = createRef<SlashMenuListHandle>();
  render(<SlashMenuList ref={ref} items={SLASH_ITEMS} command={command} />);

  let handled: boolean | undefined;
  act(() => {
    handled = ref.current?.onKeyDown(fakeKeyDown("Escape"));
  });

  expect(handled).toBe(true);
  expect(command).not.toHaveBeenCalled();
});

test("an unrelated key is reported as unhandled", () => {
  const ref = createRef<SlashMenuListHandle>();
  render(<SlashMenuList ref={ref} items={SLASH_ITEMS} command={() => {}} />);

  let handled: boolean | undefined;
  act(() => {
    handled = ref.current?.onKeyDown(fakeKeyDown("a"));
  });

  expect(handled).toBe(false);
});

test("the active row resets to the first item whenever the items list changes (e.g. a new query)", () => {
  const ref = createRef<SlashMenuListHandle>();
  const { rerender } = render(
    <SlashMenuList ref={ref} items={SLASH_ITEMS} command={() => {}} />,
  );

  act(() => {
    ref.current?.onKeyDown(fakeKeyDown("ArrowDown"));
  });
  expect(
    screen.getByTestId(`slash-item-${SLASH_ITEMS[1].id}`).className,
  ).toContain("is-active");

  const filtered = SLASH_ITEMS.filter((item) => item.id === "callout");
  rerender(<SlashMenuList ref={ref} items={filtered} command={() => {}} />);

  expect(screen.getByTestId("slash-item-callout").className).toContain(
    "is-active",
  );
});
