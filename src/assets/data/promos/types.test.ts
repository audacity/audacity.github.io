import { describe, expect, test } from "bun:test";
import { getCurrentTopList, isPromoDateActive } from "./types";
import type { PromoData, TopListCampaign } from "./types";

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

describe("getCurrentTopList", () => {
  const list = (startDate: string, endDate: string): TopListCampaign => ({
    startDate,
    endDate,
    items: [{ name: startDate, tagline: "", href: "" }],
  });
  const sept = list("2026-09-07", "2026-09-30");
  const oct = list("2026-10-01", "2026-10-29");
  const nov = list("2026-10-29", "2026-11-27");

  test("picks the active window", () => {
    expect(getCurrentTopList([sept, oct, nov], "2026-10-10")).toBe(oct);
  });

  test("on an overlapping boundary day, the newer window wins", () => {
    expect(getCurrentTopList([oct, nov], "2026-10-29")).toBe(nov);
  });

  test("falls back to the latest past window in a gap", () => {
    expect(getCurrentTopList([sept, nov], "2026-10-10")).toBe(sept);
  });

  test("never shows an upcoming window early", () => {
    expect(getCurrentTopList([nov], "2026-10-10")).toBeUndefined();
  });
});
