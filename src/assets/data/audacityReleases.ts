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
  version: "4.0.1",
  win: [
    {
      name: "x86_64 MSI installer",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-4.0.1/audacity-win-4.0.1-x86_64.msi",
      checksum:
        "efb652bf04168f5d4893f28b7cefaaf5ef385d9251544540ac774e3bf54793a3",
      type: ".msi",
    },
    {
      name: "ARM64 MSI installer",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-4.0.1/audacity-win-4.0.1-arm64.msi",
      checksum:
        "b6606d9bcb1a49254f1966c7edc68d78f7eadd04eebe7d4676350f32ca675f49",
      type: ".msi",
    },
    {
      name: "x86_64 portable archive",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-4.0.1/audacity-win-4.0.1-x86_64.7z",
      checksum:
        "9c5e0379626dee8a573af91ba5355311b9001dcf310294dd4dc9aa6887593d03",
      type: ".7z",
    },
    {
      name: "ARM64 portable archive",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-4.0.1/audacity-win-4.0.1-arm64.7z",
      checksum:
        "bafa562f9fc3960eae50ac64b656360b5bd2824af3396ed0809551a1f8eb716e",
      type: ".7z",
    },
  ],
  mac: [
    {
      name: "Universal DMG",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-4.0.1/audacity-macOS-4.0.1-universal.dmg",
      checksum:
        "473db7ce0d846d2d45df97e8e83ff4c70fc835eff6bcc9e119d8eac34f979794",
      type: ".dmg",
    },
    {
      name: "ARM64 DMG (Apple Silicon)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-4.0.1/audacity-macOS-4.0.1-arm64.dmg",
      checksum:
        "278c8647b78c77af7f07dbd5e7d9bfc950bc14168047b65738716b61d12055ec",
      type: ".dmg",
    },
    {
      name: "x86_64 DMG (Intel)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-4.0.1/audacity-macOS-4.0.1-x86_64.dmg",
      checksum:
        "9794b0b3a3a795bdc097b411a5776ba59dc451cb1524f58c9714c30cca2564be",
      type: ".dmg",
    },
  ],
  lin: [
    {
      name: "x86_64 AppImage",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-4.0.1/audacity-linux-4.0.1-x86_64.AppImage",
      checksum:
        "ca2f04f172124d1f18ac608749854c5d31f04ab266a758c348190c05d9b2087c",
      type: ".AppImage",
    },
    {
      name: "ARM64 AppImage",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-4.0.1/audacity-linux-4.0.1-aarch64.AppImage",
      checksum:
        "3abc517f26f00197eaac9c4e56b35dc53d8e933764b41077950e8526cd4aa075",
      type: ".AppImage",
    },
  ],
  src: [
    {
      name: "Source code",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-4.0.1/audacity-sources-4.0.1.tar.xz",
      checksum:
        "6cf1230a1aa940a9188476737d342100c5de6480a476f253fc844bd031d7e6f4",
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
