# UIExample: Design-System Components in the Manual Editor — Design

**Date:** 2026-07-23
**Status:** Approved pending final review
**Owner:** Alex (design lead) — registry curation; engineering — editor/site integration

## Goal

Let manual writers insert real Audacity design-system components
(`@dilsonspickles/components`) into manual pages from the editor's `/` slash
menu — live-rendered in the editor, and rendered on the published site either
as static server-rendered illustrations or as interactive hydrated islands.
Living UI examples replace screenshots that go stale with every UI revision.

## Decisions (agreed in brainstorming)

1. **Rendering model:** both static and interactive, chosen per insert.
2. **Curation:** a curated registry file — never auto-enumeration of the
   package's 265 exports. Nothing appears in the menu without a working
   preset.
3. **Props:** named variants (Storybook-style states) only, defined in the
   registry. No free-form prop editing by writers. The registry schema
   reserves an `editableProps` field so whitelisted scalar-prop editing can
   be added later without migration.
4. **Serialization:** a wrapper component reference, not resolved props:
   `<UIExample component="knob" variant="at-75" interactive client:load />`.
   Presets stay centrally maintained; a DS API change is fixed by editing
   the registry once, not migrating every published page. Variant identity
   survives in the source, so the editor can re-offer the variant dropdown
   on load.

## What the writer experiences

- A new **"Audacity UI"** group appears in the `/` slash menu (third group,
  after "Basic blocks" and "Manual blocks"), listing curated components by
  label with a short hint. The existing type-to-filter behaviour applies.
- Selecting one inserts the component as a block, rendered **live** with the
  default (first) variant's preset props.
- The block renders with a chrome bar (consistent with the preserved-block
  card styling): component label, a **variant dropdown** listing the entry's
  variants, and a **Static / Interactive toggle**. The toggle is hidden when
  the registry entry has `allowInteractive: false`.
- In static mode the in-editor render gets `pointer-events: none` so the
  writer sees what a reader sees.
- No prop editing UI exists anywhere in this phase.

## The registry

**Location:** `src/components/manual/UIExample/registry.tsx` (repo root,
site side — next to the wrapper that consumes it). The editor imports it
across the package boundary via relative path; `@dilsonspickles/components`
is added to `manual-editor/package.json` as a direct dependency so the
editor bundle resolves it independently of the root install.

**Schema:**

```ts
import type { ComponentType } from "react";

export interface UIExampleVariant {
  /** Stable id serialized into MDX (`variant="at-75"`). Never renamed once published. */
  id: string;
  /** Human label shown in the block's variant dropdown. */
  label: string;
  /**
   * Full props for this state, including complex data (waveform arrays via
   * the DS's own generators, envelope point lists, …). Complex data lives
   * ONLY here — writers never author it.
   */
  props: Record<string, unknown>;
}

export interface UIExampleEntry {
  /** Stable id serialized into MDX (`component="knob"`). Never renamed once published. */
  id: string;
  /**
   * Lazy loader for the real component, e.g.
   * `() => import("@dilsonspickles/components").then((m) => m.Knob)`.
   * A thunk (not a direct reference) so that bundles importing the registry
   * for metadata (slash menu, site island) don't statically pull every
   * curated component; both the editor node view and the site wrapper
   * render through `React.lazy`-style resolution of this loader.
   */
  load: () => Promise<ComponentType<Record<string, unknown>>>;
  /** Menu label, e.g. "Knob". */
  label: string;
  /** Short menu hint, e.g. "Rotary control". */
  hint?: string;
  /** Offer the Static/Interactive toggle for this component. */
  allowInteractive: boolean;
  /**
   * Component cannot server-render (canvas/useEffect drawing). Forces the
   * client directive even in static mode — "static" then means
   * non-interactive, not zero-JS.
   */
  needsBrowser?: boolean;
  /** First entry is the default used on insert. Must be non-empty. */
  variants: UIExampleVariant[];
  /** RESERVED for phase 2 (whitelisted scalar prop editing). Unused now. */
  editableProps?: never;
}

export const UI_EXAMPLES: UIExampleEntry[] = [
  /* … */
];
```

**Seed set (Alex to confirm/adjust when curating):** Button, GhostButton,
Checkbox, Knob, PanKnob, NumberStepper, FilterChip, MasterMeter. Each entry
ships only after being visually verified in the editor and on a built page.

## Serialization contract

Static insert:

```mdx
import UIExample from "../../../components/manual/UIExample/UIExample";

<UIExample component="knob" variant="default" />
```

(`UIExample` is a **React** component, not `.astro` — Astro client
directives are only valid on framework components, and the interactive form
below hangs `client:load` directly on it. With no directive, Astro
server-renders it with zero JS shipped.)

Interactive insert:

```mdx
<UIExample component="knob" variant="at-75" interactive client:load />
```

Rules:

- `component` and `variant` are always present, always registry ids.
- `interactive` is a bare (valueless) attribute; presence = true. The
  existing valueless-attribute machinery (see the `shortcut` node's
  `client:load` handling) is reused.
- The client directive is emitted when `interactive` OR the entry's
  `needsBrowser` is set; it is derived state, never independently authored.
- `ensureComponentImports` learns the `UIExample` import so saves inject it
  exactly as they do for `Callout`/`Tabs`.

## Editor integration

- **PM schema:** new block atom `uiExample`, attrs
  `{ component: string, variant: string, interactive: boolean }`.
- **Adapter:** `UIExample` joins the known-flow registry (`adapter/registry.ts`)
  with bidirectional mapping (mdast `mdxJsxFlowElement` ↔ PM node), including
  the derived client-directive rule above. Round-trip must be byte-stable.
- **Node view** (`UIExampleView`): resolves the entry + variant from the
  registry and renders the real component with the preset props inside the
  chrome card (label, variant dropdown, static/interactive toggle). Dropdown
  and toggle write through to the node's attrs (standard
  `updateAttributes`), which marks the doc dirty and rides the existing
  autosave path.
- **Slash menu:** `GROUP_ORDER` gains "Audacity UI"; items generated from
  `UI_EXAMPLES`. Insert command creates the node with the entry's first
  variant, static.
- **Unknown-id fallback:** if MDX references a `component` (or `variant`) id
  missing from the registry, the block renders the existing preserved-block
  card ("kept exactly as-is") rather than crashing; the source is preserved
  verbatim. This covers registry entries deleted after pages were published.

## Site integration

- **`UIExample.tsx`** (React) in `src/components/manual/UIExample/`:
  resolves id + variant via the shared registry, resolves the entry's `load`
  thunk, and renders the component with the preset props. `interactive` is
  passed through so components that take an interactivity-related prop can
  respect it; static mode additionally applies `pointer-events: none`.
- **Bundle size:** the registry stores lazy `load` thunks (see schema), so
  hydrating one Knob island doesn't ship the whole curated set to the
  reader; the bundler code-splits per resolved import.
- **Missing id at build time:** render a quiet inline placeholder
  (`<em>Example unavailable</em>`-class treatment) and log a build warning —
  never fail the site build over a stale example reference.

## Failure modes considered

| Failure                                                | Behaviour                                                                                                                                           |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Registry entry deleted after publish                   | Editor: preserved-block fallback. Site: placeholder + build warning.                                                                                |
| Component throws while rendering in editor             | Node view wraps render in an error boundary; card shows "failed to render" with the entry label. Doc content unaffected.                            |
| DS package API change                                  | Registry file fails typecheck / visibly breaks in editor during curation — caught before writers see it. Published MDX unaffected (ids, not props). |
| Writer's page references variant removed from an entry | Same preserved-block fallback as unknown component id.                                                                                              |

## Testing

- Registry validity: unique entry/variant ids, non-empty variants, every
  `component` renders under an error boundary without throwing (happy-dom).
- Adapter round-trip: static and interactive forms serialize byte-stable,
  including the derived `client:load` rule and `needsBrowser` interaction.
- Node view: renders a stub entry; variant dropdown and toggle update attrs.
- Slash menu: "Audacity UI" group lists entries; insert creates the node
  with default variant.
- `ensureComponentImports`: UIExample import injected when the node is
  present.
- Site wrapper: resolves known id; placeholder for unknown id.

## Implementation amendments (discovered during planning)

Plan: `docs/superpowers/plans/2026-07-23-ui-example-components.md`. Three
findings during planning amend the letter (not the intent) of this spec:

1. **Static imports, not lazy thunks.** Astro server-renders static-mode
   examples with `renderToString`, where effects and `React.lazy` never
   resolve — a lazy-thunk registry would render nothing in static mode.
   The registry instead uses **static deep subpath imports**
   (`@dilsonspickles/components/Button`, enabled by the package's `"./*"`
   export map), which keeps island chunks scoped per component.
2. **Registry split in three.** The DS package's dist files carry CSS
   side-effect imports that `bun test` cannot load, so anything the editor
   test suite touches must not import it. Shape:
   `manual-editor/src/uiExample/meta.ts` (ids/labels/variants — pure data),
   root `registryData.ts` (variant props — pure data), root `registry.tsx`
   (component map — the only DS importer; the editor node view loads it via
   runtime dynamic import, which also gives tests a mocking seam).
3. **Seed set is 3, not 8.** Button, Checkbox, Knob ship first — their
   props were verified against the package's type declarations. The
   remaining candidates (GhostButton, PanKnob, NumberStepper, FilterChip,
   MasterMeter) are curation work once the machinery lands.

No `@dilsonspickles/components` entry is added to
`manual-editor/package.json`: the registry file lives at the repo root, so
Node resolution finds the root install; the editor's Vite config gains
`resolve.dedupe: ["react", "react-dom"]` so the DS package shares the
editor's React copy (19 vs the root's 18) instead of double-bundling.

## Out of scope (explicitly deferred)

- Whitelisted scalar prop editing (`editableProps`) — phase 2; schema
  already reserves the field.
- An "insert any export by name" escape hatch.
- Prop editing of complex data (waveforms, envelopes) — permanently out;
  such data lives only in registry presets.
