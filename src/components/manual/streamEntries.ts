import { getCollection } from "astro:content";
import { STREAMS, type StreamId } from "./streams";

/*
  Where each documentation stream starts.

  The sidebar switcher, the /manual landing cards and the /help hub all need
  "the first published page of this stream", and all three were computing it
  separately. A stream with nothing published yet has no entry point — callers
  render it as coming-soon rather than linking nowhere.

  Entry order follows sectionOrder then order then slug, the same ordering the
  sidebar tree uses, so the link always lands on whatever the reader would see
  at the top of that stream's contents.
*/
export interface StreamEntryPoint {
  id: StreamId;
  label: string;
  blurb: string;
  count: number;
  href: string;
}

export async function getStreamEntryPoints(): Promise<StreamEntryPoint[]> {
  const entries = await getCollection("manual", ({ data }) => !data.draft);
  return STREAMS.map((s) => {
    const pages = entries
      .filter((e) => e.data.stream === s.id)
      .sort((a, b) => {
        if (a.data.sectionOrder !== b.data.sectionOrder)
          return a.data.sectionOrder - b.data.sectionOrder;
        if (a.data.order !== b.data.order) return a.data.order - b.data.order;
        return a.id.localeCompare(b.id);
      });
    return {
      id: s.id,
      label: s.label,
      blurb: s.blurb,
      count: pages.length,
      href: `/manual/${s.id}`,
    };
  });
}
