import type { StreamId } from "./streams";

/*
  Manual pages that live outside the content collection.

  The generated keyboard-shortcuts reference is an .astro page (it renders
  from src/data/au4 JSON, so it can't be a collection MDX file — that would
  collide with the [...slug].astro route and enter the manual-editor
  round-trip corpus). The sidebar builds from the collection, so pages like
  this one declare the same shape here and are merged in.
*/
export interface VirtualManualEntry {
  slug: string;
  title: string;
  section: string;
  sectionOrder: number;
  order: number;
  stream: StreamId;
}

export const VIRTUAL_MANUAL_ENTRIES: VirtualManualEntry[] = [
  {
    slug: "shortcuts",
    title: "Keyboard shortcuts",
    // After Accessibility (160): the cross-cutting reference material sits
    // at the end of the sidebar, where the old manual kept its indexes.
    section: "Reference",
    sectionOrder: 170,
    order: 1,
    stream: "reference",
  },
];
