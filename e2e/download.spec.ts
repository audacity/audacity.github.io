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
    await expect(page.getByText("4.0.0", { exact: true })).toBeVisible();
    // Each OS link also appears in the footer, so scope to the first (the card).
    await expect(
      page.locator('a[href="/download/windows"]').first(),
    ).toBeVisible();
    await expect(page.locator('a[href="/download/mac"]').first()).toBeVisible();
    await expect(
      page.locator('a[href="/download/linux"]').first(),
    ).toBeVisible();
  });

  test("/download/windows offers the Audacity 4 Windows installers", async ({
    page,
  }) => {
    await page.goto("/download/windows");

    await expect(
      page.locator('a[href$="/Audacity-4.0.0/audacity-win-4.0.0-x86_64.msi"]'),
    ).toBeVisible();
    await expect(
      page.locator('a[href$="/Audacity-4.0.0/audacity-win-4.0.0-arm64.msi"]'),
    ).toBeVisible();
  });

  test("/download/mac offers the Audacity 4 macOS downloads", async ({
    page,
  }) => {
    await page.goto("/download/mac");

    for (const filename of [
      "audacity-macOS-4.0.0-universal.dmg",
      "audacity-macOS-4.0.0-arm64.dmg",
      "audacity-macOS-4.0.0-x86_64.dmg",
    ]) {
      await expect(
        page.locator(`a[href$="/Audacity-4.0.0/${filename}"]`),
      ).toBeVisible();
    }
  });

  test("/download/linux offers the Audacity 4 Linux downloads", async ({
    page,
  }) => {
    await page.goto("/download/linux");

    for (const filename of [
      "audacity-linux-4.0.0-x86_64.AppImage",
      "audacity-linux-4.0.0-aarch64.AppImage",
    ]) {
      await expect(
        page.locator(`a[href$="/Audacity-4.0.0/${filename}"]`),
      ).toBeVisible();
    }
  });

  for (const path of olderVersionPages) {
    test(`${path} links to the older versions archive`, async ({ page }) => {
      await page.goto(path);

      const olderVersionsLink = page
        .locator('a[href="/download/older-versions"]')
        .first();
      await expect(olderVersionsLink).toHaveAttribute(
        "href",
        "/download/older-versions",
      );
      await expect(page.locator('a[href*="fosshub.com"]')).toHaveCount(0);
    });
  }
});
