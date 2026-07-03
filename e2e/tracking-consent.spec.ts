import { expect, test, type Page } from "@playwright/test";

// Every host allowed to serve <script> to the front page. Adding a host here
// must be a deliberate, reviewed decision — an unlisted third-party script is
// how the Clarity perf regression shipped unnoticed.
const ALLOWED_SCRIPT_HOSTS = new Set(["localhost", "matomo.audacityteam.org"]);

// Records script requests from non-allowlisted hosts, plus any request at all
// to a known tracker we've removed (Clarity phones home via xhr/beacon too).
const REMOVED_TRACKER_HOSTS = /(^|\.)clarity\.ms$/;

function watchForOffenders(page: Page): string[] {
  const offenders: string[] = [];
  page.on("request", (request) => {
    const { hostname } = new URL(request.url());
    if (REMOVED_TRACKER_HOSTS.test(hostname)) {
      offenders.push(request.url());
    } else if (
      request.resourceType() === "script" &&
      !ALLOWED_SCRIPT_HOSTS.has(hostname)
    ) {
      offenders.push(request.url());
    }
  });
  return offenders;
}

test.describe("tracking consent", () => {
  test("first visit loads scripts only from allowed hosts", async ({
    page,
  }) => {
    const offenders = watchForOffenders(page);
    await page.goto("/");
    await page.waitForLoadState("load");
    // Trackers inject asynchronously; give stragglers a beat to show up.
    await page.waitForTimeout(1500);
    expect(offenders).toEqual([]);
  });

  test("accepting the cookie banner injects no third-party trackers", async ({
    page,
  }) => {
    const offenders = watchForOffenders(page);
    await page.goto("/");
    // The consent popup waits ~2s before showing.
    const accept = page.locator("#accept");
    await expect(accept).toBeVisible({ timeout: 10_000 });
    await accept.click();
    await page.waitForTimeout(1500);
    expect(offenders).toEqual([]);
  });

  test("returning consented visitor gets no tracker injection on load", async ({
    context,
    page,
  }) => {
    // Pre-consented state: this is the code path that used to inject Clarity
    // from matomoTracking.js on every page view.
    await context.addCookies([
      {
        name: "audacity_consent",
        value: "true",
        domain: "localhost",
        path: "/",
      },
    ]);
    const offenders = watchForOffenders(page);
    await page.goto("/");
    await page.waitForLoadState("load");
    await page.waitForTimeout(1500);
    expect(offenders).toEqual([]);
    // And the banner should not reappear.
    await expect(page.locator("#consent-popup")).toHaveClass(/hide/);
  });
});
