import { backendFor, json } from "./_shared";
import { docToSource } from "../../src/adapter/docToMdast";
import type { PMNodeJSON } from "../../src/adapter/mdastToDoc";

/**
 * `docToSource`'s `frontmatter` parameter becomes an mdast `yaml` node's
 * `value` verbatim (see `docToMdast`) — i.e. it must be the *unfenced* YAML
 * body (`"title: T\nsection: S"`), because `stringifyMdx` (via
 * `remark-frontmatter`) adds the `---`/`---` fences itself when it renders
 * that node. `serializeFrontmatter` (the form's writer, `../../src/adapter/
 * frontmatterSerialize.ts`), by contrast, is documented/tested to emit the
 * *fenced* block (`"---\ntitle: T\n...\n---\n"`) for direct string
 * concatenation onto a body (see its round-trip test: `` `${serializeFrontmatter(data)}\nBody\n` ``).
 * Passing its fenced output straight through as `docToSource`'s
 * `frontmatter` arg double-fences the YAML and corrupts every key. This
 * strips exactly the fence `serializeFrontmatter` adds, bridging the two
 * without changing either function.
 */
function unfence(frontmatter: string): string {
  return frontmatter.replace(/^---\n/, "").replace(/\n---\n?$/, "");
}

/**
 * `POST /api/draft` — the manual editor's autosave endpoint.
 *
 * Body: `{ path: string, doc: PMNodeJSON, frontmatter: string }` — `doc` is
 * the raw ProseMirror doc JSON (`editor.getJSON()`) and `frontmatter` the
 * already-serialized YAML block (`serializeFrontmatter(frontmatterData)`,
 * see `Editor.tsx`). This function runs the real `docToSource(doc,
 * frontmatter)` — never hand-assembled MDX — itself, server-side, and that
 * is deliberate: `docToSource` -> `formatMdx` (`src/mdx/normalize.ts`) needs
 * Bun/Node's `node:path` + filesystem access to resolve the repo's
 * `.prettierrc.json`, which cannot run in a browser (Vite's `node:path`
 * browser shim throws on access). Netlify functions execute under Bun/Node,
 * so doing the assembly here — rather than in `Editor.tsx` client-side —
 * keeps the "always go through docToSource" guarantee while actually
 * working. See `Editor.tsx`'s autosave-effect doc comment for the full
 * story of the browser breakage this avoids.
 *
 * Phase E extends this to a richer multi-file payload (text + images) for a
 * single save; kept single-file here since that's all D6 needs.
 */
export default async (request: Request): Promise<Response> => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid JSON body" }, 400);
  }
  const { path, doc, frontmatter } = (body ?? {}) as {
    path?: unknown;
    doc?: unknown;
    frontmatter?: unknown;
  };
  if (
    typeof path !== "string" ||
    doc == null ||
    typeof doc !== "object" ||
    typeof frontmatter !== "string"
  ) {
    return json(
      {
        error: "path (string), doc (object), and frontmatter (string) required",
      },
      400,
    );
  }
  const backend = backendFor(request);
  const source = await docToSource(doc as PMNodeJSON, unfence(frontmatter));
  await backend.saveDraft(
    [{ path, content: source }],
    "edit via manual editor",
  );
  return json({ ok: true });
};
