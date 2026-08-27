/*
  Older Audacity releases, for /download/older-versions.

  Generated from the GitHub releases API. Snapshot, not a live fetch — the
  build stays offline and a GitHub outage or rate limit can't fail it, at the
  cost of needing a regen when a version ships. Same trade-off as
  audacityReleases.ts.

  Only 3.0.0 and later appear: GitHub carries no binaries for 2.1.1 through
  2.4.2, which were distributed elsewhere. The page says so rather than
  pretending the history starts in 2021.

  Prereleases are excluded. Where a release published several builds for a
  platform, the mainstream one is linked (64-bit installer, universal dmg)
  and releaseUrl points at the full asset list.
*/
export type OlderRelease = {
  version: string;
  date: string;
  releaseUrl: string;
  win: string | null;
  mac: string | null;
  linux: string | null;
  manual: string | null;
};

export const olderReleases: OlderRelease[] = [
  {
    version: "3.7.8",
    date: "2026-06-11",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.7.8",
    win: "https://github.com/audacity/audacity/releases/download/Audacity-3.7.8/audacity-win-3.7.8-64bit.exe",
    mac: "https://github.com/audacity/audacity/releases/download/Audacity-3.7.8/audacity-macOS-3.7.8-universal.dmg",
    linux:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.7.8/audacity-linux-3.7.8-x64-20.04.AppImage",
    manual:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.7.8/audacity-manual-3.7.8.tar.gz",
  },
  {
    version: "3.7.7",
    date: "2025-12-11",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.7.7",
    win: "https://github.com/audacity/audacity/releases/download/Audacity-3.7.7/audacity-win-3.7.7-64bit.exe",
    mac: "https://github.com/audacity/audacity/releases/download/Audacity-3.7.7/audacity-macOS-3.7.7-universal.dmg",
    linux:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.7.7/audacity-linux-3.7.7-x64-20.04.AppImage",
    manual: null,
  },
  {
    version: "3.7.6",
    date: "2025-12-04",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.7.6",
    win: "https://github.com/audacity/audacity/releases/download/Audacity-3.7.6/audacity-win-3.7.6-64bit.exe",
    mac: "https://github.com/audacity/audacity/releases/download/Audacity-3.7.6/audacity-macOS-3.7.6-universal.dmg",
    linux:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.7.6/audacity-linux-3.7.6-x64-20.04.AppImage",
    manual:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.7.6/audacity-manual-3.7.6.tar.gz",
  },
  {
    version: "3.7.5",
    date: "2025-08-05",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.7.5",
    win: "https://github.com/audacity/audacity/releases/download/Audacity-3.7.5/audacity-win-3.7.5-64bit.exe",
    mac: "https://github.com/audacity/audacity/releases/download/Audacity-3.7.5/audacity-macOS-3.7.5-universal.dmg",
    linux:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.7.5/audacity-linux-3.7.5-x64-20.04.AppImage",
    manual:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.7.5/audacity-manual-3.7.5.tar.gz",
  },
  {
    version: "3.7.4",
    date: "2025-06-10",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.7.4",
    win: "https://github.com/audacity/audacity/releases/download/Audacity-3.7.4/audacity-win-3.7.4-64bit.exe",
    mac: "https://github.com/audacity/audacity/releases/download/Audacity-3.7.4/audacity-macOS-3.7.4-universal.dmg",
    linux:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.7.4/audacity-linux-3.7.4-x64-22.04.AppImage",
    manual:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.7.4/audacity-manual-3.7.4.tar.gz",
  },
  {
    version: "3.7.3",
    date: "2025-03-13",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.7.3",
    win: "https://github.com/audacity/audacity/releases/download/Audacity-3.7.3/audacity-win-3.7.3-64bit.exe",
    mac: "https://github.com/audacity/audacity/releases/download/Audacity-3.7.3/audacity-macOS-3.7.3-universal.dmg",
    linux:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.7.3/audacity-linux-3.7.3-x64-20.04.AppImage",
    manual:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.7.3/audacity-manual-3.7.3.tar.gz",
  },
  {
    version: "3.7.2",
    date: "2025-03-10",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.7.2",
    win: "https://github.com/audacity/audacity/releases/download/Audacity-3.7.2/audacity-win-3.7.2-64bit.exe",
    mac: "https://github.com/audacity/audacity/releases/download/Audacity-3.7.2/audacity-macOS-3.7.2-universal.dmg",
    linux:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.7.2/audacity-linux-3.7.2-x64-20.04.AppImage",
    manual:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.7.2/audacity-manual-3.7.2.tar.gz",
  },
  {
    version: "3.7.1",
    date: "2024-12-12",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.7.1",
    win: "https://github.com/audacity/audacity/releases/download/Audacity-3.7.1/audacity-win-3.7.1-64bit.exe",
    mac: "https://github.com/audacity/audacity/releases/download/Audacity-3.7.1/audacity-macOS-3.7.1-universal.dmg",
    linux:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.7.1/audacity-linux-3.7.1-x64-20.04.AppImage",
    manual:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.7.1/audacity-manual-3.7.1.tar.gz",
  },
  {
    version: "3.7.0",
    date: "2024-10-30",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.7.0",
    win: "https://github.com/audacity/audacity/releases/download/Audacity-3.7.0/audacity-win-3.7.0-64bit.exe",
    mac: "https://github.com/audacity/audacity/releases/download/Audacity-3.7.0/audacity-macOS-3.7.0-universal.dmg",
    linux:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.7.0/audacity-linux-3.7.0-x64-20.04.AppImage",
    manual:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.7.0/audacity-manual-3.7.0.tar.gz",
  },
  {
    version: "3.6.4",
    date: "2024-09-19",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.6.4",
    win: "https://github.com/audacity/audacity/releases/download/Audacity-3.6.4/audacity-win-3.6.4-64bit.exe",
    mac: "https://github.com/audacity/audacity/releases/download/Audacity-3.6.4/audacity-macOS-3.6.4-universal.dmg",
    linux:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.6.4/audacity-linux-3.6.4-x64.AppImage",
    manual:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.6.4/audacity-manual-3.6.4.tar.gz",
  },
  {
    version: "3.6.3",
    date: "2024-09-09",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.6.3",
    win: "https://github.com/audacity/audacity/releases/download/Audacity-3.6.3/audacity-win-3.6.3-64bit.exe",
    mac: "https://github.com/audacity/audacity/releases/download/Audacity-3.6.3/audacity-macOS-3.6.3-universal.dmg",
    linux:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.6.3/audacity-linux-3.6.3-x64.AppImage",
    manual: null,
  },
  {
    version: "3.6.2",
    date: "2024-09-03",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.6.2",
    win: "https://github.com/audacity/audacity/releases/download/Audacity-3.6.2/audacity-win-3.6.2-64bit.exe",
    mac: "https://github.com/audacity/audacity/releases/download/Audacity-3.6.2/audacity-macOS-3.6.2-universal.dmg",
    linux:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.6.2/audacity-linux-3.6.2-x64.AppImage",
    manual:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.6.2/audacity-manual-3.6.2.tar.gz",
  },
  {
    version: "3.6.1",
    date: "2024-07-22",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.6.1",
    win: "https://github.com/audacity/audacity/releases/download/Audacity-3.6.1/audacity-win-3.6.1-64bit.exe",
    mac: "https://github.com/audacity/audacity/releases/download/Audacity-3.6.1/audacity-macOS-3.6.1-universal.dmg",
    linux:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.6.1/audacity-linux-3.6.1-x64.AppImage",
    manual:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.6.1/audacity-manual-3.6.1.tar.gz",
  },
  {
    version: "3.6.0",
    date: "2024-07-16",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.6.0",
    win: "https://github.com/audacity/audacity/releases/download/Audacity-3.6.0/audacity-win-3.6.0-64bit.exe",
    mac: "https://github.com/audacity/audacity/releases/download/Audacity-3.6.0/audacity-macOS-3.6.0-universal.dmg",
    linux:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.6.0/audacity-linux-3.6.0-x64.AppImage",
    manual:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.6.0/audacity-manual-3.6.0.tar.gz",
  },
  {
    version: "3.5.1",
    date: "2024-04-24",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.5.1",
    win: "https://github.com/audacity/audacity/releases/download/Audacity-3.5.1/audacity-win-3.5.1-64bit.exe",
    mac: "https://github.com/audacity/audacity/releases/download/Audacity-3.5.1/audacity-macOS-3.5.1-universal.dmg",
    linux:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.5.1/audacity-linux-3.5.1-x64.AppImage",
    manual:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.5.1/audacity-manual-3.5.1.tar.gz",
  },
  {
    version: "3.5.0",
    date: "2024-04-22",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.5.0",
    win: "https://github.com/audacity/audacity/releases/download/Audacity-3.5.0/audacity-win-3.5.0-64bit.exe",
    mac: "https://github.com/audacity/audacity/releases/download/Audacity-3.5.0/audacity-macOS-3.5.0-universal.dmg",
    linux:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.5.0/audacity-linux-3.5.0-x64.AppImage",
    manual:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.5.0/audacity-manual-3.5.0.tar.gz",
  },
  {
    version: "3.4.2",
    date: "2023-11-16",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.4.2",
    win: "https://github.com/audacity/audacity/releases/download/Audacity-3.4.2/audacity-win-3.4.2-64bit.exe",
    mac: "https://github.com/audacity/audacity/releases/download/Audacity-3.4.2/audacity-macOS-3.4.2-universal.dmg",
    linux:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.4.2/audacity-linux-3.4.2-x64.AppImage",
    manual:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.4.2/audacity-manual-3.4.2.zip",
  },
  {
    version: "3.4.1",
    date: "2023-11-08",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.4.1",
    win: "https://github.com/audacity/audacity/releases/download/Audacity-3.4.1/audacity-win-3.4.1-64bit.exe",
    mac: "https://github.com/audacity/audacity/releases/download/Audacity-3.4.1/audacity-macOS-3.4.1-universal.dmg",
    linux:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.4.1/audacity-linux-3.4.1-x64.AppImage",
    manual:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.4.1/audacity-manual-3.4.1.zip",
  },
  {
    version: "3.4.0",
    date: "2023-11-02",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.4.0",
    win: "https://github.com/audacity/audacity/releases/download/Audacity-3.4.0/audacity-win-3.4.0-64bit.exe",
    mac: "https://github.com/audacity/audacity/releases/download/Audacity-3.4.0/audacity-macOS-3.4.0-universal.dmg",
    linux:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.4.0/audacity-linux-3.4.0-x64.AppImage",
    manual:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.4.0/audacity-manual-3.4.0.zip",
  },
  {
    version: "3.3.3",
    date: "2023-06-08",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.3.3",
    win: "https://github.com/audacity/audacity/releases/download/Audacity-3.3.3/audacity-win-3.3.3-x32.exe",
    mac: "https://github.com/audacity/audacity/releases/download/Audacity-3.3.3/audacity-macOS-3.3.3-universal.dmg",
    linux:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.3.3/audacity-linux-3.3.3-x64.AppImage",
    manual:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.3.3/audacity-manual-3.3.3.tar.gz",
  },
  {
    version: "3.3.2",
    date: "2023-05-05",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.3.2",
    win: "https://github.com/audacity/audacity/releases/download/Audacity-3.3.2/audacity-win-3.3.2-x32.exe",
    mac: "https://github.com/audacity/audacity/releases/download/Audacity-3.3.2/audacity-macOS-3.3.2-universal.dmg",
    linux:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.3.2/audacity-linux-3.3.2-x64.AppImage",
    manual:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.3.2/audacity-manual-v3.3.2.tar.gz",
  },
  {
    version: "3.3.1",
    date: "2023-04-28",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.3.1",
    win: "https://github.com/audacity/audacity/releases/download/Audacity-3.3.1/audacity-win-3.3.1-x32.exe",
    mac: "https://github.com/audacity/audacity/releases/download/Audacity-3.3.1/audacity-macOS-3.3.1-universal.dmg",
    linux:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.3.1/audacity-linux-3.3.1-x64.AppImage",
    manual:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.3.1/audacity-manual-v3.3.1.tar.gz",
  },
  {
    version: "3.3.0",
    date: "2023-04-24",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.3.0",
    win: "https://github.com/audacity/audacity/releases/download/Audacity-3.3.0/audacity-win-3.3.0-x32.exe",
    mac: "https://github.com/audacity/audacity/releases/download/Audacity-3.3.0/audacity-macOS-3.3.0-universal.dmg",
    linux:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.3.0/audacity-linux-3.3.0-x64.AppImage",
    manual:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.3.0/audacity-manual-v3.3.0.tar.gz",
  },
  {
    version: "3.2.5",
    date: "2023-03-01",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.2.5",
    win: "https://github.com/audacity/audacity/releases/download/Audacity-3.2.5/audacity-win-3.2.5-x32.exe",
    mac: "https://github.com/audacity/audacity/releases/download/Audacity-3.2.5/audacity-macOS-3.2.5-universal.dmg",
    linux:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.2.5/audacity-linux-3.2.5-x64.AppImage",
    manual:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.2.5/audacity-manual-3.2.5.tar.gz",
  },
  {
    version: "3.2.4",
    date: "2023-01-27",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.2.4",
    win: "https://github.com/audacity/audacity/releases/download/Audacity-3.2.4/audacity-win-3.2.4-x32.exe",
    mac: "https://github.com/audacity/audacity/releases/download/Audacity-3.2.4/audacity-macOS-3.2.4-universal.dmg",
    linux:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.2.4/audacity-linux-3.2.4-x64.AppImage",
    manual:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.2.4/audacity-manual-3.2.4.tar.gz",
  },
  {
    version: "3.2.3",
    date: "2022-12-27",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.2.3",
    win: "https://github.com/audacity/audacity/releases/download/Audacity-3.2.3/audacity-win-3.2.3-x32.exe",
    mac: "https://github.com/audacity/audacity/releases/download/Audacity-3.2.3/audacity-macOS-3.2.3-universal.dmg",
    linux:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.2.3/audacity-linux-3.2.3-x64.AppImage",
    manual:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.2.3/audacity-manual-3.2.3.tar.gz",
  },
  {
    version: "3.2.2",
    date: "2022-12-06",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.2.2",
    win: "https://github.com/audacity/audacity/releases/download/Audacity-3.2.2/audacity-win-3.2.2-x32.exe",
    mac: "https://github.com/audacity/audacity/releases/download/Audacity-3.2.2/audacity-macOS-3.2.2-arm64.dmg",
    linux:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.2.2/audacity-linux-3.2.2-x64.AppImage",
    manual:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.2.2/audacity-manual-3.2.2.tar.gz",
  },
  {
    version: "3.2.1",
    date: "2022-10-05",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.2.1",
    win: "https://github.com/audacity/audacity/releases/download/Audacity-3.2.1/audacity-win-3.2.1-64bit.exe",
    mac: "https://github.com/audacity/audacity/releases/download/Audacity-3.2.1/audacity-macOS-3.2.1-arm64.dmg",
    linux:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.2.1/audacity-linux-3.2.1-x64.AppImage",
    manual:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.2.1/audacity-manual-3.2.1.tar.gz",
  },
  {
    version: "3.2.0",
    date: "2022-09-22",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.2.0",
    win: "https://github.com/audacity/audacity/releases/download/Audacity-3.2.0/audacity-win-3.2.0-64bit.exe",
    mac: "https://github.com/audacity/audacity/releases/download/Audacity-3.2.0/audacity-macOS-3.2.0-arm64.dmg",
    linux:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.2.0/audacity-linux-3.2.0-x64.AppImage",
    manual:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.2.0/audacity-manual-3.2.0.tar.gz",
  },
  {
    version: "3.1.3",
    date: "2021-12-23",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.1.3",
    win: "https://github.com/audacity/audacity/releases/download/Audacity-3.1.3/audacity-win-3.1.3-64bit.exe",
    mac: "https://github.com/audacity/audacity/releases/download/Audacity-3.1.3/audacity-macos-3.1.3-Intel.dmg",
    linux:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.1.3/audacity-linux-3.1.3-x86_64.AppImage",
    manual:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.1.3/audacity-manual-3.1.3.tar.gz",
  },
  {
    version: "3.1.2",
    date: "2021-11-16",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.1.2",
    win: "https://github.com/audacity/audacity/releases/download/Audacity-3.1.2/audacity-win-3.1.2-64bit.exe",
    mac: "https://github.com/audacity/audacity/releases/download/Audacity-3.1.2/audacity-macos-3.1.2-Intel.dmg",
    linux:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.1.2/audacity-linux-3.1.2-x86_64.AppImage",
    manual:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.1.2/audacity-manual-3.1.2.tar.gz",
  },
  {
    version: "3.1.1",
    date: "2021-11-11",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.1.1",
    win: "https://github.com/audacity/audacity/releases/download/Audacity-3.1.1/audacity-win-3.1.1-64bit.exe",
    mac: "https://github.com/audacity/audacity/releases/download/Audacity-3.1.1/audacity-macos-3.1.1-Intel.dmg",
    linux:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.1.1/audacity-linux-3.1.1-x86_64.AppImage",
    manual:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.1.1/audacity-manual-3.1.1.tar.gz",
  },
  {
    version: "3.1.0",
    date: "2021-10-28",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.1.0",
    win: "https://github.com/audacity/audacity/releases/download/Audacity-3.1.0/audacity-win-3.1.0-64bit.exe",
    mac: "https://github.com/audacity/audacity/releases/download/Audacity-3.1.0/audacity-macos-3.1.0-Intel.dmg",
    linux:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.1.0/audacity-linux-3.1.0-x86_64.AppImage",
    manual:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.1.0/audacity-manual-3.1.0.tar.gz",
  },
  {
    version: "3.0.5",
    date: "2021-09-29",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.0.5",
    win: "https://github.com/audacity/audacity/releases/download/Audacity-3.0.5/audacity-win-3.0.5-64bit.exe",
    mac: "https://github.com/audacity/audacity/releases/download/Audacity-3.0.5/audacity-macos-3.0.5-Intel.dmg",
    linux:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.0.5/audacity-linux-3.0.5-x86_64.AppImage",
    manual:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.0.5/audacity-manual-3.0.5.tar.gz",
  },
  {
    version: "3.0.4",
    date: "2021-08-24",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.0.4",
    win: "https://github.com/audacity/audacity/releases/download/Audacity-3.0.4/audacity-win-3.0.4-x64.exe",
    mac: "https://github.com/audacity/audacity/releases/download/Audacity-3.0.4/audacity-macos-3.0.4-Intel.dmg",
    linux:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.0.4/audacity-linux-3.0.4-x86_64.AppImage",
    manual:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.0.4/audacity-manual-3.0.4.zip",
  },
  {
    version: "3.0.3",
    date: "2021-07-26",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.0.3",
    win: "https://github.com/audacity/audacity/releases/download/Audacity-3.0.3/audacity-win-3.0.3-64bit.exe",
    mac: "https://github.com/audacity/audacity/releases/download/Audacity-3.0.3/audacity-macos-3.0.3-Intel.dmg",
    linux:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.0.3/audacity-linux-3.0.3-x86_64.AppImage",
    manual:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.0.3/audacity-manual-3.0.3.zip",
  },
  {
    version: "3.0.2",
    date: "2021-04-19",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.0.2",
    win: "https://github.com/audacity/audacity/releases/download/Audacity-3.0.2/audacity-win-3.0.2.exe",
    mac: "https://github.com/audacity/audacity/releases/download/Audacity-3.0.2/audacity-macos-3.0.2.dmg",
    linux: null,
    manual:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.0.2/audacity-manual-3.0.2.zip",
  },
  {
    version: "3.0.0",
    date: "2021-03-17",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.0.0",
    win: "https://github.com/audacity/audacity/releases/download/Audacity-3.0.0/audacity-win-3.0.0.exe",
    mac: "https://github.com/audacity/audacity/releases/download/Audacity-3.0.0/audacity-macos-3.0.0.dmg",
    linux: null,
    manual:
      "https://github.com/audacity/audacity/releases/download/Audacity-3.0.0/audacity-manual-3.0.0.zip",
  },
];

/** Versions predating the GitHub release assets. */
export const PRE_GITHUB_OLDEST = "2.1.1";
export const PRE_GITHUB_NEWEST = "2.4.2";
