export type ReleaseInfo = {
  name: string;
  browser_download_url: string;
  checksum?: string;
  type: string;
  /** Size in bytes, read from the release asset itself. */
  sizeBytes?: number;
};

export type ReleaseDirectory = {
  version: string;
  win: ReleaseInfo[];
  mac: ReleaseInfo[];
  lin: ReleaseInfo[];
  src?: ReleaseInfo[];
};

export const audacityReleases: ReleaseDirectory = {
  version: "3.7.7",
  win: [
    {
      name: "64 bit installer",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.7/audacity-win-3.7.7-64bit.exe",
      checksum:
        "a96f41f21efcdfec1d2f7f332544f8a8fb00a6c411e3bee2aa0031b691dd91a7",
      type: ".exe",
      sizeBytes: 18543040,
    },
    {
      name: "64 bit zip file",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.7/audacity-win-3.7.7-64bit.zip",
      checksum:
        "1d345a48a698c57363475b7b3a0b113f796c2a49c6254d5f41dae53b9f4017d8",
      type: ".zip",
      sizeBytes: 27285342,
    },
    {
      name: "32 bit installer",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.7/audacity-win-3.7.7-32bit.exe",
      checksum:
        "2248a8c272e5b4b1ad86ab8455555535e63ee87e0ef4261c75e15d14e0dd6eca",
      type: ".exe",
      sizeBytes: 17042704,
    },
    {
      name: "32 bit zip file",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.7/audacity-win-3.7.7-32bit.zip",
      checksum:
        "df73a2669c09db9b6a85cb9f069fdfe32458974c4187ae77c3c20e88bd2d223b",
      type: ".zip",
      sizeBytes: 25151423,
    },
    {
      name: "ARM64 installer (BETA)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.7/audacity-win-3.7.7-arm64.exe",
      checksum:
        "d647a3c943deeee6138e9eb2afaf2877147b37c425a922e0aa7a536a792cfac9",
      type: ".exe",
      sizeBytes: 18144088,
    },
    {
      name: "ARM64 zip file (BETA)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.7/audacity-win-3.7.7-arm64.zip",
      checksum:
        "44681b410f490084bef671ce824798fa18d37be6fe37fe007f6893ca1bc84953",
      type: ".zip",
      sizeBytes: 26203265,
    },
  ],
  mac: [
    {
      name: "Universal dmg",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.7/audacity-macOS-3.7.7-universal.dmg",
      checksum:
        "7a188eec047e32c25c95eb301854e98cdc2bdb2facb169d5022d967c2ba94d35",
      type: ".dmg",
      sizeBytes: 66894576,
    },
    {
      name: "ARM 64 dmg (Apple Silicon)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.7/audacity-macOS-3.7.7-arm64.dmg",
      checksum:
        "8b3c43a06eef2977bd81fd14f349d93c6295f1760a93fc5bd4dba86c0ec104eb",
      type: ".dmg",
      sizeBytes: 30014299,
    },
    {
      name: "x86_64 dmg (Intel)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.7/audacity-macOS-3.7.7-x86_64.dmg",
      checksum:
        "8c9bf8bdca75ffb1d6cfe5c28b04869ec1150c65f246983e70d901847e94d4b9",
      type: ".dmg",
      sizeBytes: 32274723,
    },
  ],
  lin: [
    {
      name: "AppImage (Ubuntu 20.04)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.7/audacity-linux-3.7.7-x64-20.04.AppImage",
      checksum:
        "5bda8f3c91cf1251307277c218f007eff9250984efcbbee2cd3cab643da4c623",
      type: ".AppImage",
      sizeBytes: 122595832,
    },
    {
      name: "AppImage (Ubuntu 22.04)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.7/audacity-linux-3.7.7-x64-22.04.AppImage",
      checksum:
        "45c4445fb6670cc5fe40d31c7cea979724d2605bca53b554c32520acbf901ef0",
      type: ".AppImage",
      sizeBytes: 111180280,
    },
  ],
  src: [
    {
      name: "Source code",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.7/audacity-sources-3.7.7.tar.gz",
      checksum:
        "1574688e54009b40faeffe5752b5f822ff251e2d4228e8ec60ec0f99f3423cda",
      type: ".tar.gz",
      sizeBytes: 64575292,
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
    version: "Audacity 4 Alpha 2",
    win: [
      {
        name: "64 bit msi installer",
        browser_download_url:
          "https://github.com/audacity/audacity/releases/download/Audacity-4.0.0-alpha-2/Audacity-4.0.0.253031630.f3e3e3b.-x86_64.msi",
        type: ".msi",
        sizeBytes: 48332800,
      },
    ],
    mac: [
      {
        name: "DMG (Universal Binary)",
        browser_download_url:
          "https://github.com/audacity/audacity/releases/download/Audacity-4.0.0-alpha-2/Audacity-4.0.0.253031629.f3e3e3b.dmg",
        type: ".dmg",
        sizeBytes: 103469895,
      },
    ],
    lin: [
      {
        name: "AppImage",
        browser_download_url:
          "https://github.com/audacity/audacity/releases/download/Audacity-4.0.0-alpha-2/Audacity-4.0.0.253031629.f3e3e3b.-x86_64.AppImage",
        type: ".AppImage",
        sizeBytes: 67934712,
      },
    ],
    src: [],
  },
};

export const betaPreRelease: PreReleaseEntry = {
  id: "beta",
  label: "Beta",
  isActive: true,
  summary: "Audacity 4 is entering public beta — try it ahead of release.",
  pageHref: "/next",
  downloads: {
    version: "Audacity 4 Beta",
    win: [],
    mac: [],
    lin: [],
    src: [],
  },
};

export const preReleaseList: PreReleaseEntry[] = [
  alphaPreRelease,
  betaPreRelease,
];
