/*
  Renders-or-it-doesn't-ship: request every non-draft manual route from the
  dev server and fail on anything that isn't a 200. The coverage audit checks
  links between pages; this checks that the pages themselves render — the gap
  that let a batch of 500s reach a push on 2026-08-31.

  Usage: bun run scripts/smoke-manual.ts [base-url]
*/
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const BASE = process.argv[2] ?? "http://localhost:4321";
const ROOT = "src/content/manual";

function* walk(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (/\.(md|mdx)$/.test(name)) yield p;
  }
}

const routes: string[] = [
  "/manual",
  "/manual/getting-started",
  "/manual/how-to",
  "/manual/reference",
  "/manual/shortcuts",
];
for (const f of walk(ROOT)) {
  const src = readFileSync(f, "utf8");
  const fm = src.split("---")[1] ?? "";
  if (/^draft: true$/m.test(fm)) continue;
  const slug = f
    .slice(ROOT.length + 1)
    .replace(/\.(md|mdx)$/, "")
    .replace(/\/index$/, "");
  routes.push(`/manual/${slug}`);
}

let failed = 0;
for (const r of routes) {
  const res = await fetch(BASE + r).catch(() => null);
  const ok = res?.status === 200;
  if (!ok) {
    failed++;
    console.error(`  FAIL ${res?.status ?? "ERR"}  ${r}`);
  }
}
console.log(`smoke: ${routes.length - failed}/${routes.length} routes OK`);
if (failed) process.exit(1);
