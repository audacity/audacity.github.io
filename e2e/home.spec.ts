import { expect, test } from "@playwright/test";

// A Windows UA so the OS-aware download links resolve to the Windows installer.
test.use({
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
});

test.describe("front page", () => {
  test("loads with the hero and a real Windows installer link", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Audacity/i);
    await expect(
      page.getByRole("heading", {
        name: "The world's most popular app to record and edit audio",
      }),
    ).toBeVisible();

    // The hero download button hydrates and exposes the real installer for the
    // detected OS (Windows here).
    const installer = page.locator('a[href*="audacity-win-"]').first();
    await expect(installer).toBeVisible();
    await expect(installer).toHaveAttribute("href", /audacity-win-.*\.exe$/);
  });

  test("renders the featured release video section", async ({ page }) => {
    await page.goto("/");
    // ReleaseVideo mounts two SplitFeaturedVideo slots; the first-party
    // Audacity 4 video occupies slot 1.
    await expect(
      page
        .getByRole("heading", { name: "How we're building Audacity 4" })
        .first(),
    ).toBeVisible();
  });

  test("primary navigation exposes the downloads link", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("link", { name: "Downloads" }).first();
    await expect(nav).toBeVisible();
    await expect(nav).toHaveAttribute("href", "/download");
  });
});
