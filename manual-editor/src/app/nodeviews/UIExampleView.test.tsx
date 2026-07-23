// manual-editor/src/app/nodeviews/UIExampleView.test.tsx
/**
 * Mounts a real editor containing a `uiExample` node with the registry
 * MOCKED: the real registry (repo-root registry.tsx) statically imports
 * @dilsonspickles/components, whose CSS side-effect imports crash bun —
 * which is exactly why UIExampleView loads it via dynamic import, giving
 * this suite a seam to mock.
 */
import { expect, mock, test } from "bun:test";
import { act, render, screen, waitFor } from "@testing-library/react";
import { EditorContent, useEditor } from "@tiptap/react";
import { buildAppExtensions } from "../editorExtensions";

mock.module("../../../../src/components/manual/UIExample/registry", () => ({
  resolveUIExample: (component: string, variant: string) =>
    component === "knob"
      ? {
          Component: (props: Record<string, unknown>) => (
            <span data-testid="fake-knob">{String(props.value)}</span>
          ),
          props: variant === "at-75" ? { value: 75 } : { value: 50 },
          meta: {
            id: "knob",
            label: "Knob",
            keywords: [],
            allowInteractive: true,
            variants: [
              { id: "default", label: "Default" },
              { id: "at-75", label: "At 75%" },
            ],
          },
        }
      : null,
}));

function Host({ interactive = false }: { interactive?: boolean }) {
  const editor = useEditor({
    extensions: buildAppExtensions(),
    content: {
      type: "doc",
      content: [
        {
          type: "uiExample",
          attrs: { component: "knob", variant: "default", interactive },
        },
      ],
    },
  });
  return <EditorContent editor={editor} />;
}

test("renders the resolved component with the variant's props", async () => {
  render(<Host />);
  await waitFor(() =>
    expect(screen.getByTestId("fake-knob").textContent).toBe("50"),
  );
  expect(screen.getByTestId("ui-example-block")).toBeDefined();
  expect(screen.getByText("Knob")).toBeDefined();
});

test("variant dropdown lists variants and switching updates the render", async () => {
  render(<Host />);
  await waitFor(() => screen.getByTestId("ui-example-variant"));
  const select = screen.getByTestId("ui-example-variant") as HTMLSelectElement;
  expect(select.options.length).toBe(2);
  act(() => {
    select.value = "at-75";
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await waitFor(() =>
    expect(screen.getByTestId("fake-knob").textContent).toBe("75"),
  );
});

test("static blocks disable pointer events; the toggle flips interactive", async () => {
  render(<Host />);
  await waitFor(() => screen.getByTestId("ui-example-stage"));
  expect(
    (screen.getByTestId("ui-example-stage") as HTMLElement).style.pointerEvents,
  ).toBe("none");
  const toggle = screen.getByTestId("ui-example-interactive");
  act(() => {
    (toggle as HTMLButtonElement).click();
  });
  await waitFor(() =>
    expect(
      (screen.getByTestId("ui-example-stage") as HTMLElement).style
        .pointerEvents,
    ).toBe(""),
  );
});

test("unknown component falls back to an unavailable card, not a crash", async () => {
  const editorContent = {
    type: "doc",
    content: [
      {
        type: "uiExample",
        attrs: { component: "gone", variant: "default", interactive: false },
      },
    ],
  };
  function GoneHost() {
    const editor = useEditor({
      extensions: buildAppExtensions(),
      content: editorContent,
    });
    return <EditorContent editor={editor} />;
  }
  render(<GoneHost />);
  await waitFor(() =>
    expect(screen.getByText(/example unavailable/i)).toBeDefined(),
  );
});
