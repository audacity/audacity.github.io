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
  version: "3.7.9",
  win: [
    {
      name: "64 bit installer",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.9/audacity-win-3.7.9-64bit.exe",
      checksum:
        "e3096847ac4270d304e9b112d153642a72b66b42e13f83a32f06eecfb4ce7e48",
      type: ".exe",
    },
    {
      name: "64 bit zip file",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.9/audacity-win-3.7.9-64bit.zip",
      checksum:
        "6ace99628c02ae345690183950bf76ee7aeacdaa1a3693e98a6f971642cd2da7",
      type: ".zip",
    },
    {
      name: "32 bit installer",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.9/audacity-win-3.7.9-32bit.exe",
      checksum:
        "ed3c6881bfc002ea7d3099f61332865d146ac58521947c2db892fd9a0d5ec1c8",
      type: ".exe",
    },
    {
      name: "32 bit zip file",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.9/audacity-win-3.7.9-32bit.zip",
      checksum:
        "77fde2501e51c5e9b82bd2d5f4abca8320b91fa755acc8fdfe5f88b34e0b759d",
      type: ".zip",
    },
    {
      name: "ARM64 installer (BETA)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.9/audacity-win-3.7.9-arm64.exe",
      checksum:
        "4ad29783d9d6c3a47fb48f4fcf19378203255e883c60c905cd7d03c5a76ad710",
      type: ".exe",
    },
    {
      name: "ARM64 zip file (BETA)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.9/audacity-win-3.7.9-arm64.zip",
      checksum:
        "c15771014710a03ca8d6a9e1a1cff4e20bba17fd0359471c091861189c66ba95",
      type: ".zip",
    },
  ],
  mac: [
    {
      name: "Universal dmg",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.9/audacity-macOS-3.7.9-universal.dmg",
      checksum:
        "5d4fe9125fc79aec3d6d67677407afda42229ae86a37c2a65d99b0df1cd95a24",
      type: ".dmg",
    },
    {
      name: "ARM 64 dmg (Apple Silicon)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.9/audacity-macOS-3.7.9-arm64.dmg",
      checksum:
        "fafeb7fa963d3e2ba05ee7aba5290c966362ac5f5feca86eb8b1f61c7819d499",
      type: ".dmg",
    },
    {
      name: "x86_64 dmg (Intel)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.9/audacity-macOS-3.7.9-x86_64.dmg",
      checksum:
        "142f3900bea5d49a73e66cce06e156b8e5387643e1b718806e85286753d6294f",
      type: ".dmg",
    },
  ],
  lin: [
    {
      name: "AppImage (Ubuntu 20.04)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.9/audacity-linux-3.7.9-x64-20.04.AppImage",
      checksum:
        "137a222e6a9730ceb2dd9a61b3abea4a511ad47b1cf6c1e72426ee671c75f655",
      type: ".AppImage",
    },
    {
      name: "AppImage (Ubuntu 22.04)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.9/audacity-linux-3.7.9-x64-22.04.AppImage",
      checksum:
        "e03f51163e370277039c2f2f665376a86b56aa51c9056aba00f8712d889ed654",
      type: ".AppImage",
    },
  ],
  src: [
    {
      name: "Source code",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.9/audacity-sources-3.7.9.tar.gz",
      checksum:
        "9d224ebe4d5c4e38e3a2142ef6d36198d5c40db0e32329d7fbc547cce7422682",
      type: ".tar.gz",
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
