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
