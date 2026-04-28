import { describe, expect, test } from "bun:test";
import { isPromoDateActive } from "./types";
import type { PromoData } from "./types";

const makePromo = (overrides: Partial<PromoData> = {}): PromoData => ({
  type: "banner",
  message: "Test promo",
  ...overrides,
});

describe("isPromoDateActive", () => {
  describe("no date range set", () => {
    test("returns true when neither startDate nor endDate is set", () => {
      expect(isPromoDateActive(makePromo(), "2026-04-28")).toBe(true);
    });
  });

  describe("startDate only", () => {
    test("returns false before startDate", () => {
      expect(
        isPromoDateActive(makePromo({ startDate: "2026-04-29" }), "2026-04-28"),
      ).toBe(false);
    });

    test("returns true on startDate", () => {
      expect(
        isPromoDateActive(makePromo({ startDate: "2026-04-29" }), "2026-04-29"),
      ).toBe(true);
    });

    test("returns true after startDate", () => {
      expect(
        isPromoDateActive(makePromo({ startDate: "2026-04-29" }), "2026-05-01"),
      ).toBe(true);
    });
  });

  describe("endDate only", () => {
    test("returns true before endDate", () => {
      expect(
        isPromoDateActive(makePromo({ endDate: "2026-05-13" }), "2026-05-12"),
      ).toBe(true);
    });

    test("returns true on endDate", () => {
      expect(
        isPromoDateActive(makePromo({ endDate: "2026-05-13" }), "2026-05-13"),
      ).toBe(true);
    });

    test("returns false after endDate", () => {
      expect(
        isPromoDateActive(makePromo({ endDate: "2026-05-13" }), "2026-05-14"),
      ).toBe(false);
    });
  });

  describe("startDate and endDate", () => {
    const promo = makePromo({ startDate: "2026-04-29", endDate: "2026-05-13" });

    test("returns false before window", () => {
      expect(isPromoDateActive(promo, "2026-04-28")).toBe(false);
    });

    test("returns true on first day", () => {
      expect(isPromoDateActive(promo, "2026-04-29")).toBe(true);
    });

    test("returns true mid-window", () => {
      expect(isPromoDateActive(promo, "2026-05-06")).toBe(true);
    });

    test("returns true on last day", () => {
      expect(isPromoDateActive(promo, "2026-05-13")).toBe(true);
    });

    test("returns false after window", () => {
      expect(isPromoDateActive(promo, "2026-05-14")).toBe(false);
    });
  });
});
