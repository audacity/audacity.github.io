import { expect, test } from "bun:test";
import { render, fireEvent, act } from "@testing-library/react";
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
      onAddToSection={() => {}}
      onDropPlan={() => {}}
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
      onAddToSection={() => {}}
      onDropPlan={() => {}}
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
      onAddToSection={() => {}}
      onDropPlan={() => {}}
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
      onAddToSection={() => {}}
      onDropPlan={() => {}}
    />,
  );
  fireEvent.click(getByTestId("add-subpage-pmm"));
  expect(added).toEqual(["pmm"]);
});

/**
 * Task 2: drag & drop. Page buttons are `draggable`; a full drag ->
 * dragover -> drop sequence over a sibling computes a `DropPlan` (via
 * `treeDnd.ts`'s `computeDrop`, same pure logic exercised directly in
 * `treeDnd.test.ts`) and hands it to `onDropPlan`.
 *
 * `dataTransfer` round-trips fine through `fireEvent.dragStart`/`.drop` in
 * this happy-dom setup (confirmed experimentally: the event that arrives
 * carries a working `DataTransfer`-shaped object). `dragover` is different:
 * `PageList`'s zone math needs `event.clientY`, but `fireEvent.dragOver(el,
 * { clientY })` here produces a plain `Event` with no mouse-position
 * properties at all (verified by inspecting what the listener actually
 * receives) — `clientY` never makes it through, regardless of what's passed
 * in the second argument. Dispatching a real `MouseEvent("dragover", {
 * clientY, bubbles: true })` directly (wrapped in `act` since it's not a
 * `fireEvent` call) sidesteps that and reaches the handler correctly; React
 * only cares that a "dragover"-named native event arrived with the expected
 * properties; it doesn't require an actual `DragEvent` instance.
 */
function dataTransferStub() {
  return { effectAllowed: "", setData: () => {}, getData: () => "" };
}

/** `PageList`'s row rects are all-zero under happy-dom, so the sign of
 * `clientY` alone (relative to a zero top/height) is what selects the zone:
 * negative -> "before", positive -> "after", zero -> "into" (see
 * `zoneFromPointerY` in `PageList.tsx`). */
function dragOver(row: Element, clientY: number) {
  act(() => {
    row.dispatchEvent(
      new MouseEvent("dragover", { bubbles: true, cancelable: true, clientY }),
    );
  });
}

test("page buttons are draggable", () => {
  const { getByTestId } = render(
    <PageList
      pages={pages}
      onSelect={() => {}}
      activePath={null}
      onAddSubpage={() => {}}
      onAddToSection={() => {}}
      onDropPlan={() => {}}
    />,
  );
  expect(getByTestId("page-pmm").getAttribute("draggable")).toBe("true");
});

test("dragging a root page and dropping it after a sibling invokes onDropPlan with a reorder plan", () => {
  const rootPages = [page("a", { order: 1 }), page("b", { order: 2 })];
  const plans: unknown[] = [];
  const { getByTestId } = render(
    <PageList
      pages={rootPages}
      onSelect={() => {}}
      activePath={null}
      onAddSubpage={() => {}}
      onAddToSection={() => {}}
      onDropPlan={(plan) => plans.push(plan)}
    />,
  );

  fireEvent.dragStart(getByTestId("page-a"), {
    dataTransfer: dataTransferStub(),
  });
  const targetRow = getByTestId("page-b").closest(".sidebar-tree__row")!;
  dragOver(targetRow, 10); // positive -> "after"
  fireEvent.drop(targetRow);

  expect(plans).toEqual([
    {
      kind: "reorder",
      updates: [
        { path: "src/content/manual/b.mdx", order: 1 },
        { path: "src/content/manual/a.mdx", order: 2 },
      ],
    },
  ]);
});

test("dropping a page onto its own descendant is blocked and never calls onDropPlan", () => {
  const plans: unknown[] = [];
  const { getByTestId } = render(
    <PageList
      pages={pages}
      onSelect={() => {}}
      activePath={null}
      onAddSubpage={() => {}}
      onAddToSection={() => {}}
      onDropPlan={(plan) => plans.push(plan)}
    />,
  );

  fireEvent.click(getByTestId("toggle-pmm"));
  fireEvent.dragStart(getByTestId("page-pmm"), {
    dataTransfer: dataTransferStub(),
  });
  const targetRow = getByTestId("page-pmm/home").closest(".sidebar-tree__row")!;
  dragOver(targetRow, 0); // "into" zone; blocked regardless — pmm/home is pmm's own descendant
  expect(targetRow.className).toContain("sidebar-tree__row--drop-blocked");

  fireEvent.drop(targetRow);
  expect(plans).toEqual([]);
});

test("each section header has a '+' that calls onAddToSection with the section name", () => {
  const added: string[] = [];
  const twoSections = [
    ...pages,
    page("special/expected-uses", {
      title: "Expected uses",
      section: "Special Uses",
      sectionOrder: 2,
    }),
  ];
  const { getAllByTestId } = render(
    <PageList
      pages={twoSections}
      onSelect={() => {}}
      activePath={null}
      onAddSubpage={() => {}}
      onAddToSection={(s) => added.push(s)}
      onDropPlan={() => {}}
    />,
  );
  const buttons = getAllByTestId("section-add-page");
  expect(buttons).toHaveLength(2);
  expect(buttons[0]!.getAttribute("aria-label")).toBe("Add page to PMM");
  fireEvent.click(buttons[1]!);
  expect(added).toEqual(["Special Uses"]);
});
