import { describe, expect, test } from "bun:test";
import { nextIndex } from "./cycle.js";

describe("nextIndex", () => {
  test("advances by one", () => {
    expect(nextIndex(0, 5)).toBe(1);
    expect(nextIndex(3, 5)).toBe(4);
  });

  test("wraps to zero at the end", () => {
    expect(nextIndex(4, 5)).toBe(0);
  });

  test("returns 0 for non-positive length", () => {
    expect(nextIndex(2, 0)).toBe(0);
    expect(nextIndex(2, -1)).toBe(0);
  });
});
