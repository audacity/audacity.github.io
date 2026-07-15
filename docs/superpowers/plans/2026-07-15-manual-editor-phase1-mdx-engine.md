# Manual Editor — MDX Round-Trip Core (Phase 1, Plan 1 of 4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a pure, UI-independent TypeScript library that parses the manual's `.md`/`.mdx` files into a syntax tree and serializes them back **without corrupting content**, proven idempotent against all 237 existing manual files.

**Architecture:** A standalone package `manual-editor/` (the eventual editor app's home) containing an `src/mdx/` module. The module wraps a `unified`/`remark` pipeline (`remark-parse` + `remark-mdx` + `remark-gfm` + `remark-frontmatter` + `remark-stringify`) to parse MDX → mdast and stringify mdast → MDX, then normalizes output through the repo's Prettier config so re-serialized files match hand-authored formatting. The library exposes `parseMdx`, `stringifyMdx`, `formatMdx`, and `roundTrip`. No React, no network, no TipTap — those come in later plans. This plan exists to de-risk round-trip fidelity (the project's #1 risk) before anything is built on top of it.

**Tech Stack:** TypeScript, Bun (test runner + package manager), `unified`, `remark-parse`, `remark-stringify`, `remark-mdx`, `remark-gfm`, `remark-frontmatter`, `mdast` types, `prettier`.

## Global Constraints

- Use **Bun** for all package/test commands (`bun add`, `bun test`) — repo convention (AGENTS.md).
- Use **Conventional Commits** (`feat:`, `test:`, `chore:`, `docs:`).
- All serialized output MUST be normalized through the repo's Prettier config (`.prettierrc.json` at repo root) using parser `"mdx"`, so editor-written files are byte-identical in style to hand-authored ones and produce minimal git diffs.
- The library MUST be pure: no filesystem, network, React, or TipTap imports in `src/mdx/pipeline.ts` or `src/mdx/normalize.ts`. (Test files may read fixtures from disk.)
- The manual corpus lives at repo `src/content/manual/**/*.{md,mdx}` (237 files: 234 `.mdx`, 3 `.md`). The editor package is a sibling folder `manual-editor/` at repo root; the corpus is reached via `../src/content/manual` relative to the package root.
- TypeScript strict mode on.

---

### Task 1: Scaffold the `manual-editor` package

**Files:**

- Create: `manual-editor/package.json`
- Create: `manual-editor/tsconfig.json`
- Create: `manual-editor/.gitignore`
- Create: `manual-editor/src/mdx/smoke.test.ts`

**Interfaces:**

- Consumes: nothing (first task).
- Produces: a Bun-testable TS package rooted at `manual-editor/`. Later tasks add files under `manual-editor/src/mdx/`.

- [ ] **Step 1: Create `manual-editor/package.json`**

```json
{
  "name": "manual-editor",
  "version": "0.0.0",
  "type": "module",
  "private": true,
  "scripts": {
    "test": "bun test",
    "typecheck": "tsc --noEmit"
  }
}
```

- [ ] **Step 2: Create `manual-editor/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "types": ["bun-types"],
    "noEmit": true,
    "esModuleInterop": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `manual-editor/.gitignore`**

```
node_modules
dist
*.log
```

- [ ] **Step 4: Install dependencies**

Run (from the `manual-editor/` directory):

```bash
cd manual-editor && bun add unified remark-parse remark-stringify remark-mdx remark-gfm remark-frontmatter mdast-util-from-markdown && bun add -d prettier @types/mdast bun-types typescript
```

Expected: a `manual-editor/package.json` with these deps, a `manual-editor/bun.lock`, and `manual-editor/node_modules/`.

- [ ] **Step 5: Write a smoke test at `manual-editor/src/mdx/smoke.test.ts`**

```ts
import { expect, test } from "bun:test";

test("bun test runs in the manual-editor package", () => {
  expect(1 + 1).toBe(2);
});
```

- [ ] **Step 6: Run the smoke test**

Run: `cd manual-editor && bun test`
Expected: PASS (1 test).

- [ ] **Step 7: Commit**

```bash
git add manual-editor/package.json manual-editor/tsconfig.json manual-editor/.gitignore manual-editor/bun.lock manual-editor/src/mdx/smoke.test.ts
git commit -m "chore(manual-editor): scaffold editor package with bun + remark deps"
```

---

### Task 2: MDX parse/stringify pipeline

**Files:**

- Create: `manual-editor/src/mdx/pipeline.ts`
- Create: `manual-editor/src/mdx/pipeline.test.ts`

**Interfaces:**

- Consumes: the deps installed in Task 1.
- Produces:
  - `createProcessor(): Processor` — a configured unified processor (parse + stringify + mdx + gfm + frontmatter).
  - `parseMdx(source: string): Root` — MDX string → mdast `Root`.
  - `stringifyMdx(tree: Root): string` — mdast `Root` → MDX string.
  - `roundTrip(source: string): string` — `stringifyMdx(parseMdx(source))`.
    (`Root` is the `mdast` root type from `@types/mdast`.)

- [ ] **Step 1: Write the failing test at `manual-editor/src/mdx/pipeline.test.ts`**

```ts
import { expect, test } from "bun:test";
import { parseMdx, stringifyMdx, roundTrip } from "./pipeline";

test("parseMdx yields an mdast root with children", () => {
  const tree = parseMdx("# Hello\n\nWorld\n");
  expect(tree.type).toBe("root");
  expect(tree.children.length).toBeGreaterThan(0);
});

test("roundTrip preserves a Callout component verbatim in structure", () => {
  const source = [
    "## Heading",
    "",
    '<Callout type="info">',
    "This is **important**.",
    "</Callout>",
    "",
    "Some `code` and a [link](https://example.com).",
    "",
  ].join("\n");
  const out = roundTrip(source);
  expect(out).toContain("<Callout");
  expect(out).toContain('type="info"');
  expect(out).toContain("**important**");
  expect(out).toContain("[link](https://example.com)");
});

test("roundTrip preserves YAML frontmatter", () => {
  const source = [
    "---",
    "title: Editing audio",
    "section: Audacity Basics",
    "order: 4",
    "---",
    "",
    "Body text.",
    "",
  ].join("\n");
  const out = roundTrip(source);
  expect(out).toContain("title: Editing audio");
  expect(out).toContain("section: Audacity Basics");
});

test("stringifyMdx accepts the tree from parseMdx", () => {
  const tree = parseMdx("Plain paragraph.\n");
  expect(stringifyMdx(tree).trim()).toBe("Plain paragraph.");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd manual-editor && bun test src/mdx/pipeline.test.ts`
Expected: FAIL — `Cannot find module "./pipeline"`.

- [ ] **Step 3: Implement `manual-editor/src/mdx/pipeline.ts`**

```ts
import { unified, type Processor } from "unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import remarkMdx from "remark-mdx";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import type { Root } from "mdast";

/**
 * A unified processor configured to both PARSE and STRINGIFY the manual's
 * MDX dialect: GitHub-flavored markdown + MDX (JSX components + ESM) + YAML
 * frontmatter. The same processor instance is used for both directions so the
 * micromark/toMarkdown extensions registered by each plugin apply to parse and
 * stringify alike.
 */
export function createProcessor(): Processor {
  return unified()
    .use(remarkParse)
    .use(remarkStringify, {
      bullet: "-",
      emphasis: "_",
      strong: "*",
      rule: "-",
      fences: true,
    })
    .use(remarkFrontmatter, ["yaml"])
    .use(remarkGfm)
    .use(remarkMdx);
}

export function parseMdx(source: string): Root {
  return createProcessor().parse(source) as Root;
}

export function stringifyMdx(tree: Root): string {
  return createProcessor().stringify(tree);
}

export function roundTrip(source: string): string {
  return stringifyMdx(parseMdx(source));
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd manual-editor && bun test src/mdx/pipeline.test.ts`
Expected: PASS (4 tests). If the frontmatter or Callout assertions fail, inspect the serialized output with a temporary `console.log(out)` — do NOT weaken the assertions; fix the processor config.

- [ ] **Step 5: Commit**

```bash
git add manual-editor/src/mdx/pipeline.ts manual-editor/src/mdx/pipeline.test.ts
git commit -m "feat(manual-editor): add MDX parse/stringify pipeline"
```

---

### Task 3: Prettier normalization

**Files:**

- Create: `manual-editor/src/mdx/normalize.ts`
- Create: `manual-editor/src/mdx/normalize.test.ts`

**Interfaces:**

- Consumes: `roundTrip` from `./pipeline`.
- Produces:
  - `formatMdx(source: string): Promise<string>` — formats an MDX string with the repo's Prettier config (parser `"mdx"`). Async because Prettier v3's `format` returns a `Promise`.
  - `REPO_ROOT: string` — absolute path to the repo root, resolved from this file's location.

- [ ] **Step 1: Write the failing test at `manual-editor/src/mdx/normalize.test.ts`**

```ts
import { expect, test } from "bun:test";
import { formatMdx } from "./normalize";

test("formatMdx normalizes list markers and is idempotent", async () => {
  const messy = "*   item one\n*   item two\n";
  const once = await formatMdx(messy);
  const twice = await formatMdx(once);
  expect(once).toBe(twice); // idempotent
  expect(once).toContain("- item one"); // repo prettier normalizes bullets
});

test("formatMdx preserves an MDX component", async () => {
  const source = '<Callout type="tip">\n  Hello\n</Callout>\n';
  const out = await formatMdx(source);
  expect(out).toContain("<Callout");
  expect(out).toContain('type="tip"');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd manual-editor && bun test src/mdx/normalize.test.ts`
Expected: FAIL — `Cannot find module "./normalize"`.

- [ ] **Step 3: Implement `manual-editor/src/mdx/normalize.ts`**

```ts
import path from "node:path";
import prettier from "prettier";

/**
 * Repo root, resolved from this file: manual-editor/src/mdx -> ../../.. .
 * import.meta.dir is Bun's absolute directory of the current module.
 */
export const REPO_ROOT: string = path.resolve(import.meta.dir, "../../..");

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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd manual-editor && bun test src/mdx/normalize.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add manual-editor/src/mdx/normalize.ts manual-editor/src/mdx/normalize.test.ts
git commit -m "feat(manual-editor): add prettier-based MDX normalization"
```

---

### Task 4: Golden idempotency over the real manual corpus

This is the de-risking payoff: prove the pipeline never corrupts a real file.

**Files:**

- Create: `manual-editor/src/mdx/corpus.ts`
- Create: `manual-editor/src/mdx/idempotency.test.ts`

**Interfaces:**

- Consumes: `roundTrip` from `./pipeline`; `formatMdx`, `REPO_ROOT` from `./normalize`.
- Produces:
  - `manualDir(): string` — absolute path to `src/content/manual` in the repo.
  - `listManualFiles(): string[]` — absolute paths of every `.md`/`.mdx` file in the corpus.
  - `readManualFile(absPath: string): string` — file contents as UTF-8.
  - `safeRoundTrip(source: string): Promise<string>` — `formatMdx(roundTrip(source))`, the full "read then write" the editor will perform.

- [ ] **Step 1: Write the corpus helper at `manual-editor/src/mdx/corpus.ts`**

```ts
import path from "node:path";
import fs from "node:fs";
import { REPO_ROOT } from "./normalize";
import { roundTrip } from "./pipeline";
import { formatMdx } from "./normalize";

export function manualDir(): string {
  return path.join(REPO_ROOT, "src", "content", "manual");
}

/** Recursively list every .md/.mdx file under the manual content directory. */
export function listManualFiles(): string[] {
  const root = manualDir();
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(md|mdx)$/.test(entry.name)) out.push(full);
    }
  };
  walk(root);
  return out.sort();
}

export function readManualFile(absPath: string): string {
  return fs.readFileSync(absPath, "utf8");
}

/** The full read->write the editor performs: parse, stringify, prettier. */
export async function safeRoundTrip(source: string): Promise<string> {
  return formatMdx(roundTrip(source));
}
```

- [ ] **Step 2: Write the failing test at `manual-editor/src/mdx/idempotency.test.ts`**

```ts
import { expect, test } from "bun:test";
import { listManualFiles, readManualFile, safeRoundTrip } from "./corpus";
import { formatMdx } from "./normalize";

const files = listManualFiles();

test("corpus is non-empty (guards against a wrong path)", () => {
  expect(files.length).toBeGreaterThan(200);
});

// For every real manual file, the editor's read->write must be content-stable:
// formatMdx(roundTrip(source)) must equal formatMdx(source). Any difference is
// a fidelity bug — the editor would change content it was only asked to open.
for (const file of files) {
  test(`round-trips without content change: ${file}`, async () => {
    const source = readManualFile(file);
    const baseline = await formatMdx(source);
    const actual = await safeRoundTrip(source);
    expect(actual).toBe(baseline);
  });
}
```

- [ ] **Step 3: Run the test to verify current behavior**

Run: `cd manual-editor && bun test src/mdx/idempotency.test.ts`
Expected: the corpus-count test PASSES; the per-file tests should PASS. If some files FAIL, that is the expected discovery moment — capture the diff for one failing file:

```bash
cd manual-editor && bun run -e 'import{readManualFile,safeRoundTrip}from"./src/mdx/corpus";import{formatMdx}from"./src/mdx/normalize";const f=process.argv[1];const s=readManualFile(f);console.log("---BASELINE---");console.log(await formatMdx(s));console.log("---ACTUAL---");console.log(await safeRoundTrip(s));' -- <FAILING_FILE_ABS_PATH>
```

- [ ] **Step 4: Resolve any failures by fixing the pipeline, not by weakening the test**

Diagnose each failure class and adjust `createProcessor()` options in `pipeline.ts` (e.g. `remark-stringify` options for how it emits emphasis/bullets/rules, or add `remark-gfm` options for tables). The comparison already tolerates pure formatting differences (both sides pass through `formatMdx`), so a failure means genuine content/structure drift (dropped attribute, altered component, lost escaping). Re-run after each change:

Run: `cd manual-editor && bun test src/mdx/idempotency.test.ts`
Expected: ALL tests PASS (238+ tests: 1 count + one per file).

If a specific construct genuinely cannot round-trip through remark (rare), document it explicitly in a new `manual-editor/src/mdx/KNOWN-LIMITATIONS.md` with the exact file and construct, and add a targeted `test.skip` naming that file so the gap is visible rather than silently tolerated. Do not skip broadly.

- [ ] **Step 5: Typecheck the package**

Run: `cd manual-editor && bun run typecheck`
Expected: no type errors.

- [ ] **Step 6: Commit**

```bash
git add manual-editor/src/mdx/corpus.ts manual-editor/src/mdx/idempotency.test.ts
# include KNOWN-LIMITATIONS.md and any pipeline.ts fixes if the step produced them
git add -A manual-editor/src/mdx
git commit -m "test(manual-editor): prove MDX round-trip is idempotent over the manual corpus"
```

---

### Task 5: Public API barrel + package README

**Files:**

- Create: `manual-editor/src/mdx/index.ts`
- Create: `manual-editor/src/mdx/index.test.ts`
- Create: `manual-editor/README.md`

**Interfaces:**

- Consumes: everything above.
- Produces: `manual-editor/src/mdx/index.ts` re-exporting the stable public API for later plans (the TipTap adapter in Plan 4 imports from here): `parseMdx`, `stringifyMdx`, `roundTrip`, `formatMdx`, `safeRoundTrip`, and the `corpus` helpers.

- [ ] **Step 1: Write the failing test at `manual-editor/src/mdx/index.test.ts`**

```ts
import { expect, test } from "bun:test";
import * as api from "./index";

test("public API surface is stable", () => {
  for (const name of [
    "parseMdx",
    "stringifyMdx",
    "roundTrip",
    "formatMdx",
    "safeRoundTrip",
    "listManualFiles",
  ]) {
    expect(typeof (api as Record<string, unknown>)[name]).toBe("function");
  }
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd manual-editor && bun test src/mdx/index.test.ts`
Expected: FAIL — `Cannot find module "./index"`.

- [ ] **Step 3: Implement `manual-editor/src/mdx/index.ts`**

```ts
export { parseMdx, stringifyMdx, roundTrip, createProcessor } from "./pipeline";
export { formatMdx, REPO_ROOT } from "./normalize";
export {
  manualDir,
  listManualFiles,
  readManualFile,
  safeRoundTrip,
} from "./corpus";
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd manual-editor && bun test src/mdx/index.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Write `manual-editor/README.md`**

````markdown
# manual-editor

Standalone WYSIWYG editor for the Audacity 4 user manual. See the design spec at
`docs/superpowers/specs/2026-07-15-manual-wysiwyg-editor-design.md` and the plan
sequence under `docs/superpowers/plans/`.

## MDX round-trip core (`src/mdx`)

Pure, UI-independent library that safely reads and writes the manual's MDX files.

- `parseMdx(source)` / `stringifyMdx(tree)` — MDX <-> mdast.
- `roundTrip(source)` — stringify(parse(source)).
- `formatMdx(source)` — normalize with the repo's Prettier config (parser `mdx`).
- `safeRoundTrip(source)` — the editor's full read->write: `formatMdx(roundTrip(source))`.
- `listManualFiles()` / `readManualFile(path)` — enumerate/read the corpus.

Fidelity is guaranteed by `idempotency.test.ts`, which asserts every file in
`src/content/manual` survives `safeRoundTrip` with no content change.

## Commands

```bash
bun test          # run all tests (incl. corpus idempotency)
bun run typecheck # tsc --noEmit
```
````

````

- [ ] **Step 6: Run the full package test suite**

Run: `cd manual-editor && bun test`
Expected: ALL tests PASS (smoke + pipeline + normalize + idempotency + index).

- [ ] **Step 7: Commit**

```bash
git add manual-editor/src/mdx/index.ts manual-editor/src/mdx/index.test.ts manual-editor/README.md
git commit -m "feat(manual-editor): expose stable mdx public API and document package"
````

---

## Self-Review

**Spec coverage (this plan's slice — "Component 1: MDX round-trip engine"):**

- Parse via unified + remark-parse + remark-mdx + remark-gfm + remark-frontmatter → Task 2 ✓
- Serialize via remark-stringify + Prettier normalization → Tasks 2, 3 ✓
- Idempotency requirement over all existing manual files → Task 4 ✓
- Pure, UI-independent, independently testable interface (`parse`/`serialize`) → Tasks 2, 5 ✓
- Opaque preservation of unknown JSX: **partially** — remark round-trips unknown `mdxJsxFlowElement` verbatim, and Task 4 proves it for the real corpus (which contains `UIMap`, `AudacityButton`, Toolbar demos). The _editor-facing_ known/unknown block classification and the ProseMirror mapping are explicitly deferred to Plan 4; this plan only guarantees the bytes survive. ✓ (scoped)
- Deferred to later plans (not gaps in this plan): enabling refactor (Plan 2), OAuth/git/image backend (Plan 3), TipTap UI + mdast↔ProseMirror adapters + block registry (Plan 4).

**Placeholder scan:** No TBD/TODO/"handle edge cases" left. Task 4 Step 4 gives a concrete diagnostic command and a concrete resolution rule rather than "fix failures."

**Type consistency:** `roundTrip`, `parseMdx`, `stringifyMdx`, `formatMdx`, `REPO_ROOT`, `safeRoundTrip`, `listManualFiles`, `readManualFile`, `manualDir` are named identically across `pipeline.ts`, `normalize.ts`, `corpus.ts`, `index.ts`, and every test that imports them. `Root` is the `mdast` type in all signatures.

**Scope:** Single subsystem (the pure MDX library). Produces working, testable software on its own (`bun test` proves fidelity) with zero dependency on the app, backend, or UI.
