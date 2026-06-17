/**
 * Renders each workspace via a dev-only `snapshot-tmp/[key]` page and writes
 * a WebP per workspace to `public/workspace-snapshots/`. The site uses these
 * images instead of mounting the real WorkspaceCanvas, which would pull in
 * ~148K of design-system JS + ~167K of CSS.
 *
 * Run manually when workspace configs change:
 *   bun run snapshot:workspaces
 *
 * The temp page is created from scripts/snapshot-page-template.astro at the
 * start of each run and deleted on exit (it's also in .gitignore as a
 * safety net).
 */

import { chromium } from "@playwright/test";
import sharp from "sharp";
import { spawn } from "node:child_process";
import { copyFile, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const WORKSPACE_KEYS = ["classic", "music", "modern", "custom"];
const OUT_DIR = resolve("public/workspace-snapshots");
const TEMPLATE = resolve("scripts/snapshot-page-template.astro");
const TMP_DIR = resolve("src/pages/snapshot-tmp");
const TMP_PAGE = resolve(TMP_DIR, "[key].astro");
const VIEWPORT = { width: 1280, height: 720 };
const DEVICE_SCALE = 2;

async function waitForServer(port: number, attempts = 60) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(`http://localhost:${port}/`);
      if (res.status < 500) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`astro dev never became ready on :${port}`);
}

async function isPortInUse(port: number): Promise<boolean> {
  try {
    await fetch(`http://localhost:${port}/`, {
      signal: AbortSignal.timeout(500),
    });
    return true;
  } catch {
    return false;
  }
}

async function main() {
  // Don't run alongside the user's dev server — both processes share
  // node_modules/.vite/deps/ and will corrupt each other's optimizer cache,
  // breaking the running dev server.
  if (await isPortInUse(4321)) {
    throw new Error(
      "Detected something on :4321 — likely your dev server. Stop `bun run dev` and re-run this script, otherwise the Vite optimizer cache will get clobbered.",
    );
  }

  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(TMP_DIR, { recursive: true });
  await copyFile(TEMPLATE, TMP_PAGE);

  const port = 4399;
  const proc = spawn("bun", ["astro", "dev", "--port", String(port)], {
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, NODE_ENV: "development" },
  });
  proc.stdout?.on("data", (d) => process.stdout.write(`[astro] ${d}`));
  proc.stderr?.on("data", (d) => process.stderr.write(`[astro] ${d}`));

  try {
    await waitForServer(port);

    const browser = await chromium.launch();
    const ctx = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: DEVICE_SCALE,
    });

    for (const key of WORKSPACE_KEYS) {
      const url = `http://localhost:${port}/snapshot-tmp/${key}`;
      console.log(`→ ${url}`);
      const page = await ctx.newPage();
      await page.goto(url, { waitUntil: "networkidle" });
      await page.waitForSelector(".workspace-canvas", { timeout: 15_000 });
      // Give the design system a beat to finish painting waveforms.
      await page.waitForTimeout(800);

      const root = page.locator("#snapshot-root");
      const outPath = resolve(OUT_DIR, `${key}.webp`);
      const pngBuffer = await root.screenshot({
        type: "png",
        omitBackground: true,
      });
      await sharp(pngBuffer).webp({ quality: 88 }).toFile(outPath);
      console.log(`  ✓ ${outPath}`);
      await page.close();
    }

    await browser.close();
  } finally {
    proc.kill("SIGINT");
    await new Promise((r) => setTimeout(r, 200));
    await rm(TMP_DIR, { recursive: true, force: true });
  }
}

main().catch(async (err) => {
  console.error(err);
  // Best-effort cleanup if main() threw before the finally landed.
  await rm(TMP_DIR, { recursive: true, force: true }).catch(() => {});
  process.exit(1);
});
