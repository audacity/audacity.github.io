import path from "node:path";
import { fileURLToPath } from "node:url";
import prettier from "prettier";

/**
 * Repo root, resolved from this module's own directory:
 * manual-editor/src/mdx -> ../../.. .
 *
 * Resolution must survive three runtimes: Bun (local dev/tests, ESM,
 * import.meta.url set), Node ESM, and Node CJS — Netlify bundles functions
 * with esbuild as CJS, where `import.meta` is an EMPTY object, so
 * `fileURLToPath(import.meta.url)` would throw at import time and kill the
 * function. In a CJS bundle `__dirname` exists instead. Fall back to
 * process.cwd() as a last resort — there, prettier-config resolution simply
 * finds nothing and formatMdx degrades to default options (documented in
 * the README's deployment notes) instead of crashing.
 */
function moduleDir(): string {
  const url = import.meta.url;
  if (typeof url === "string" && url.length > 0) {
    return path.dirname(fileURLToPath(url));
  }
  if (typeof __dirname === "string") {
    return __dirname;
  }
  return process.cwd();
}

export const REPO_ROOT: string = path.resolve(moduleDir(), "../../..");

let cachedConfig: prettier.Options | null = null;

async function repoPrettierConfig(): Promise<prettier.Options> {
  if (cachedConfig) return cachedConfig;
  const resolved = await prettier.resolveConfig(
    path.join(REPO_ROOT, ".prettierrc.json"),
  );
  cachedConfig = resolved ?? {};
  return cachedConfig;
}

/**
 * Format an MDX source string with the repo's Prettier config, using the
 * "mdx" parser. This is the canonical normalization applied to everything the
 * editor writes, so output matches hand-authored files and diffs stay minimal.
 */
export async function formatMdx(source: string): Promise<string> {
  const config = await repoPrettierConfig();
  return prettier.format(source, { ...config, parser: "mdx" });
}
