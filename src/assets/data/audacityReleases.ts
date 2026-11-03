export type ReleaseInfo = {
  name: string;
  browser_download_url: string;
  checksum?: string;
  type: string;
};

export type ReleaseDirectory = {
  version: string;
  win: ReleaseInfo[];
  mac: ReleaseInfo[];
  lin: ReleaseInfo[];
  src?: ReleaseInfo[];
};

export const audacityReleases: ReleaseDirectory = {
  version: "4.0.2",
  win: [
    {
      name: "x86_64 MSI installer",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-4.0.2/audacity-win-4.0.2-x86_64.msi",
      checksum:
        "ff6cad670befee96fee563056965fa5e17bfa8c7ea3aba10c461c18799409e22",
      type: ".msi",
    },
    {
      name: "ARM64 MSI installer",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-4.0.2/audacity-win-4.0.2-arm64.msi",
      checksum:
        "78a11f84f3f28be7dee932f99a2da2f6a8ecb60ac1ee8fe2ff3c85f0f6a5a9d8",
      type: ".msi",
    },
    {
      name: "x86_64 portable archive",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-4.0.2/audacity-win-4.0.2-x86_64.7z",
      checksum:
        "6f375602254672b4f0db959e8b1e6fd46a97462aeab85b7ff21e1e9d9a54c5b3",
      type: ".7z",
    },
    {
      name: "ARM64 portable archive",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-4.0.2/audacity-win-4.0.2-arm64.7z",
      checksum:
        "2408c78a2784216af610afd3cd7ce70c6acc107ab08d2e7a5ab744ff4a4d40ae",
      type: ".7z",
    },
  ],
  mac: [
    {
      name: "Universal DMG",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-4.0.2/audacity-macOS-4.0.2-universal.dmg",
      checksum:
        "73f1090b7dde6ff181c994af50dd927ea118cf9525b129133a2ae82e79a506a3",
      type: ".dmg",
    },
    {
      name: "ARM64 DMG (Apple Silicon)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-4.0.2/audacity-macOS-4.0.2-arm64.dmg",
      checksum:
        "fd462da6204cbf9758b44c7ce1c29d5fe5cab4f31ba308d33c125f1b170401c3",
      type: ".dmg",
    },
    {
      name: "x86_64 DMG (Intel)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-4.0.2/audacity-macOS-4.0.2-x86_64.dmg",
      checksum:
        "4bf24e9f68e4af31dc47a6b1d02a44a74b537bdb88298d3bc14be55fb1fe6e58",
      type: ".dmg",
    },
  ],
  lin: [
    {
      name: "x86_64 AppImage",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-4.0.2/audacity-linux-4.0.2-x86_64.AppImage",
      checksum:
        "a5f8787aa13cdb500a60fc013403b986776876b960cca962bc6e7fff066172f3",
      type: ".AppImage",
    },
    {
      name: "ARM64 AppImage",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-4.0.2/audacity-linux-4.0.2-aarch64.AppImage",
      checksum:
        "88b1e16dd40a5b7d36bec5789b03f66bda34a7b964e19f338951bf6034d9db9c",
      type: ".AppImage",
    },
  ],
  src: [
    {
      name: "Source code",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-4.0.2/audacity-sources-4.0.2.tar.xz",
      checksum:
        "4799c2ce2deabacf2be8d6d6b3c5a5621bcd3aacf7c1c38bd0a3f2598f1034c0",
      type: ".tar.xz",
    },
  ],
};

export const hasDownloadAssets = (downloads?: ReleaseDirectory): boolean => {
  if (!downloads) {
    return false;
  }

  const { win, mac, lin, src } = downloads;

  return Boolean(
    (win && win.length) ||
    (mac && mac.length) ||
    (lin && lin.length) ||
    (src && src.length),
  );
};

export type PreReleaseEntry = {
  id: string;
  label: string;
  isActive: boolean;
  summary: string;
  pageHref: string;
  downloads: ReleaseDirectory;
};

export const alphaPreRelease: PreReleaseEntry = {
  id: "alpha",
  label: "Alpha",
  isActive: false,
  summary: "Get an early look at the next major release.",
  pageHref: "/next",
  downloads: {
    version: "Audacity 4 Beta",
    win: [],
    mac: [],
    lin: [],
    src: [],
  },
};

export const betaPreRelease: PreReleaseEntry = {
  id: "beta",
  label: "Beta",
  /*
    Off: this branch doesn't promote pre-release builds. Every consumer already
    gates on isActive — the /download campaign block, the footer link and /next
    all fall back on their own, and /next has a written empty state — so this is
    the whole switch.

    The Beta 2 asset URLs below are left in place deliberately. They're the only
    record of where those builds live, and promoting the next pre-release should
    be flipping this flag and updating the URLs, not rebuilding the entry.
  */
  isActive: false,
  summary: "Audacity 4 is entering public beta — try it ahead of release.",
  pageHref: "/next",
  downloads: {
    version: "Audacity 4 Beta 2",
    win: [
      {
        name: "64 bit msi installer",
        browser_download_url:
          "https://github.com/audacity/audacity/releases/download/Audacity-4.0.0-beta-2/Audacity-4.0.0-beta2-x86_64.msi",
        type: ".msi",
      },
    ],
    mac: [
      {
        name: "DMG (Universal Binary)",
        browser_download_url:
          "https://github.com/audacity/audacity/releases/download/Audacity-4.0.0-beta-2/Audacity-4.0.0-beta2-universal.dmg",
        type: ".dmg",
      },
    ],
    lin: [
      {
        name: "AppImage",
        browser_download_url:
          "https://github.com/audacity/audacity/releases/download/Audacity-4.0.0-beta-2/Audacity-4.0.0-beta2-x86_64.AppImage",
        type: ".AppImage",
      },
    ],
    src: [],
  },
};

export const preReleaseList: PreReleaseEntry[] = [
  alphaPreRelease,
  betaPreRelease,
];
