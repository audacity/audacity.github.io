/*
  Display metadata for the three documentation modes. Kept beside the manual
  components rather than in the content config so the schema stays a schema and
  this stays presentation.
*/
export const STREAMS = [
  {
    id: "getting-started",
    label: "Getting started",
    blurb: "New to Audacity? Start here and make your first recording.",
  },
  {
    id: "how-to",
    label: "How-to",
    blurb: "Short guides for specific tasks, once you know your way around.",
  },
  {
    id: "reference",
    label: "Reference",
    blurb: "Every menu, toolbar and panel, described in detail.",
  },
] as const;

export type StreamId = (typeof STREAMS)[number]["id"];
export const DEFAULT_STREAM: StreamId = "reference";
