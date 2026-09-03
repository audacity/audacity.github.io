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
  version: "4.0.0",
  win: [
    {
      name: "x86_64 MSI installer",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-4.0.0/audacity-win-4.0.0-x86_64.msi",
      checksum:
        "2aecc44d28a004d15ae7c23c099f232ba8c5b3e6b19ebdbaf7d6c596316dc5b3",
      type: ".msi",
    },
    {
      name: "ARM64 MSI installer",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-4.0.0/audacity-win-4.0.0-arm64.msi",
      checksum:
        "a5b222a9cf8f03cccef57c912428427eb9387f0e88fa590d9c2b1d83794b222c",
      type: ".msi",
    },
  ],
  mac: [
    {
      name: "Universal DMG",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-4.0.0/audacity-macOS-4.0.0-universal.dmg",
      checksum:
        "03bdb378bc333695af8cba1ff0b91775cf17961a6f23a34edc6a94e3ca7c85ab",
      type: ".dmg",
    },
    {
      name: "ARM64 DMG (Apple Silicon)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-4.0.0/audacity-macOS-4.0.0-arm64.dmg",
      checksum:
        "266201f3151b09e46a5ab8e0ce1a16cefdd53a66fc7c979e943b2c88d6500c51",
      type: ".dmg",
    },
    {
      name: "x86_64 DMG (Intel)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-4.0.0/audacity-macOS-4.0.0-x86_64.dmg",
      checksum:
        "4a5edd087bd5078aa2cd4e93c085a1172c9d791533c96b416a36bd82838a868b",
      type: ".dmg",
    },
  ],
  lin: [
    {
      name: "x86_64 AppImage",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-4.0.0/audacity-linux-4.0.0-x86_64.AppImage",
      checksum:
        "772663b0b407be44232193b8402cde4da4665c7f6e81edb5b70e3b14e8b9b5b4",
      type: ".AppImage",
    },
    {
      name: "ARM64 AppImage",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-4.0.0/audacity-linux-4.0.0-aarch64.AppImage",
      checksum:
        "e5def4e76febc4ab2dea7525a43aa62ddfa092434d164c1ea039687889a6104d",
      type: ".AppImage",
    },
  ],
  src: [
    {
      name: "Source code",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-4.0.0/audacity-sources-4.0.0.tar.xz",
      checksum:
        "b29076f99fa5d2f522d001db472a896db81f9effefd15948c940571753858058",
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
