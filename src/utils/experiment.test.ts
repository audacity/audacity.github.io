import { afterEach, describe, expect, test } from "bun:test";
import { hashToSlot, getVariant, resolveVariant } from "./experiment";
import type { Experiment } from "../assets/data/experiments";

// resolveVariant / getVariant read window.location.search (?ab= force),
// sessionStorage (the force remembered for the tab), document.cookie
// (aud_ab_id) and <html data-os>. Stub them so the force/cohort/OS logic
// runs in node.
type StubGlobals = {
  window: unknown;
  document: unknown;
  sessionStorage: unknown;
};
const stub = globalThis as unknown as StubGlobals;
function setEnv(
  ab: string | null,
  abId: number | null,
  os: string | null = "win",
  stored: string | null = null,
): void {
  // ab === "" models a bare "?ab=" in the URL.
  stub.window = { location: { search: ab === null ? "" : `?ab=${ab}` } };
  stub.sessionStorage = {
    getItem: (key: string) => (key === "audacity-ab" ? stored : null),
  };
  stub.document = {
    cookie: abId === null ? "" : `aud_ab_id=${abId}`,
    documentElement: {
      getAttribute: (name: string) => (name === "data-os" ? os : null),
    },
  };
}

describe("hashToSlot", () => {
  test("returns a number between 0 and 9999", () => {
    for (let id = 0; id < 1000; id++) {
      const slot = hashToSlot(id, "test-experiment");
      expect(slot).toBeGreaterThanOrEqual(0);
      expect(slot).toBeLessThan(10000);
    }
  });

  test("is deterministic for the same inputs", () => {
    const a = hashToSlot(42, "hero-cta");
    const b = hashToSlot(42, "hero-cta");
    expect(a).toBe(b);
  });

  test("different experiment names produce different slots for same user", () => {
    expect(hashToSlot(12345, "experiment-a")).toBe(8883);
    expect(hashToSlot(12345, "experiment-b")).toBe(8882);
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

  test("supports fractional weights (10% control + four 22.5% arms)", () => {
    const experiment: Experiment = {
      name: "fractional",
      variants: [
        { name: "control", weight: 10 },
        { name: "a", weight: 22.5 },
        { name: "b", weight: 22.5 },
        { name: "c", weight: 22.5 },
        { name: "d", weight: 22.5 },
      ],
      enabled: true,
    };
    const counts: Record<string, number> = {
      control: 0,
      a: 0,
      b: 0,
      c: 0,
      d: 0,
    };
    // Every possible cookie id (the edge function issues 0–99999).
    const total = 100000;
    for (let id = 0; id < total; id++) {
      counts[getVariant(experiment, id)]++;
    }
    expect(counts.control / total).toBeCloseTo(0.1, 2);
    for (const arm of ["a", "b", "c", "d"]) {
      expect(counts[arm] / total).toBeCloseTo(0.225, 2);
    }
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
  const origStorage = stub.sessionStorage;
  afterEach(() => {
    stub.window = origWindow;
    stub.document = origDocument;
    stub.sessionStorage = origStorage;
  });

  describe("a force remembered for the tab", () => {
    test("applies on later pages with no ?ab= in the URL", () => {
      setEnv(null, 12345, "win", "dark:treatment");
      expect(resolveVariant(dark)).toBe("treatment");
    });

    test("a ?ab= in the URL wins over the remembered one", () => {
      setEnv("dark:control", null, "win", "dark:treatment");
      expect(resolveVariant(dark)).toBe("control");
    });

    test("?ab=off ends the preview even while one is remembered", () => {
      setEnv("off", null, "win", "dark:treatment");
      expect(resolveVariant(dark)).toBeNull();
    });

    test("a bare ?ab= ends the preview too", () => {
      setEnv("", null, "win", "dark:treatment");
      expect(resolveVariant(dark)).toBeNull();
    });

    test("no sessionStorage at all is not an error", () => {
      setEnv(null, 12345);
      stub.sessionStorage = undefined;
      expect(resolveVariant(dark)).toBeNull();
      expect(resolveVariant(live)).not.toBeNull();
    });
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

  describe("excludeOs", () => {
    const noLinux: Experiment = {
      ...live,
      name: "no-linux",
      excludeOs: ["linux"],
    };

    test("an excluded OS gets no cohort, even with a cookie", () => {
      setEnv(null, 12345, "linux");
      expect(resolveVariant(noLinux)).toBeNull();
    });

    test("other operating systems are assigned as usual", () => {
      setEnv(null, 12345, "mac");
      expect(resolveVariant(noLinux)).not.toBeNull();
      setEnv(null, 12345, "win");
      expect(resolveVariant(noLinux)).not.toBeNull();
    });

    test("an unknown OS (no data-os yet) is not excluded", () => {
      setEnv(null, 12345, null);
      expect(resolveVariant(noLinux)).not.toBeNull();
    });

    test("a ?ab= force still previews on an excluded OS", () => {
      setEnv("no-linux:treatment", null, "linux");
      expect(resolveVariant(noLinux)).toBe("treatment");
    });
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
