import { parseFrontmatter } from "./frontmatter";
import {
  serializeFrontmatter,
  type FrontmatterData,
} from "../adapter/frontmatterSerialize";

/**
 * Coerces a raw parsed-frontmatter record (`parseFrontmatter`'s loosely
 * typed `data`) into `FrontmatterData` using the same rules the editor uses
 * elsewhere in this backend (see `inMemoryBackend.ts`'s `metaFromSource`):
 * `title`/`section` are strings (falling back to `""` when absent or the
 * wrong type — real corpus files always have both, this only matters for
 * the no-frontmatter edge case), `sectionOrder`/`order` are numbers, `draft`
 * is a boolean. Unlike `metaFromSource` (which defaults missing
 * `order`/`sectionOrder` to 99 for listing/sorting purposes), a genuinely
 * absent optional key stays `undefined` here — `serializeFrontmatter`
 * already treats "absent" and "equal to the 99 default" the same way when
 * emitting, and staying `undefined` preserves round-trip fidelity for a
 * source file that never had the key.
 */
function coerce(data: Record<string, unknown>): FrontmatterData {
  return {
    title: typeof data.title === "string" ? data.title : "",
    description:
      typeof data.description === "string" ? data.description : undefined,
    section: typeof data.section === "string" ? data.section : "",
    sectionOrder:
      typeof data.sectionOrder === "number" ? data.sectionOrder : undefined,
    order: typeof data.order === "number" ? data.order : undefined,
    draft: typeof data.draft === "boolean" ? data.draft : undefined,
  };
}

/**
 * Rewrites (a subset of) `source`'s YAML frontmatter, leaving the body
 * bytes completely untouched — used by `reorderPages`/`movePage` on both
 * backends to patch `order`/`section`/`sectionOrder` without going through
 * the editor's document round-trip (which would reformat the body).
 *
 * Only the keys present in `patch` are changed; every other key keeps its
 * existing (coerced) value, and an optional key that was absent in `source`
 * and isn't in `patch` stays absent in the output. A `source` with no
 * frontmatter block at all (`parseFrontmatter` returns `data: {}`, the
 * whole source as `body`) gets a fresh block prepended.
 */
export function rewriteFrontmatter(
  source: string,
  patch: Partial<FrontmatterData>,
): string {
  const { data, body } = parseFrontmatter(source);
  const merged: FrontmatterData = { ...coerce(data), ...patch };
  return `${serializeFrontmatter(merged)}\n${body}`;
}
