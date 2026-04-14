import { describe, expect, test } from "bun:test";
import { hashToSlot, getVariant } from "./experiment";
import type { Experiment } from "../assets/data/experiments";

describe("hashToSlot", () => {
  test("returns a number between 0 and 99", () => {
    for (let id = 0; id < 1000; id++) {
      const slot = hashToSlot(id, "test-experiment");
      expect(slot).toBeGreaterThanOrEqual(0);
      expect(slot).toBeLessThan(100);
    }
  });

  test("is deterministic for the same inputs", () => {
    const a = hashToSlot(42, "hero-cta");
    const b = hashToSlot(42, "hero-cta");
    expect(a).toBe(b);
  });

  test("different experiment names produce different slots for same user", () => {
    expect(hashToSlot(12345, "experiment-a")).toBe(83);
    expect(hashToSlot(12345, "experiment-b")).toBe(82);
  });

  test("different user IDs produce different slots for same experiment", () => {
    const slot1 = hashToSlot(1, "hero-cta");
    const slot2 = hashToSlot(2, "hero-cta");
    expect(slot1).not.toBe(slot2);
  });
});

describe("getVariant", () => {
  const fiftyFifty: Experiment = {
    name: "test",
    variants: [
      { name: "control", weight: 50 },
      { name: "variant-b", weight: 50 },
    ],
    enabled: true,
  };

  test("always returns a valid variant name", () => {
    const validNames = fiftyFifty.variants.map((v) => v.name);
    for (let id = 0; id < 1000; id++) {
      const variant = getVariant(fiftyFifty, id);
      expect(validNames).toContain(variant);
    }
  });

  test("roughly 50/50 distribution over many IDs", () => {
    const counts: Record<string, number> = { control: 0, "variant-b": 0 };
    const total = 10000;
    for (let id = 0; id < total; id++) {
      counts[getVariant(fiftyFifty, id)]++;
    }
    // Allow 10% tolerance
    expect(counts.control).toBeGreaterThan(total * 0.4);
    expect(counts.control).toBeLessThan(total * 0.6);
    expect(counts["variant-b"]).toBeGreaterThan(total * 0.4);
    expect(counts["variant-b"]).toBeLessThan(total * 0.6);
  });

  test("respects unequal weights", () => {
    const experiment: Experiment = {
      name: "weighted",
      variants: [
        { name: "a", weight: 80 },
        { name: "b", weight: 20 },
      ],
      enabled: true,
    };
    const counts: Record<string, number> = { a: 0, b: 0 };
    const total = 10000;
    for (let id = 0; id < total; id++) {
      counts[getVariant(experiment, id)]++;
    }
    // "a" should get ~80% (allow 10% tolerance)
    expect(counts.a).toBeGreaterThan(total * 0.7);
    expect(counts.a).toBeLessThan(total * 0.9);
  });

  test("is deterministic", () => {
    const v1 = getVariant(fiftyFifty, 42);
    const v2 = getVariant(fiftyFifty, 42);
    expect(v1).toBe(v2);
  });
});
