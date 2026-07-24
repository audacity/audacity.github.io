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
// The package's GLOBAL stylesheet: theme custom properties and the icon
// @font-face. Per-component CSS (auto-imported by each dist module) depends
// on these — without this import components render as collapsed layouts and
// tofu-box icon glyphs. Importing it here covers both consumers: the site
// (static import via UIExample.tsx) and the editor (arrives with the
// dynamically imported registry chunk).
import "@dilsonspickles/components/style.css";
import { Button } from "@dilsonspickles/components/Button";
import { Checkbox } from "@dilsonspickles/components/Checkbox";
import { Knob } from "@dilsonspickles/components/Knob";
import { GhostButton } from "@dilsonspickles/components/GhostButton";
import { PanKnob } from "@dilsonspickles/components/PanKnob";
import { NumberStepper } from "@dilsonspickles/components/NumberStepper";
import { FilterChip } from "@dilsonspickles/components/FilterChip";
import { MasterMeter } from "@dilsonspickles/components/MasterMeter";
import { resolveUIExampleProps, uiExampleMeta } from "./registryData";
import type { UIExampleMeta } from "../../../../manual-editor/src/uiExample/meta";

type AnyComponent = ComponentType<Record<string, unknown>>;

const COMPONENTS: Record<string, AnyComponent> = {
  button: Button as unknown as AnyComponent,
  checkbox: Checkbox as unknown as AnyComponent,
  knob: Knob as unknown as AnyComponent,
  "ghost-button": GhostButton as unknown as AnyComponent,
  "pan-knob": PanKnob as unknown as AnyComponent,
  "number-stepper": NumberStepper as unknown as AnyComponent,
  "filter-chip": FilterChip as unknown as AnyComponent,
  "master-meter": MasterMeter as unknown as AnyComponent,
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
