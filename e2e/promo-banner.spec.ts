import { expect, test } from "@playwright/test";
import { campaignBannerPromos } from "../src/assets/data/promos/campaigns";

/**
 * Exercises the promo banner's date-window logic by faking "today".
 *
 * Data-driven from the generated campaigns.ts so it keeps working as the
 * Confluence calendar changes: we pick a real, currently-defined campaign
 * banner, then move the browser clock into and past its window.
 */

const ymd = (iso: string) => iso.slice(0, 10);
const addDays = (iso: string, n: number) => {
  const d = new Date(`${ymd(iso)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const within = (day: string, start?: string, end?: string) =>
  (!start || start <= day) && (!end || day <= end);

type Banner = {
  id: string;
  message: string;
  startDate?: string;
  endDate?: string;
};

// Active banners with a CTA (what PromoBanner can actually render).
const activeBanners: Banner[] = Object.entries(campaignBannerPromos)
  .filter(
    ([, p]) => p.isActive !== false && Boolean(p.cta) && p.type === "banner",
  )
  .map(([id, p]) => ({
    id,
    message: p.message,
    startDate: p.startDate,
    endDate: p.endDate,
  }));

// Target = a fully-dated banner with the latest end (most future-proof). We
// also look for a day inside its window that no *other* active banner covers,
// so selection is deterministic and we can assert its exact copy.
const dated = activeBanners.filter((b) => b.startDate && b.endDate);
const target = dated.sort((a, b) => (a.endDate! < b.endDate! ? 1 : -1))[0];

let soloDay: string | undefined;
if (target) {
  const others = activeBanners.filter((b) => b.id !== target.id);
  for (
    let day = target.startDate!;
    day <= target.endDate!;
    day = addDays(day, 1)
  ) {
    if (others.every((o) => !within(day, o.startDate, o.endDate))) {
      soloDay = day;
      break;
    }
  }
}

// A desktop OS so the banner's osTargets (Windows / OS X) are satisfied.
test.use({
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
});

test.describe("promo banner date windows", () => {
  test.skip(
    !target,
    "No dated campaign banner in campaigns.ts to exercise (calendar may be empty).",
  );

  test("renders an active campaign banner inside its window", async ({
    page,
  }) => {
    const day = soloDay ?? target.startDate!;
    await page.clock.setFixedTime(new Date(`${day}T12:00:00Z`));
    await page.goto("/");

    const banner = page.locator("#promo-banner");
    await expect(banner).toBeVisible();
    await expect(page.locator("#promo-button")).toHaveAttribute("href", /.+/);

    // When the day is exclusive to the target, selection is deterministic and
    // we can assert its exact copy reached the DOM.
    if (soloDay) {
      await expect(banner.getByText(target.message)).toBeVisible();
    }
  });

  test("drops a campaign banner the day after its window ends", async ({
    page,
  }) => {
    const expired = addDays(target.endDate!, 1);
    await page.clock.setFixedTime(new Date(`${expired}T12:00:00Z`));
    await page.goto("/");

    // Hydration settles, then the expired promo must be absent from the DOM.
    await expect(page.getByText(target.message)).toHaveCount(0);
  });
});
