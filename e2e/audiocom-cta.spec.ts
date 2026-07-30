import { expect, test, type Locator, type Page } from "@playwright/test";

// Stub Matomo's queue and block the real tracker + navigation to audio.com so
// we can inspect what the click handler pushed, without a live Matomo
// instance replacing window._paq (it becomes an opaque tracker object once
// matomo.js loads) or the browser actually leaving the page.
async function primeMatomoStub(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as { _paq: unknown[] })._paq = [];
  });
  await page.route("https://matomo.audacityteam.org/**", (route) =>
    route.abort(),
  );
  await page.route("https://audio.com/**", (route) => route.abort());
}

// The CTA is SSR-rendered and visible immediately, but its onClick only
// exists once React hydrates the surrounding astro-island. Astro removes
// that island's "ssr" attribute the moment hydration finishes — waiting on
// visibility alone races the click against hydration and is flaky under
// parallel workers (a slower page gives hydration more accidental head start).
async function waitForCtaHydration(page: Page) {
  await page.waitForFunction(() => {
    const link = [...document.querySelectorAll("a")].find(
      (a) => a.textContent?.trim() === "Continue",
    );
    const island = link?.closest("astro-island");
    return island != null && !island.hasAttribute("ssr");
  });
}

async function clickWithoutNavigating(link: Locator) {
  await link.evaluate((el) => {
    el.addEventListener("click", (e) => e.preventDefault(), {
      once: true,
      capture: true,
    });
    (el as HTMLElement).click();
  });
}

async function getTrackEventCalls(page: Page) {
  const paq = await page.evaluate(
    () => (window as unknown as { _paq: unknown[][] })._paq,
  );
  return paq.filter((entry) => entry[0] === "trackEvent");
}

test.describe("audio.com CTA — Matomo click tracking", () => {
  // Each of JoinAudioDotComButton's three call sites must hydrate
  // (client:load) and pass an explicit matomoEventName. A CTA that renders
  // without a client directive ships as static HTML and its onClick never
  // fires at all — this suite catches that regardless of which placement
  // regresses.
  const placements: { path: string; label: string }[] = [
    { path: "/", label: "homepage block CTA" },
    { path: "/post-download", label: "post-download CTA" },
    { path: "/cloud-saving", label: "Cloudsaving page" },
  ];

  for (const { path, label } of placements) {
    test(`${path} CTA hydrates and fires a "${label}" Matomo event on click`, async ({
      page,
    }) => {
      await primeMatomoStub(page);
      await page.goto(path);
      await waitForCtaHydration(page);

      const cta = page.getByRole("link", { name: "Continue" }).first();
      await expect(cta).toBeVisible();

      await clickWithoutNavigating(cta);

      const trackEventCalls = await getTrackEventCalls(page);
      expect(trackEventCalls).toHaveLength(1);
      const [, category, action, name] = trackEventCalls[0];
      expect(category).toBe("CTA Button");
      // Fully anchored: trackEvent appends "(branch: ...)" to whatever action
      // string it's given, so a prefix-only match would still pass if the
      // action were accidentally renamed (e.g. "audio.com CTA renamed").
      expect(action).toMatch(/^audio\.com CTA \(branch: .+\)$/);
      // Exact match, not just "truthy" — a silent fallback to the
      // component's default label ("audio.com block CTA") would blend this
      // placement's data with ~16 months of pre-fix unlabeled events.
      expect(name).toBe(label);
    });
  }
});
