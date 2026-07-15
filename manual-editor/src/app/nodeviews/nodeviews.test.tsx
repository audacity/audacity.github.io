import { expect, test } from "bun:test";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { Editor } from "../Editor";

/**
 * Mounts a self-contained (not corpus-derived) MDX doc through the real
 * `Editor` component — same path `App.test.tsx` exercises — so these tests
 * cover the whole chain (parseMdx -> mdastToDoc -> buildAppExtensions ->
 * TipTap `useEditor`) for the two D3 node views, not just the components in
 * isolation. Uses a small synthetic source (not `installing-ffmpeg.mdx`)
 * to keep the doc under test minimal and the assertions legible; the full
 * corpus (including the real heavy-Tabs page) is separately covered by
 * `editor-mount.test.tsx`'s schema-validity + mount gate.
 */
const source = `# Test page

<Tabs>
  <Tab label="Windows">

Windows steps.

  </Tab>
  <Tab label="macOS">

macOS steps.

  </Tab>
</Tabs>

<UIMap client:load src="foo.png" hotspots={[{ n: 1 }]} />
`;

test("tabs node view renders switchable headers and shows only the active panel", async () => {
  render(<Editor source={source} path="tabs-test" />);
  const editorEl = await waitFor(() => screen.getByTestId("editor"));

  const tabs = await waitFor(() => within(editorEl).getByTestId("tabs"));
  const panels = within(tabs).getAllByTestId("tab");
  expect(panels).toHaveLength(2);

  // First panel active by default, second hidden.
  expect(panels[0]?.getAttribute("data-active")).toBe("true");
  expect(panels[1]?.getAttribute("data-active")).toBe("false");
  expect(panels[0]?.textContent).toContain("Windows steps.");

  const headers = within(tabs).getAllByRole("button");
  expect(headers.map((h) => h.textContent)).toEqual(["Windows", "macOS"]);

  fireEvent.click(headers[1]!);

  await waitFor(() => {
    expect(panels[0]?.getAttribute("data-active")).toBe("false");
    expect(panels[1]?.getAttribute("data-active")).toBe("true");
  });
});

test("preserved node view shows a read-only card with the component name and MDX source", async () => {
  render(<Editor source={source} path="preserved-test" />);
  const editorEl = await waitFor(() => screen.getByTestId("editor"));

  const preserved = await waitFor(() =>
    within(editorEl).getByTestId("preserved"),
  );
  expect(preserved.getAttribute("data-preserved-name")).toBe("UIMap");
  expect(preserved.getAttribute("contenteditable")).toBe("false");
  expect(preserved.textContent).toContain("Preserved: UIMap");

  const details = preserved.querySelector("details");
  expect(details).not.toBeNull();
  fireEvent.click(preserved.querySelector("summary")!);
  await waitFor(() => {
    expect(details?.open).toBe(true);
  });
  expect(preserved.querySelector("pre")?.textContent).toContain("UIMap");
});
