/*
  The manual's three documentation streams, mirroring
  src/components/manual/streams.ts on the site. Kept as a copy rather than an
  import because the editor is a separate Vite app with its own build — but the
  values must stay in step with the site's content schema, which is the source
  of truth.
*/
export const STREAMS = [
  { id: "getting-started", label: "Getting started" },
  { id: "how-to", label: "How-to" },
  { id: "reference", label: "Reference" },
] as const;

export type StreamId = (typeof STREAMS)[number]["id"];

/** Matches the content collection's `stream` default. */
export const DEFAULT_STREAM: StreamId = "reference";

export function isStreamId(value: unknown): value is StreamId {
  return STREAMS.some((s) => s.id === value);
}

export function streamLabel(id: StreamId): string {
  return STREAMS.find((s) => s.id === id)?.label ?? id;
}
