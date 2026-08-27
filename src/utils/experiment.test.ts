import { afterEach, describe, expect, test } from "bun:test";
import { hashToSlot, getVariant, resolveVariant } from "./experiment";
import type { Experiment } from "../assets/data/experiments";

// resolveVariant / getVariant read window.location.search (?ab= force) and
// document.cookie (aud_ab_id). Stub them so the force/cohort logic runs in node.
type StubGlobals = { window: unknown; document: unknown };
const stub = globalThis as unknown as StubGlobals;
function setEnv(ab: string | null, abId: number | null): void {
  stub.window = { location: { search: ab ? `?ab=${ab}` : "" } };
  stub.document = { cookie: abId === null ? "" : `aud_ab_id=${abId}` };
}

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

describe("getVariant ?ab= override", () => {
  const exp: Experiment = {
    name: "demo",
    variants: [
      { name: "control", weight: 50 },
      { name: "treatment", weight: 50 },
    ],
    enabled: true,
  };
  const origWindow = stub.window;
  afterEach(() => {
    stub.window = origWindow;
  });

  test("a valid forced variant wins over the hash", () => {
    setEnv("demo:treatment", null);
    for (let id = 0; id < 50; id++)
      expect(getVariant(exp, id)).toBe("treatment");
  });

  test("an invalid forced variant is ignored, not returned as-is", () => {
    setEnv("demo:bogus", null);
    const v = getVariant(exp, 42);
    expect(v).not.toBe("bogus");
    expect(exp.variants.map((x) => x.name)).toContain(v);
  });

  test("a force for a different experiment is not applied", () => {
    setEnv("other:treatment", null);
    const v = getVariant(exp, 42);
    expect(exp.variants.map((x) => x.name)).toContain(v);
  });
});

describe("resolveVariant", () => {
  const live: Experiment = {
    name: "live",
    variants: [
      { name: "control", weight: 50 },
      { name: "treatment", weight: 50 },
    ],
    enabled: true,
  };
  const dark: Experiment = { ...live, name: "dark", enabled: false };

  const origWindow = stub.window;
  const origDocument = stub.document;
  afterEach(() => {
    stub.window = origWindow;
    stub.document = origDocument;
  });

  test("forces a DARK experiment via ?ab=, even with no cookie", () => {
    setEnv("dark:treatment", null);
    expect(resolveVariant(dark)).toBe("treatment");
  });

  test("a dark experiment stays unassigned without a force (no leakage)", () => {
    setEnv(null, 12345);
    expect(resolveVariant(dark)).toBeNull();
  });

  test("a force wins over the cohort assignment", () => {
    setEnv("live:treatment", 12345);
    expect(resolveVariant(live)).toBe("treatment");
  });

  test("an enabled experiment auto-assigns a valid arm with a cookie", () => {
    setEnv(null, 12345);
    const v = resolveVariant(live);
    expect(v).not.toBeNull();
    expect(live.variants.map((x) => x.name)).toContain(v as string);
  });

  test("an enabled experiment is null without a cookie or force", () => {
    setEnv(null, null);
    expect(resolveVariant(live)).toBeNull();
  });

  test("an invalid forced arm does not apply to a dark experiment", () => {
    setEnv("dark:bogus", null);
    expect(resolveVariant(dark)).toBeNull();
  });

  test("an invalid forced arm on an enabled experiment falls back to cohort", () => {
    setEnv("live:bogus", 12345);
    const v = resolveVariant(live);
    expect(v).not.toBe("bogus");
    expect(v).not.toBeNull();
    expect(live.variants.map((x) => x.name)).toContain(v as string);
  });
});
