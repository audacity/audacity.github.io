// src/components/manual/UIExample/registry.tsx
/**
 * Component map for the curated UI examples. This module and the
 * interactive islands under `../interactive/` are the ONLY places allowed
 * to import `@audacity-ui/components`, and they must do so via deep
 * subpaths (`@audacity-ui/components/Button`) so a hydrated island
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
import "@audacity-ui/components/style.css";
import { TransportButton } from "@audacity-ui/components/TransportButton";
import { Button } from "@audacity-ui/components/Button";
import { ToolButton } from "@audacity-ui/components/ToolButton";
import { ToggleToolButton } from "@audacity-ui/components/ToggleToolButton";
import { Checkbox } from "@audacity-ui/components/Checkbox";
import { Knob } from "@audacity-ui/components/Knob";
import { GhostButton } from "@audacity-ui/components/GhostButton";
import { PanKnob } from "@audacity-ui/components/PanKnob";
import { NumberStepper } from "@audacity-ui/components/NumberStepper";
import { FilterChip } from "@audacity-ui/components/FilterChip";
import { MasterMeter } from "@audacity-ui/components/MasterMeter";
import { Clip } from "@audacity-ui/components/Clip";
import { ApplicationHeader } from "@audacity-ui/components/ApplicationHeader";
import { ProjectToolbar } from "@audacity-ui/components/ProjectToolbar";
import { TrackControlPanel } from "@audacity-ui/components/TrackControlPanel";
import { TimelineRuler } from "@audacity-ui/components/TimelineRuler";
import { VerticalRuler } from "@audacity-ui/components/VerticalRuler";
import { SelectionToolbar } from "@audacity-ui/components/SelectionToolbar";
import { TimeCode } from "@audacity-ui/components/TimeCode";
import { resolveUIExampleProps, uiExampleMeta } from "./registryData";
import type { UIExampleMeta } from "../../../../manual-editor/src/uiExample/meta";

type AnyComponent = ComponentType<Record<string, unknown>>;

const COMPONENTS: Record<string, AnyComponent> = {
  button: Button as unknown as AnyComponent,
  "transport-button": TransportButton as unknown as AnyComponent,
  "tool-button": ToolButton as unknown as AnyComponent,
  "toggle-tool-button": ToggleToolButton as unknown as AnyComponent,
  checkbox: Checkbox as unknown as AnyComponent,
  knob: Knob as unknown as AnyComponent,
  "ghost-button": GhostButton as unknown as AnyComponent,
  "pan-knob": PanKnob as unknown as AnyComponent,
  "number-stepper": NumberStepper as unknown as AnyComponent,
  "filter-chip": FilterChip as unknown as AnyComponent,
  "master-meter": MasterMeter as unknown as AnyComponent,
  clip: Clip as unknown as AnyComponent,
  "application-header": ApplicationHeader as unknown as AnyComponent,
  "project-toolbar": ProjectToolbar as unknown as AnyComponent,
  "track-control-panel": TrackControlPanel as unknown as AnyComponent,
  "timeline-ruler": TimelineRuler as unknown as AnyComponent,
  "vertical-ruler": VerticalRuler as unknown as AnyComponent,
  "selection-toolbar": SelectionToolbar as unknown as AnyComponent,
  timecode: TimeCode as unknown as AnyComponent,
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
