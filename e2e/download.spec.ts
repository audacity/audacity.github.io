import { expect, test } from "@playwright/test";

test.describe("downloads", () => {
  const olderVersionPages = [
    "/download",
    "/download/windows",
    "/download/mac",
    "/download/linux",
  ];

  test("/download lists the three OS targets", async ({ page }) => {
    await page.goto("/download");

    await expect(
      page.getByRole("heading", { name: "Downloads" }),
    ).toBeVisible();
    // Each OS link also appears in the footer, so scope to the first (the card).
    await expect(
      page.locator('a[href="/download/windows"]').first(),
    ).toBeVisible();
    await expect(page.locator('a[href="/download/mac"]').first()).toBeVisible();
    await expect(
      page.locator('a[href="/download/linux"]').first(),
    ).toBeVisible();
  });

  test("/download/windows offers a real Windows installer", async ({
    page,
  }) => {
    await page.goto("/download/windows");

    // The DownloadCard hydrates an <a> pointing at the published installer.
    const installer = page
      .locator('a[href*="github.com/audacity/audacity/releases"][href$=".exe"]')
      .first();
    await expect(installer).toBeVisible();
    await expect(installer).toHaveAttribute("href", /audacity-win-.*\.exe$/);
  });

  test("/download/mac offers a real macOS installer", async ({ page }) => {
    await page.goto("/download/mac");

    const installer = page
      .locator('a[href*="github.com/audacity/audacity/releases"][href$=".dmg"]')
      .first();
    await expect(installer).toBeVisible();
  });

  for (const path of olderVersionPages) {
    test(`${path} links older versions to GitHub releases`, async ({
      page,
    }) => {
      await page.goto(path);

      const olderVersionsLink = page.getByRole("link", {
        name: /download older versions/i,
      });
      await expect(olderVersionsLink).toHaveAttribute(
        "href",
        "https://github.com/audacity/audacity/releases",
      );
      await expect(page.locator('a[href*="fosshub.com"]')).toHaveCount(0);
    });
  }
});
