import { expect, test } from "bun:test";
import { render, screen, waitFor, within } from "@testing-library/react";
import { Editor } from "../Editor";
import { displaySrc } from "./ImageView";

test("displaySrc proxies a repo-relative path through /api/asset", () => {
  expect(displaySrc("src/assets/img/manual/basics/x/shot.png")).toBe(
    `/api/asset?path=${encodeURIComponent(
      "src/assets/img/manual/basics/x/shot.png",
    )}`,
  );
});

test("displaySrc leaves absolute https:// URLs untouched", () => {
  expect(displaySrc("https://example.com/foo.png")).toBe(
    "https://example.com/foo.png",
  );
});

test("displaySrc leaves root-relative (/...) URLs untouched", () => {
  expect(displaySrc("/images/foo.png")).toBe("/images/foo.png");
});

test("displaySrc leaves data: URIs untouched", () => {
  const dataUri = "data:image/png;base64,AAAA";
  expect(displaySrc(dataUri)).toBe(dataUri);
});

test("displaySrc passes through an empty src unchanged (no proxy for a missing image)", () => {
  expect(displaySrc("")).toBe("");
});

/**
 * Mount-level coverage mirroring `nodeviews.test.tsx`'s tabs/preserved
 * tests: a real corpus-shaped MDX doc through `Editor.tsx`'s full chain
 * (`parseMdx` -> `mdastToDoc` -> `buildAppExtensions` -> `useEditor`),
 * proving the `image` node view is actually registered and renders both the
 * proxied `<img src>` and the alt-text caption.
 */
const source = `# Test page

![A screenshot of the toolbar](src/assets/img/manual/basics/x/shot.png)
`;

test("image node view renders a proxied <img> plus an alt-text caption", async () => {
  render(
    <Editor
      source={source}
      path="image-test"
      onAddSubpage={() => {}}
      hasChildren={false}
      onDeleted={() => {}}
    />,
  );
  const editorEl = await waitFor(() => screen.getByTestId("editor"));

  const block = await waitFor(() =>
    within(editorEl).getByTestId("image-block"),
  );
  expect(block.getAttribute("contenteditable")).toBe("false");

  const img = block.querySelector("img");
  expect(img).not.toBeNull();
  expect(img?.getAttribute("src")).toBe(
    `/api/asset?path=${encodeURIComponent(
      "src/assets/img/manual/basics/x/shot.png",
    )}`,
  );
  expect(img?.getAttribute("alt")).toBe("A screenshot of the toolbar");
  expect(block.textContent).toContain("A screenshot of the toolbar");
});
