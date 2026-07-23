# UIExample: DS Components in the Manual Editor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Manual writers insert curated `@dilsonspickles/components` UI examples from the `/` slash menu; pages serialize `<UIExample component="…" variant="…" [interactive] [client:load] />` and render them on the built site.

**Architecture:** A pure-data metadata module in the editor (`meta.ts`) drives the adapter, slash menu, and import injection; a site-side registry (`registry.tsx`, static deep imports for synchronous SSR) plus a `UIExample.tsx` React wrapper renders on the site; the editor node view resolves the registry **lazily at runtime** so no bun-tested module ever statically imports the DS package (its dist files have CSS side-effect imports that bun's test runner cannot load).

**Tech Stack:** TipTap/ProseMirror, mdast (remark-mdx), React 19 (editor) / React 18 (site), Astro islands, bun test.

**Spec:** `docs/superpowers/specs/2026-07-23-ui-example-components-design.md`

## Global Constraints

- Bun everywhere: `bun test`, `bunx tsc`. Conventional Commits.
- Serialized ids (`component="button"`, `variant="primary"`) are permanent API — never rename an id once published.
- Round-trips must be byte-stable; any `<UIExample>` the adapter can't fully represent (unknown id, unknown variant, extra/expression attributes, children) routes to the `preserved` node, verbatim.
- `client:load` is derived (emitted when `interactive` OR the entry's `needsBrowser`), never independently stored.
- **No module reachable from `bun test` may statically import `@dilsonspickles/components`** (CSS side-effect imports crash bun). Site-side `registry.tsx` is the only file that may — and it uses **deep subpath imports** (`@dilsonspickles/components/Button`), never the index, to keep island chunks scoped.
- `UIExample.tsx` must render **synchronously** (no `React.lazy`/`useEffect` gating the component) — static mode is server-rendered and effects never run during SSR.
- All editor tests run from `manual-editor/`. All commits from repo root.

---

### Task 1: UI-example metadata module

**Files:**

- Create: `manual-editor/src/uiExample/meta.ts`
- Test: `manual-editor/src/uiExample/meta.test.ts`

**Interfaces:**

- Consumes: nothing.
- Produces: `UIExampleMeta`, `UIExampleVariantMeta`, `UI_EXAMPLE_META: UIExampleMeta[]`, `uiExampleMeta(id: string): UIExampleMeta | undefined`, `hasUIExampleVariant(meta: UIExampleMeta, variantId: string): boolean` — used by Tasks 2, 3, 4.

- [ ] **Step 1: Write the failing test**

```ts
// manual-editor/src/uiExample/meta.test.ts
import { expect, test } from "bun:test";
import { UI_EXAMPLE_META, hasUIExampleVariant, uiExampleMeta } from "./meta";

test("entry ids are unique and non-empty", () => {
  const ids = UI_EXAMPLE_META.map((m) => m.id);
  expect(new Set(ids).size).toBe(ids.length);
  expect(ids.every((id) => id.length > 0)).toBe(true);
});

test("every entry has at least one variant with unique ids", () => {
  for (const m of UI_EXAMPLE_META) {
    expect(m.variants.length).toBeGreaterThan(0);
    const vids = m.variants.map((v) => v.id);
    expect(new Set(vids).size).toBe(vids.length);
  }
});

test("uiExampleMeta finds by id and returns undefined for unknown", () => {
  expect(uiExampleMeta("button")?.label).toBe("Button");
  expect(uiExampleMeta("nope")).toBeUndefined();
});

test("hasUIExampleVariant checks variant membership", () => {
  const button = uiExampleMeta("button")!;
  expect(hasUIExampleVariant(button, "primary")).toBe(true);
  expect(hasUIExampleVariant(button, "nope")).toBe(false);
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run (from `manual-editor/`): `bun test src/uiExample/meta.test.ts`
Expected: FAIL — cannot resolve `./meta`.

- [ ] **Step 3: Implement the module**

```ts
// manual-editor/src/uiExample/meta.ts
/**
 * Pure-data metadata for the curated design-system examples writers can
 * insert via the slash menu ("Audacity UI" group). This module must stay
 * free of React and `@dilsonspickles/components` imports: it is consumed by
 * the MDX adapter (both directions), the slash menu, import injection, and
 * the Netlify draft function — including under `bun test`, which cannot
 * load the DS package's CSS side-effect imports.
 *
 * Ids (`id`, `variants[].id`) are serialized into published MDX
 * (`<UIExample component="button" variant="primary" />`) and are permanent:
 * never rename one once pages may reference it.
 *
 * The per-variant PROPS live in the site-side registry
 * (`src/components/manual/UIExample/registry.tsx` at the repo root), keyed
 * by these ids — `registryData.ts` there must cover every id listed here
 * (enforced by `registryData.test.ts`).
 */

export interface UIExampleVariantMeta {
  /** Serialized into MDX (`variant="primary"`). Permanent. */
  id: string;
  /** Shown in the editor block's variant dropdown. */
  label: string;
}

export interface UIExampleMeta {
  /** Serialized into MDX (`component="button"`). Permanent. */
  id: string;
  /** Slash-menu row label and block chrome title. */
  label: string;
  /** Right-aligned slash-menu hint. */
  hint?: string;
  /** Extra fuzzy-filter terms for the slash menu. */
  keywords: string[];
  /** Offer the Static/Interactive toggle in the editor block chrome. */
  allowInteractive: boolean;
  /**
   * Component cannot server-render (canvas/effect drawing): the serializer
   * emits `client:load` even for static inserts. No seed entry sets this
   * yet — the first curated entry that does MUST add the round-trip test
   * covering the static+client:load form (see Task 2 note).
   */
  needsBrowser?: boolean;
  /** First variant is the default used on insert. Never empty. */
  variants: UIExampleVariantMeta[];
}

export const UI_EXAMPLE_META: UIExampleMeta[] = [
  {
    id: "button",
    label: "Button",
    keywords: ["button", "cta", "primary", "secondary"],
    allowInteractive: true,
    variants: [
      { id: "primary", label: "Primary" },
      { id: "secondary", label: "Secondary" },
      { id: "disabled", label: "Disabled" },
    ],
  },
  {
    id: "checkbox",
    label: "Checkbox",
    keywords: ["checkbox", "check", "toggle", "tick"],
    allowInteractive: true,
    variants: [
      { id: "checked", label: "Checked" },
      { id: "unchecked", label: "Unchecked" },
      { id: "disabled", label: "Disabled" },
    ],
  },
  {
    id: "knob",
    label: "Knob",
    keywords: ["knob", "rotary", "dial", "gain"],
    allowInteractive: true,
    variants: [
      { id: "default", label: "Default" },
      { id: "at-75", label: "At 75%" },
    ],
  },
];

export function uiExampleMeta(id: string): UIExampleMeta | undefined {
  return UI_EXAMPLE_META.find((m) => m.id === id);
}

export function hasUIExampleVariant(
  meta: UIExampleMeta,
  variantId: string,
): boolean {
  return meta.variants.some((v) => v.id === variantId);
}
```

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `bun test src/uiExample/meta.test.ts`
Expected: 4 pass.

- [ ] **Step 5: Commit**

```bash
git add manual-editor/src/uiExample/meta.ts manual-editor/src/uiExample/meta.test.ts
git commit -m "feat(manual-editor): add UI-example metadata module (seed: button, checkbox, knob)"
```

---

### Task 2: Adapter round-trip for `<UIExample>`

**Files:**

- Modify: `manual-editor/src/adapter/registry.ts` (KNOWN_FLOW)
- Modify: `manual-editor/src/adapter/schema.ts` (new node + `buildExtensions`)
- Modify: `manual-editor/src/adapter/mdastToDoc.ts` (`mapFlowJsx`)
- Modify: `manual-editor/src/adapter/docToMdast.ts` (`mapBlockBack`)
- Test: `manual-editor/src/adapter/uiExampleRoundtrip.test.ts`

**Interfaces:**

- Consumes: `uiExampleMeta`, `hasUIExampleVariant` from `../uiExample/meta` (Task 1).
- Produces: PM node `uiExample` with attrs `{ component: string, variant: string, interactive: boolean }` — consumed by Task 4's node view and insert command. Serialized MDX form per Global Constraints.

- [ ] **Step 1: Write the failing round-trip test**

```ts
// manual-editor/src/adapter/uiExampleRoundtrip.test.ts
import { expect, test } from "bun:test";
import { parseMdx } from "../mdx/pipeline";
import { mdastToDoc } from "./mdastToDoc";
import { docToSource } from "./docToMdast";
import type { PMNodeJSON } from "./mdastToDoc";

async function roundTrip(src: string): Promise<string> {
  const { doc } = mdastToDoc(parseMdx(src));
  return docToSource(doc, null);
}

function firstNode(src: string): PMNodeJSON {
  const { doc } = mdastToDoc(parseMdx(src));
  return doc.content![0]!;
}

test("static UIExample maps to a uiExample node and round-trips byte-stable", async () => {
  const src = '<UIExample component="knob" variant="default" />\n';
  const node = firstNode(src);
  expect(node.type).toBe("uiExample");
  expect(node.attrs).toEqual({
    component: "knob",
    variant: "default",
    interactive: false,
  });
  expect(await roundTrip(src)).toBe(src);
});

test("interactive UIExample round-trips with bare interactive and client:load", async () => {
  const src =
    '<UIExample component="button" variant="primary" interactive client:load />\n';
  const node = firstNode(src);
  expect(node.attrs?.interactive).toBe(true);
  expect(await roundTrip(src)).toBe(src);
});

test("unknown component id routes to preserved and survives verbatim", async () => {
  const src = '<UIExample component="mystery" variant="default" />\n';
  expect(firstNode(src).type).toBe("preserved");
  expect(await roundTrip(src)).toBe(src);
});

test("unknown variant id routes to preserved and survives verbatim", async () => {
  const src = '<UIExample component="knob" variant="mystery" />\n';
  expect(firstNode(src).type).toBe("preserved");
  expect(await roundTrip(src)).toBe(src);
});

test("extra attributes route to preserved so nothing is silently dropped", async () => {
  const src =
    '<UIExample component="knob" variant="default" className="x" />\n';
  expect(firstNode(src).type).toBe("preserved");
  expect(await roundTrip(src)).toBe(src);
});

test("children route to preserved (UIExample is self-closing only)", async () => {
  const src = '<UIExample component="knob" variant="default">hi</UIExample>\n';
  expect(firstNode(src).type).toBe("preserved");
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `bun test src/adapter/uiExampleRoundtrip.test.ts`
Expected: FAIL — first assertion sees `preserved` (UIExample unknown), byte-stability of that case passes but the `uiExample`-node cases fail.

- [ ] **Step 3: Register the component and PM node**

In `manual-editor/src/adapter/registry.ts`, add to `KNOWN_FLOW` (after the `Tab` entry):

```ts
  UIExample: { pmType: "uiExample", attrs: ["component", "variant"] },
```

In `manual-editor/src/adapter/schema.ts`, add after the `Image` node definition:

```ts
/**
 * `uiExample` — block atom for `<UIExample component="…" variant="…" />`,
 * the curated design-system example block (see
 * `../uiExample/meta.ts`). `interactive` is stored as a boolean; the
 * `client:load` Astro directive is DERIVED at serialization time (from
 * `interactive` or the entry's `needsBrowser` flag), never stored.
 */
const UIExample = Node.create({
  name: "uiExample",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      component: { default: undefined, isRequired: true },
      variant: { default: undefined, isRequired: true },
      interactive: { default: false },
    };
  },
  parseHTML() {
    return [{ tag: "div[data-ui-example]" }];
  },
  renderHTML({ HTMLAttributes, node }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-ui-example": node.attrs.component,
      }),
    ];
  },
});
```

…and include it in `buildExtensions()`:

```ts
return [
  StarterKit,
  Admonition,
  Tabs,
  Tab,
  Shortcut,
  Preserved,
  Image,
  UIExample,
];
```

- [ ] **Step 4: Map mdast → PM**

In `manual-editor/src/adapter/mdastToDoc.ts`:

Add to the imports from `./registry` nothing new; add a new import line near the top with the other local imports:

```ts
import { hasUIExampleVariant, uiExampleMeta } from "../uiExample/meta";
```

In `mapFlowJsx`, inside the `if (name && name in KNOWN_FLOW)` block, add a branch after the `tab` branch:

```ts
if (descriptor.pmType === "uiExample") {
  // Fidelity gate: only the exact shape the editor itself emits becomes
  // an editable node — a known component id, a known variant id, no
  // children, and no attributes beyond component/variant/interactive/
  // client:load (all simple, non-expression). Anything else routes to
  // `preserved` so hand-authored extras are never silently dropped.
  if (node.children.length > 0) return preserve(node);
  const pairs = jsxAttrsToPairs(node.attributes);
  const allowed = new Set([
    "component",
    "variant",
    "interactive",
    "client:load",
  ]);
  if (!pairs || pairs.some((p) => !allowed.has(p.name))) {
    return preserve(node);
  }
  const component = readStringAttr(node.attributes, "component");
  const variant = readStringAttr(node.attributes, "variant");
  const meta = component ? uiExampleMeta(component) : undefined;
  if (!meta || !variant || !hasUIExampleVariant(meta, variant)) {
    return preserve(node);
  }
  const interactive = pairs.some((p) => p.name === "interactive");
  return {
    type: "uiExample",
    attrs: { component, variant, interactive },
  };
}
```

- [ ] **Step 5: Map PM → mdast**

In `manual-editor/src/adapter/docToMdast.ts`:

Add the import near the other local imports:

```ts
import { uiExampleMeta } from "../uiExample/meta";
```

In `mapBlockBack`, add a case after `case "image":`:

```ts
    case "uiExample": {
      const attrs = attrsOf(node);
      const component = attrs.component as string;
      const variant = attrs.variant as string;
      const interactive = attrs.interactive === true;
      // `client:load` is derived, never stored: interactive blocks always
      // hydrate; `needsBrowser` entries hydrate even when static (they
      // cannot server-render). See ../uiExample/meta.ts.
      const needsClient =
        interactive || uiExampleMeta(component)?.needsBrowser === true;
      const attributes: MdxJsxAttribute[] = [
        { type: "mdxJsxAttribute", name: "component", value: component },
        { type: "mdxJsxAttribute", name: "variant", value: variant },
      ];
      if (interactive) {
        attributes.push({
          type: "mdxJsxAttribute",
          name: "interactive",
          value: null,
        });
      }
      if (needsClient) {
        attributes.push({
          type: "mdxJsxAttribute",
          name: "client:load",
          value: null,
        });
      }
      const el: MdxJsxFlowElement = {
        type: "mdxJsxFlowElement",
        name: "UIExample",
        attributes,
        children: [],
      };
      return el;
    }
```

> NOTE (also flagged in meta.ts): no seed entry sets `needsBrowser`, so the
> "static entry still emits client:load" derivation branch has no test yet.
> The first curated `needsBrowser` entry MUST add that round-trip case to
> `uiExampleRoundtrip.test.ts`.

- [ ] **Step 6: Run the round-trip tests**

Run: `bun test src/adapter/uiExampleRoundtrip.test.ts`
Expected: 6 pass.

- [ ] **Step 7: Run the full adapter + schema-parity suites (regression)**

Run: `bun test src/adapter/ src/app/editorExtensions.test.ts`
Expected: all pass (schema parity holds because Task 4 hasn't touched app extensions yet; the new node exists identically in both builders' shared source).

- [ ] **Step 8: Commit**

```bash
git add manual-editor/src/adapter/
git commit -m "feat(manual-editor): round-trip <UIExample> as a first-class uiExample node"
```

---

### Task 3: Site-side registry, wrapper, and import injection

**Files:**

- Create: `src/components/manual/UIExample/registryData.ts` (repo root)
- Create: `src/components/manual/UIExample/registry.tsx` (repo root)
- Create: `src/components/manual/UIExample/UIExample.tsx` (repo root)
- Modify: `manual-editor/src/backend/ensureImports.ts`
- Test: `manual-editor/src/uiExample/registryData.test.ts`, additions to `manual-editor/src/backend/ensureImports.test.ts`

**Interfaces:**

- Consumes: `UI_EXAMPLE_META`, `uiExampleMeta`, `hasUIExampleVariant` (Task 1).
- Produces: `resolveUIExampleProps(componentId, variantId): Record<string, unknown> | null` (registryData); `resolveUIExample(componentId, variantId): { Component, props, meta } | null` (registry, used by Task 4's node view via dynamic import); default-export React component `UIExample` (site pages).

- [ ] **Step 1: Write the failing data-coverage test**

```ts
// manual-editor/src/uiExample/registryData.test.ts
import { expect, test } from "bun:test";
import { UI_EXAMPLE_META } from "./meta";
// Repo-root site module — pure data, safe under bun (no DS imports there;
// the component map lives in registry.tsx, which bun must never load).
import {
  UI_EXAMPLE_VARIANT_PROPS,
  resolveUIExampleProps,
} from "../../../src/components/manual/UIExample/registryData";

test("every meta entry and variant has props defined", () => {
  for (const meta of UI_EXAMPLE_META) {
    const perVariant = UI_EXAMPLE_VARIANT_PROPS[meta.id];
    expect(perVariant).toBeDefined();
    for (const v of meta.variants) {
      expect(perVariant![v.id]).toBeDefined();
    }
  }
});

test("resolveUIExampleProps returns props for known ids, null otherwise", () => {
  expect(resolveUIExampleProps("knob", "at-75")).toMatchObject({ value: 75 });
  expect(resolveUIExampleProps("knob", "nope")).toBeNull();
  expect(resolveUIExampleProps("nope", "default")).toBeNull();
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `bun test src/uiExample/registryData.test.ts`
Expected: FAIL — cannot resolve `registryData`.

- [ ] **Step 3: Implement `registryData.ts`**

```ts
// src/components/manual/UIExample/registryData.ts
/**
 * Per-variant props for the curated UI examples — PURE DATA, deliberately
 * split from `registry.tsx` (which holds the component references): this
 * module is imported by the manual editor's bun test suite, which cannot
 * load `@dilsonspickles/components` (CSS side-effect imports). Keep this
 * file free of DS-package and React imports.
 *
 * Keys mirror `manual-editor/src/uiExample/meta.ts` ids; the coverage test
 * (`manual-editor/src/uiExample/registryData.test.ts`) enforces that every
 * meta entry/variant has props here.
 *
 * Complex generated data (waveforms, envelope points) must not be computed
 * here via DS imports — when the first such entry is curated, add a lazy
 * per-entry props loader in `registry.tsx` instead.
 */
import {
  UI_EXAMPLE_META,
  hasUIExampleVariant,
  uiExampleMeta,
} from "../../../../manual-editor/src/uiExample/meta";

export const UI_EXAMPLE_VARIANT_PROPS: Record<
  string,
  Record<string, Record<string, unknown>>
> = {
  button: {
    primary: { variant: "primary", children: "Export" },
    secondary: { variant: "secondary", children: "Cancel" },
    disabled: { variant: "primary", children: "Export", disabled: true },
  },
  checkbox: {
    checked: { checked: true, "aria-label": "Enable option" },
    unchecked: { checked: false, "aria-label": "Enable option" },
    disabled: { checked: true, disabled: true, "aria-label": "Enable option" },
  },
  knob: {
    default: { value: 50, min: 0, max: 100, label: "Gain" },
    "at-75": { value: 75, min: 0, max: 100, label: "Gain" },
  },
};

export function resolveUIExampleProps(
  componentId: string,
  variantId: string,
): Record<string, unknown> | null {
  const meta = uiExampleMeta(componentId);
  if (!meta || !hasUIExampleVariant(meta, variantId)) return null;
  return UI_EXAMPLE_VARIANT_PROPS[componentId]?.[variantId] ?? null;
}

/** Re-exported so registry.tsx has a single import site for meta data. */
export { UI_EXAMPLE_META, uiExampleMeta };
```

- [ ] **Step 4: Run the data tests**

Run: `bun test src/uiExample/registryData.test.ts`
Expected: 2 pass.

- [ ] **Step 5: Implement `registry.tsx` (site/editor bundlers only — never bun)**

```tsx
// src/components/manual/UIExample/registry.tsx
/**
 * Component map for the curated UI examples. This is the ONLY module
 * allowed to import `@dilsonspickles/components`, and it must do so via
 * deep subpaths (`@dilsonspickles/components/Button`) so a hydrated island
 * bundles only the components it uses — never the package index, which
 * pulls every chunk and stylesheet.
 *
 * Imports are STATIC (not lazy) on purpose: static-mode examples are
 * server-rendered by Astro, and SSR needs the component synchronously —
 * effects and React.lazy fallbacks never resolve during renderToString.
 *
 * Never import this from any module reachable by `bun test` (the CSS
 * side-effect imports crash bun's runtime) — the editor's node view loads
 * it with a runtime dynamic import for exactly this reason.
 */
import type { ComponentType } from "react";
import { Button } from "@dilsonspickles/components/Button";
import { Checkbox } from "@dilsonspickles/components/Checkbox";
import { Knob } from "@dilsonspickles/components/Knob";
import { resolveUIExampleProps, uiExampleMeta } from "./registryData";
import type { UIExampleMeta } from "../../../../manual-editor/src/uiExample/meta";

type AnyComponent = ComponentType<Record<string, unknown>>;

const COMPONENTS: Record<string, AnyComponent> = {
  button: Button as unknown as AnyComponent,
  checkbox: Checkbox as unknown as AnyComponent,
  knob: Knob as unknown as AnyComponent,
};

export interface ResolvedUIExample {
  Component: AnyComponent;
  props: Record<string, unknown>;
  meta: UIExampleMeta;
}

export function resolveUIExample(
  componentId: string,
  variantId: string,
): ResolvedUIExample | null {
  const meta = uiExampleMeta(componentId);
  const Component = COMPONENTS[componentId];
  const props = resolveUIExampleProps(componentId, variantId);
  if (!meta || !Component || !props) return null;
  return { Component, props, meta };
}
```

> If the deep-subpath import's named export doesn't match (`Button` vs
> default), check `node_modules/@dilsonspickles/components/dist/Button.mjs`'s
> export line and adjust — same for Checkbox/Knob. The package's `exports`
> map (`"./*"`) resolves these to `dist/*.mjs`.

- [ ] **Step 6: Implement the `UIExample.tsx` wrapper**

```tsx
// src/components/manual/UIExample/UIExample.tsx
/**
 * The component manual MDX pages import:
 *   <UIExample component="knob" variant="at-75" interactive client:load />
 *
 * Resolves the id pair through the curated registry and renders the real
 * design-system component with that variant's preset props — synchronously,
 * so static (no-directive, zero-JS) usage server-renders correctly.
 *
 * `interactive` only controls pointer events: a static example is visually
 * identical but inert. Hydration itself is Astro's business via the
 * `client:load` directive the editor emits alongside `interactive`.
 */
import { resolveUIExample } from "./registry";

export default function UIExample({
  component,
  variant,
  interactive = false,
}: {
  component: string;
  variant: string;
  interactive?: boolean;
}) {
  const resolved = resolveUIExample(component, variant);
  if (!resolved) {
    // Stale reference (registry entry removed after publish): degrade
    // quietly, never fail the page.
    return <em>Example unavailable</em>;
  }
  const { Component, props } = resolved;
  return (
    <div
      className="ui-example"
      style={interactive ? undefined : { pointerEvents: "none" }}
    >
      <Component {...props} />
    </div>
  );
}
```

- [ ] **Step 7: Write the failing ensureImports test**

Append to `manual-editor/src/backend/ensureImports.test.ts` (match the file's existing test style on reading it):

```ts
test("adds the UIExample import for a page using the example block", () => {
  const source =
    '---\ntitle: T\n---\n\n<UIExample component="knob" variant="default" />\n';
  const out = ensureComponentImports(source, "src/content/manual/basics/a.mdx");
  expect(out).toContain(
    'import UIExample from "../../../components/manual/UIExample/UIExample";',
  );
});
```

Run: `bun test src/backend/ensureImports.test.ts`
Expected: the new test FAILS (no import added).

- [ ] **Step 8: Add the module mapping**

In `manual-editor/src/backend/ensureImports.ts`, add to `COMPONENT_MODULES`:

```ts
  UIExample: "components/manual/UIExample/UIExample",
```

Run: `bun test src/backend/ensureImports.test.ts`
Expected: all pass.

- [ ] **Step 9: Verify the site builds with the new components**

Run (from repo root): `bunx astro build`
Expected: build completes (no page uses UIExample yet — this proves the new files typecheck/compile in the site's graph). If the build fails on the deep imports, apply the Step 5 note.

- [ ] **Step 10: Commit**

```bash
git add src/components/manual/UIExample/ manual-editor/src/uiExample/registryData.test.ts manual-editor/src/backend/ensureImports.ts manual-editor/src/backend/ensureImports.test.ts
git commit -m "feat(manual): add UIExample registry and site wrapper for DS component examples"
```

---

### Task 4: Editor UX — slash menu group, insert command, node view

**Files:**

- Modify: `manual-editor/src/app/insertCommands.ts`
- Modify: `manual-editor/src/app/slash/slashItems.ts`
- Modify: `manual-editor/src/app/slash/SlashMenu.tsx` (GROUP_ORDER)
- Create: `manual-editor/src/app/nodeviews/UIExampleView.tsx`
- Modify: `manual-editor/src/app/editorExtensions.ts`
- Modify: `manual-editor/src/app/editor.css`
- Modify: `manual-editor/vite.config.ts`
- Test: `manual-editor/src/app/nodeviews/UIExampleView.test.tsx`, additions to `manual-editor/src/app/slash/slashItems.test.ts`

**Interfaces:**

- Consumes: PM node `uiExample` (Task 2), `UI_EXAMPLE_META` (Task 1), `resolveUIExample` from the root registry (Task 3, via runtime dynamic import only).
- Produces: `insertUIExample(editor, componentId, variantId)`; slash group `"Audacity UI"`.

- [ ] **Step 1: Write the failing slash-items test**

Append to `manual-editor/src/app/slash/slashItems.test.ts` (match existing style):

```ts
import { UI_EXAMPLE_META } from "../../uiExample/meta";

test("every curated UI example appears in the Audacity UI group", () => {
  for (const meta of UI_EXAMPLE_META) {
    const item = SLASH_ITEMS.find((i) => i.id === `ui-${meta.id}`);
    expect(item).toBeDefined();
    expect(item!.group).toBe("Audacity UI");
    expect(item!.label).toBe(meta.label);
  }
});

test("filtering by a UI example keyword finds it", () => {
  const hits = filterSlashItems("knob");
  expect(hits.some((i) => i.id === "ui-knob")).toBe(true);
});
```

Run: `bun test src/app/slash/slashItems.test.ts` — new tests FAIL.

- [ ] **Step 2: Insert command**

Append to `manual-editor/src/app/insertCommands.ts`:

```ts
/**
 * Inserts a curated design-system example block (`uiExample` node) with the
 * given component id and variant id (callers pass the entry's first —
 * default — variant), static by default. See `../uiExample/meta.ts`.
 */
export function insertUIExample(
  editor: Editor,
  component: string,
  variant: string,
) {
  editor
    .chain()
    .focus()
    .insertContent({
      type: "uiExample",
      attrs: { component, variant, interactive: false },
    })
    .run();
}
```

- [ ] **Step 3: Slash items + group**

In `manual-editor/src/app/slash/slashItems.ts`:

- Extend the group union:

```ts
group: "Basic blocks" | "Manual blocks" | "Audacity UI";
```

- Import at the top:

```ts
import { UI_EXAMPLE_META } from "../../uiExample/meta";
import { insertUIExample } from "../insertCommands";
```

(merge `insertUIExample` into the existing `../insertCommands` import list)

- After the closing `];` of `SLASH_ITEMS`' literal, change the declaration to append generated items. Replace `export const SLASH_ITEMS: SlashItem[] = [` … `];` structure with:

```ts
const STATIC_ITEMS: SlashItem[] = [
  /* …existing array contents, unchanged… */
];

/**
 * "Audacity UI" rows are generated from the curated metadata so the menu
 * and the registry can never drift: adding an entry to UI_EXAMPLE_META is
 * all it takes to surface it here (id prefixed `ui-` to avoid colliding
 * with hand-written item ids).
 */
const UI_EXAMPLE_ITEMS: SlashItem[] = UI_EXAMPLE_META.map((meta) => ({
  id: `ui-${meta.id}`,
  label: meta.label,
  group: "Audacity UI",
  hint: meta.hint,
  keywords: meta.keywords,
  run: (editor) => insertUIExample(editor, meta.id, meta.variants[0]!.id),
}));

export const SLASH_ITEMS: SlashItem[] = [...STATIC_ITEMS, ...UI_EXAMPLE_ITEMS];
```

In `manual-editor/src/app/slash/SlashMenu.tsx`:

```ts
const GROUP_ORDER: SlashItem["group"][] = [
  "Basic blocks",
  "Manual blocks",
  "Audacity UI",
];
```

Run: `bun test src/app/slash/` — all pass (including Step 1's tests).

- [ ] **Step 4: Write the failing node-view test**

```tsx
// manual-editor/src/app/nodeviews/UIExampleView.test.tsx
/**
 * Mounts a real editor containing a `uiExample` node with the registry
 * MOCKED: the real registry (repo-root registry.tsx) statically imports
 * @dilsonspickles/components, whose CSS side-effect imports crash bun —
 * which is exactly why UIExampleView loads it via dynamic import, giving
 * this suite a seam to mock.
 */
import { expect, mock, test } from "bun:test";
import { act, render, screen, waitFor } from "@testing-library/react";
import { EditorContent, useEditor } from "@tiptap/react";
import { buildAppExtensions } from "../editorExtensions";

mock.module("../../../../src/components/manual/UIExample/registry", () => ({
  resolveUIExample: (component: string, variant: string) =>
    component === "knob"
      ? {
          Component: (props: Record<string, unknown>) => (
            <span data-testid="fake-knob">{String(props.value)}</span>
          ),
          props: variant === "at-75" ? { value: 75 } : { value: 50 },
          meta: {
            id: "knob",
            label: "Knob",
            keywords: [],
            allowInteractive: true,
            variants: [
              { id: "default", label: "Default" },
              { id: "at-75", label: "At 75%" },
            ],
          },
        }
      : null,
}));

function Host({ interactive = false }: { interactive?: boolean }) {
  const editor = useEditor({
    extensions: buildAppExtensions(),
    content: {
      type: "doc",
      content: [
        {
          type: "uiExample",
          attrs: { component: "knob", variant: "default", interactive },
        },
      ],
    },
  });
  return <EditorContent editor={editor} />;
}

test("renders the resolved component with the variant's props", async () => {
  render(<Host />);
  await waitFor(() =>
    expect(screen.getByTestId("fake-knob").textContent).toBe("50"),
  );
  expect(screen.getByTestId("ui-example-block")).toBeDefined();
  expect(screen.getByText("Knob")).toBeDefined();
});

test("variant dropdown lists variants and switching updates the render", async () => {
  render(<Host />);
  await waitFor(() => screen.getByTestId("ui-example-variant"));
  const select = screen.getByTestId("ui-example-variant") as HTMLSelectElement;
  expect(select.options.length).toBe(2);
  act(() => {
    select.value = "at-75";
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await waitFor(() =>
    expect(screen.getByTestId("fake-knob").textContent).toBe("75"),
  );
});

test("static blocks disable pointer events; the toggle flips interactive", async () => {
  render(<Host />);
  await waitFor(() => screen.getByTestId("ui-example-stage"));
  expect(
    (screen.getByTestId("ui-example-stage") as HTMLElement).style.pointerEvents,
  ).toBe("none");
  const toggle = screen.getByTestId("ui-example-interactive");
  act(() => {
    (toggle as HTMLButtonElement).click();
  });
  await waitFor(() =>
    expect(
      (screen.getByTestId("ui-example-stage") as HTMLElement).style
        .pointerEvents,
    ).toBe(""),
  );
});

test("unknown component falls back to an unavailable card, not a crash", async () => {
  const editorContent = {
    type: "doc",
    content: [
      {
        type: "uiExample",
        attrs: { component: "gone", variant: "default", interactive: false },
      },
    ],
  };
  function GoneHost() {
    const editor = useEditor({
      extensions: buildAppExtensions(),
      content: editorContent,
    });
    return <EditorContent editor={editor} />;
  }
  render(<GoneHost />);
  await waitFor(() =>
    expect(screen.getByText(/example unavailable/i)).toBeDefined(),
  );
});
```

Run: `bun test src/app/nodeviews/UIExampleView.test.tsx`
Expected: FAIL — no node view registered, testids absent.

- [ ] **Step 5: Implement the node view**

```tsx
// manual-editor/src/app/nodeviews/UIExampleView.tsx
import { useEffect, useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import type { ReactNodeViewProps } from "@tiptap/react";
import { Component as ReactComponent } from "react";
import type { ReactNode } from "react";
import { uiExampleMeta } from "../../uiExample/meta";
import type { ResolvedUIExample } from "../../../../src/components/manual/UIExample/registry";

/**
 * Renders the real design-system component inside the editor.
 *
 * The registry (repo-root `registry.tsx`) is loaded with a RUNTIME dynamic
 * import, never statically: it imports `@dilsonspickles/components`, whose
 * dist files carry CSS side-effect imports that bun's test runner cannot
 * load — and this module is reachable from `editorExtensions.ts`, which
 * nearly every editor test imports. The dynamic import also gives tests a
 * mockable seam (see UIExampleView.test.tsx). Vite turns it into a normal
 * code-split chunk in the running app.
 */
export function UIExampleView({ node, updateAttributes }: ReactNodeViewProps) {
  const component = (node.attrs.component as string) ?? "";
  const variant = (node.attrs.variant as string) ?? "";
  const interactive = node.attrs.interactive === true;

  const meta = uiExampleMeta(component);
  const [resolved, setResolved] = useState<
    ResolvedUIExample | "loading" | null
  >("loading");

  useEffect(() => {
    let cancelled = false;
    import("../../../../src/components/manual/UIExample/registry")
      .then((m) => {
        if (!cancelled) setResolved(m.resolveUIExample(component, variant));
      })
      .catch(() => {
        if (!cancelled) setResolved(null);
      });
    return () => {
      cancelled = true;
    };
  }, [component, variant]);

  return (
    <NodeViewWrapper
      className="ui-example-block"
      data-testid="ui-example-block"
      contentEditable={false}
    >
      <div className="ui-example-block__chrome">
        <span className="ui-example-block__label">
          {meta?.label ?? component}
        </span>
        {meta ? (
          <select
            className="ui-example-block__variant"
            data-testid="ui-example-variant"
            value={variant}
            onChange={(e) => updateAttributes({ variant: e.target.value })}
          >
            {meta.variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        ) : null}
        {meta?.allowInteractive ? (
          <button
            type="button"
            className="ui-example-block__interactive"
            data-testid="ui-example-interactive"
            aria-pressed={interactive}
            onClick={() => updateAttributes({ interactive: !interactive })}
          >
            {interactive ? "Interactive" : "Static"}
          </button>
        ) : null}
      </div>
      {resolved === "loading" ? (
        <p className="ui-example-block__status">Loading example…</p>
      ) : resolved === null ? (
        <p className="ui-example-block__status">
          Example unavailable — this component is no longer in the registry.
        </p>
      ) : (
        <div
          className="ui-example-block__stage"
          data-testid="ui-example-stage"
          style={interactive ? undefined : { pointerEvents: "none" }}
        >
          <RenderBoundary key={`${component}:${variant}`}>
            <resolved.Component {...resolved.props} />
          </RenderBoundary>
        </div>
      )}
    </NodeViewWrapper>
  );
}

/**
 * A DS component that throws must not take the document down — show a
 * quiet failure card instead (keyed remount above retries on variant
 * change).
 */
class RenderBoundary extends ReactComponent<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) {
      return <p className="ui-example-block__status">Failed to render.</p>;
    }
    return this.props.children;
  }
}

export default UIExampleView;
```

- [ ] **Step 6: Wire the node view**

In `manual-editor/src/app/editorExtensions.ts`, import the view and add a branch in the `.map()` (after the `image` branch):

```ts
import { UIExampleView } from "./nodeviews/UIExampleView";
```

```ts
if (extension.name === "uiExample") {
  return (extension as Node).extend({
    addNodeView() {
      return ReactNodeViewRenderer(UIExampleView);
    },
  });
}
```

- [ ] **Step 7: Vite config for cross-boundary registry import**

In `manual-editor/vite.config.ts`, extend the config object:

```ts
export default defineConfig({
  root: ".",
  plugins: [react()],
  build: { outDir: "dist", emptyOutDir: true },
  resolve: {
    // The registry chunk (repo-root src/components/manual/UIExample/…)
    // resolves @dilsonspickles/components from the ROOT node_modules, whose
    // peer react would otherwise also come from root (React 18) while the
    // editor bundles its own React 19 — two React copies break hooks.
    dedupe: ["react", "react-dom"],
  },
  server: {
    port: 5273,
    hmr: { clientPort: 5273 },
    // Allow the dev server to serve the repo-root registry files, which
    // live outside the manual-editor Vite root.
    fs: { allow: [".."] },
  },
});
```

- [ ] **Step 8: Block chrome CSS**

Append to `manual-editor/src/app/editor.css`:

```css
/* Curated design-system example block (`uiExample` node). Chrome bar keeps
   the same quiet, bordered-card language as the preserved block. */
.ui-example-block {
  margin: 0.6rem 0;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
}

.ui-example-block__chrome {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.6rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.ui-example-block__label {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
}

.ui-example-block__variant {
  margin-left: auto;
  font-size: 0.8rem;
}

.ui-example-block__interactive {
  padding: 0.15rem 0.55rem;
  border: 1px solid #cbd5e1;
  border-radius: 5px;
  background: #ffffff;
  font-size: 0.75rem;
  font-weight: 600;
  color: #1f2937;
  cursor: pointer;
}

.ui-example-block__interactive[aria-pressed="true"] {
  border-color: #4f46e5;
  background: #e0e7ff;
  color: #4f46e5;
}

.ui-example-block__stage {
  padding: 1.25rem;
  display: flex;
  justify-content: center;
}

.ui-example-block__status {
  padding: 0.9rem 1.25rem;
  margin: 0;
  color: #64748b;
  font-size: 0.85rem;
}
```

- [ ] **Step 9: Run the node-view tests, then the full suite**

Run: `bun test src/app/nodeviews/UIExampleView.test.tsx`
Expected: 4 pass.

Run: `bun test`
Expected: no new failures (the pre-existing `anton-s-draft.mdx` corpus round-trip failure is known and unrelated).

- [ ] **Step 10: Typecheck**

Run: `bunx tsc --noEmit` (from `manual-editor/`)
Expected: clean. If the cross-boundary registry types clash on React 18/19 `ComponentType`, cast at the import boundary in `UIExampleView` (`as ResolvedUIExample`) — the runtime is dedupe'd to one React.

- [ ] **Step 11: Commit**

```bash
git add manual-editor/src/app/ manual-editor/vite.config.ts
git commit -m "feat(manual-editor): Audacity UI slash group with live DS component blocks"
```

---

## Verification after all tasks

1. `cd manual-editor && bun test` — full suite green (minus the known pre-existing corpus failure).
2. `cd manual-editor && bunx tsc --noEmit` — clean.
3. Repo root `bunx astro build` — site builds.
4. Manual browser pass (Alex): insert Button/Checkbox/Knob from `/`, switch variants, toggle interactive, save, open the drafts-branch page, publish preview renders the examples.
