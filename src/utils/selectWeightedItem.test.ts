import { describe, expect, test } from "bun:test";
import { selectWeightedItem } from "./selectWeightedItem";

const withMockedRandom = <T>(value: number, run: () => T): T => {
  const originalRandom = Math.random;
  Math.random = () => value;

  try {
    return run();
  } finally {
    Math.random = originalRandom;
  }
};

describe("selectWeightedItem", () => {
  test("returns null for empty input", () => {
    const selected = selectWeightedItem([], () => 1);
    expect(selected).toBeNull();
  });

  test("selects item by weight fraction", () => {
    const items = ["A", "B"];

    const selectedFirst = withMockedRandom(0, () =>
      selectWeightedItem(items, (item) => (item === "A" ? 1 : 3)),
    );
    const selectedSecond = withMockedRandom(0.3, () =>
      selectWeightedItem(items, (item) => (item === "A" ? 1 : 3)),
    );

    expect(selectedFirst).toBe("A");
    expect(selectedSecond).toBe("B");
  });

  test("uses random fallback when total weight is zero", () => {
    const items = ["A", "B", "C"];

    const selected = withMockedRandom(0.6, () =>
      selectWeightedItem(items, () => 0, { fallback: "random" }),
    );

    expect(selected).toBe("B");
  });

  test("uses highest fallback when total weight is zero", () => {
    const items = ["A", "B", "C"];

    const selected = selectWeightedItem(
      items,
      (item) => (item === "B" ? 3 : 0),
      { fallback: "highest" },
    );

    expect(selected).toBe("B");
  });

  test("treats negative weights as zero", () => {
    const items = ["A", "B"];

    const selected = withMockedRandom(0.99, () =>
      selectWeightedItem(items, (item) => (item === "A" ? -5 : 2)),
    );

    expect(selected).toBe("B");
  });
});
