/*
  Display metadata for the documentation modes. Kept beside the manual
  components rather than in the content config so the schema stays a schema and
  this stays presentation.

  Three streams make up the manual proper and live under /manual. The fourth,
  plugins, is the directory of third-party and downloadable plugins that came
  over from plugins.audacityteam.org: it shares the collection, sidebar, search
  and pagination with the manual but is its own space at /plugins, so it is
  marked standalone and stays out of the manual's stream switcher and landing
  cards.
*/
export const STREAMS = [
  {
    id: "getting-started",
    label: "Getting started",
    blurb: "New to Audacity? Start here and make your first recording.",
    base: "/manual",
    standalone: false,
  },
  {
    id: "how-to",
    label: "How-to",
    blurb: "Short guides for specific tasks, once you know your way around.",
    base: "/manual",
    standalone: false,
  },
  {
    id: "reference",
    label: "Reference",
    blurb: "Every menu, toolbar and panel, described in detail.",
    base: "/manual",
    standalone: false,
  },
  {
    id: "plugins",
    label: "Plugins",
    blurb:
      "Third-party effects, downloadable Nyquist plugins and how to write your own.",
    base: "/plugins",
    standalone: true,
  },
] as const;

export type StreamId = (typeof STREAMS)[number]["id"];
export const DEFAULT_STREAM: StreamId = "reference";

export function streamMeta(id: StreamId) {
  return STREAMS.find((s) => s.id === id) ?? STREAMS[2];
}

/*
  The address of a collection entry. Manual pages sit at /manual/<id>. Plugin
  pages keep their files under src/content/manual/plugins/ (one collection, one
  set of components) but the "plugins/" folder is the stream's root, so it
  drops out of the address: plugins/realtime-effects/filters → /plugins/realtime-effects/filters,
  and the stream's own index page, plugins, → /plugins.
*/
export function hrefFor(stream: StreamId, id: string): string {
  const { base } = streamMeta(stream);
  if (base === "/manual") return `/manual/${id}`;
  const root = base.slice(1);
  if (id === root) return base;
  return id.startsWith(`${root}/`)
    ? `${base}/${id.slice(root.length + 1)}`
    : `${base}/${id}`;
}

/* The pagefind `type:` value each stream's pages are indexed under. */
export function searchFilterFor(stream: StreamId): string {
  return streamMeta(stream).standalone ? streamMeta(stream).label : "Manual";
}
