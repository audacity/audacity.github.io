import path from "node:path";
import { fileURLToPath } from "node:url";
import prettier from "prettier";

/**
 * Repo root, resolved from this file: manual-editor/src/mdx -> ../../.. .
 */
// path.dirname(fileURLToPath(import.meta.url)) rather than Bun's
// import.meta.dir: this module also runs inside Netlify functions on the
// Node runtime, where import.meta.dir is undefined and would crash the
// function at import time. import.meta.url works on both runtimes.
export const REPO_ROOT: string = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

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
