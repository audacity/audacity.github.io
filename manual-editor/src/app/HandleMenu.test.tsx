/**
 * Covers everything about the popup that's testable without the real
 * `Editor.tsx` click wiring: rendering/grouping, click-to-run, and the
 * document-level keydown/mousedown listeners it registers for ↑/↓/Enter/Esc
 * and click-away. Mirrors `slash/SlashMenu.test.tsx`'s approach for the
 * sibling `/` command popup. `editor` is a real headless `Editor` (same
 * "detached `<div>`" construction `blockActions.test.tsx` uses) so
 * `action.run(editor)` has something real to operate against, even though
 * these tests only assert on the menu's own DOM/behavior.
 */
import { expect, mock, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import { Editor } from "@tiptap/core";
import { buildAppExtensions } from "./editorExtensions";
import { HandleMenu } from "./HandleMenu";
import type { BlockAction } from "./blockActions";

function makeEditor(): Editor {
  return new Editor({
    element: document.createElement("div"),
    extensions: buildAppExtensions(),
    content: "<p>Some text.</p>",
  });
}

const anchorRect = {
  left: 10,
  right: 34,
  top: 20,
  bottom: 44,
  width: 24,
  height: 24,
  x: 10,
  y: 20,
  toJSON() {
    return this;
  },
} as DOMRect;

function makeActions(run: ReturnType<typeof mock>): BlockAction[] {
  return [
    { id: "turn-h2", label: "Turn into Heading 2", group: "transform", run },
    { id: "duplicate", label: "Duplicate", group: "edit", run },
    { id: "move-up", label: "Move up", group: "move", run },
    { id: "delete", label: "Delete", group: "danger", run },
  ];
}

test("renders every action, grouped, with data-testid rows", () => {
  const editor = makeEditor();
  const actions = makeActions(mock(() => {}));
  render(
    <HandleMenu
      editor={editor}
      actions={actions}
      anchorRect={anchorRect}
      onClose={() => {}}
    />,
  );

  expect(screen.getByTestId("handle-menu")).toBeDefined();
  for (const action of actions) {
    expect(screen.getByTestId(`handle-action-${action.id}`)).toBeDefined();
  }
});

test("groups render in transform, edit, move, danger order", () => {
  const editor = makeEditor();
  const actions = makeActions(mock(() => {}));
  render(
    <HandleMenu
      editor={editor}
      actions={actions}
      anchorRect={anchorRect}
      onClose={() => {}}
    />,
  );

  const menu = screen.getByTestId("handle-menu");
  const rendered = Array.from(
    menu.querySelectorAll("[data-testid^='handle-action-']"),
  ).map((el) => el.getAttribute("data-testid"));
  expect(rendered).toEqual([
    "handle-action-turn-h2",
    "handle-action-duplicate",
    "handle-action-move-up",
    "handle-action-delete",
  ]);
});

test("the danger action is styled distinctly", () => {
  const editor = makeEditor();
  const actions = makeActions(mock(() => {}));
  render(
    <HandleMenu
      editor={editor}
      actions={actions}
      anchorRect={anchorRect}
      onClose={() => {}}
    />,
  );

  expect(screen.getByTestId("handle-action-delete").className).toContain(
    "handle-menu__item--danger",
  );
  expect(screen.getByTestId("handle-action-move-up").className).not.toContain(
    "handle-menu__item--danger",
  );
});

test("clicking a row runs the action against the editor and closes the menu", () => {
  const editor = makeEditor();
  const run = mock((_editor: Editor) => {});
  const actions = makeActions(run);
  const onClose = mock(() => {});
  render(
    <HandleMenu
      editor={editor}
      actions={actions}
      anchorRect={anchorRect}
      onClose={onClose}
    />,
  );

  fireEvent.click(screen.getByTestId("handle-action-duplicate"));

  expect(run).toHaveBeenCalledTimes(1);
  expect(run.mock.calls[0]?.[0]).toBe(editor);
  expect(onClose).toHaveBeenCalledTimes(1);
});

test("the first row is active by default", () => {
  const editor = makeEditor();
  const actions = makeActions(mock(() => {}));
  render(
    <HandleMenu
      editor={editor}
      actions={actions}
      anchorRect={anchorRect}
      onClose={() => {}}
    />,
  );

  expect(
    screen.getByTestId(`handle-action-${actions[0]?.id}`).className,
  ).toContain("is-active");
});

test("ArrowDown then Enter runs the second row", () => {
  const editor = makeEditor();
  const run = mock((_editor: Editor) => {});
  const actions = makeActions(run);
  const onClose = mock(() => {});
  render(
    <HandleMenu
      editor={editor}
      actions={actions}
      anchorRect={anchorRect}
      onClose={onClose}
    />,
  );

  fireEvent.keyDown(document, { key: "ArrowDown" });
  expect(
    screen.getByTestId(`handle-action-${actions[1]?.id}`).className,
  ).toContain("is-active");

  fireEvent.keyDown(document, { key: "Enter" });
  expect(run).toHaveBeenCalledTimes(1);
  expect(onClose).toHaveBeenCalledTimes(1);
});

test("ArrowUp from the first row wraps to the last row", () => {
  const editor = makeEditor();
  const actions = makeActions(mock(() => {}));
  render(
    <HandleMenu
      editor={editor}
      actions={actions}
      anchorRect={anchorRect}
      onClose={() => {}}
    />,
  );

  fireEvent.keyDown(document, { key: "ArrowUp" });
  const lastAction = actions[actions.length - 1];
  expect(
    screen.getByTestId(`handle-action-${lastAction?.id}`).className,
  ).toContain("is-active");
});

test("Escape closes the menu without running anything", () => {
  const editor = makeEditor();
  const run = mock((_editor: Editor) => {});
  const actions = makeActions(run);
  const onClose = mock(() => {});
  render(
    <HandleMenu
      editor={editor}
      actions={actions}
      anchorRect={anchorRect}
      onClose={onClose}
    />,
  );

  fireEvent.keyDown(document, { key: "Escape" });

  expect(run).not.toHaveBeenCalled();
  expect(onClose).toHaveBeenCalledTimes(1);
});

test("a mousedown outside the menu closes it (click-away)", () => {
  const editor = makeEditor();
  const actions = makeActions(mock(() => {}));
  const onClose = mock(() => {});
  render(
    <HandleMenu
      editor={editor}
      actions={actions}
      anchorRect={anchorRect}
      onClose={onClose}
    />,
  );

  fireEvent.mouseDown(document.body);

  expect(onClose).toHaveBeenCalledTimes(1);
});

test("a mousedown inside the menu does not close it", () => {
  const editor = makeEditor();
  const actions = makeActions(mock(() => {}));
  const onClose = mock(() => {});
  render(
    <HandleMenu
      editor={editor}
      actions={actions}
      anchorRect={anchorRect}
      onClose={onClose}
    />,
  );

  fireEvent.mouseDown(screen.getByTestId("handle-action-duplicate"));

  expect(onClose).not.toHaveBeenCalled();
});
