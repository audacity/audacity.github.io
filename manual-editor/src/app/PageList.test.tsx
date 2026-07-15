import { expect, test } from "bun:test";
import { render, fireEvent } from "@testing-library/react";
import { PageList } from "./PageList";
import type { ManualPageMeta } from "../backend/types";

function page(
  slug: string,
  extra: Partial<ManualPageMeta> = {},
): ManualPageMeta {
  return {
    slug,
    path: `src/content/manual/${slug}.mdx`,
    title: slug.split("/").pop()!,
    section: "PMM",
    sectionOrder: 1,
    order: 1,
    draft: false,
    hasDraft: false,
    ...extra,
  };
}

const pages = [
  page("pmm", { title: "Project Management Menu", order: 1 }),
  page("pmm/home", { title: "Home", order: 2 }),
  page("pmm/project", { title: "Project", order: 3 }),
];

test("nests children under their parent and toggles expansion", () => {
  const { getByTestId, queryByTestId } = render(
    <PageList
      pages={pages}
      onSelect={() => {}}
      activePath={null}
      onAddSubpage={() => {}}
    />,
  );
  // Parent visible; children collapsed (parent not on active path):
  expect(getByTestId("page-pmm")).toBeDefined();
  expect(queryByTestId("page-pmm/home")).toBeNull();
  // Expand the parent:
  fireEvent.click(getByTestId("toggle-pmm"));
  expect(getByTestId("page-pmm/home")).toBeDefined();
});

test("auto-expands the active page's ancestors", () => {
  const { getByTestId } = render(
    <PageList
      pages={pages}
      onSelect={() => {}}
      activePath="src/content/manual/pmm/home.mdx"
      onAddSubpage={() => {}}
    />,
  );
  // Child is visible without manual expansion because it's the active page:
  expect(getByTestId("page-pmm/home")).toBeDefined();
});

test("selecting a node calls onSelect with its path", () => {
  const selected: string[] = [];
  const { getByTestId } = render(
    <PageList
      pages={pages}
      onSelect={(p) => selected.push(p)}
      activePath={null}
      onAddSubpage={() => {}}
    />,
  );
  fireEvent.click(getByTestId("page-pmm"));
  expect(selected).toEqual(["src/content/manual/pmm.mdx"]);
});

test("clicking a node's add-subpage button calls onAddSubpage with that page", () => {
  const added: string[] = [];
  const { getByTestId } = render(
    <PageList
      pages={pages}
      onSelect={() => {}}
      activePath={null}
      onAddSubpage={(p) => added.push(p.slug)}
    />,
  );
  fireEvent.click(getByTestId("add-subpage-pmm"));
  expect(added).toEqual(["pmm"]);
});
