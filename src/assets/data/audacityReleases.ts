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
  version: "3.7.7",
  win: [
    {
      name: "64 bit installer",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.7/audacity-win-3.7.7-64bit.exe",
      checksum:
        "a96f41f21efcdfec1d2f7f332544f8a8fb00a6c411e3bee2aa0031b691dd91a7",
      type: ".exe",
    },
    {
      name: "64 bit zip file",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.7/audacity-win-3.7.7-64bit.zip",
      checksum:
        "1d345a48a698c57363475b7b3a0b113f796c2a49c6254d5f41dae53b9f4017d8",
      type: ".zip",
    },
    {
      name: "32 bit installer",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.7/audacity-win-3.7.7-32bit.exe",
      checksum:
        "2248a8c272e5b4b1ad86ab8455555535e63ee87e0ef4261c75e15d14e0dd6eca",
      type: ".exe",
    },
    {
      name: "32 bit zip file",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.7/audacity-win-3.7.7-32bit.zip",
      checksum:
        "df73a2669c09db9b6a85cb9f069fdfe32458974c4187ae77c3c20e88bd2d223b",
      type: ".zip",
    },
    {
      name: "ARM64 installer (BETA)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.7/audacity-win-3.7.7-arm64.exe",
      checksum:
        "d647a3c943deeee6138e9eb2afaf2877147b37c425a922e0aa7a536a792cfac9",
      type: ".exe",
    },
    {
      name: "ARM64 zip file (BETA)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.7/audacity-win-3.7.7-arm64.zip",
      checksum:
        "44681b410f490084bef671ce824798fa18d37be6fe37fe007f6893ca1bc84953",
      type: ".zip",
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
    },
    {
      name: "ARM 64 dmg (Apple Silicon)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.7/audacity-macOS-3.7.7-arm64.dmg",
      checksum:
        "8b3c43a06eef2977bd81fd14f349d93c6295f1760a93fc5bd4dba86c0ec104eb",
      type: ".dmg",
    },
    {
      name: "x86_64 dmg (Intel)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.7/audacity-macOS-3.7.7-x86_64.dmg",
      checksum:
        "8c9bf8bdca75ffb1d6cfe5c28b04869ec1150c65f246983e70d901847e94d4b9",
      type: ".dmg",
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
    },
    {
      name: "AppImage (Ubuntu 22.04)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.7/audacity-linux-3.7.7-x64-22.04.AppImage",
      checksum:
        "45c4445fb6670cc5fe40d31c7cea979724d2605bca53b554c32520acbf901ef0",
      type: ".AppImage",
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
    },
  ],
};

export const hasDownloadAssets = (downloads?: ReleaseDirectory): boolean => {
  if (!downloads) {
    return false;
  }

  const { win, mac, lin, src } = downloads;

  return Boolean(
    (win && win.length)
      || (mac && mac.length)
      || (lin && lin.length)
      || (src && src.length),
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
  isActive: true,
  summary:
    "Get an early look at the next major release.",
  pageHref: "/next",
  downloads: {
    version: "Audacity 4 Alpha 2",
    win: [
      {
        name: "64 bit msi installer",
        browser_download_url: "https://github.com/audacity/audacity/releases/download/Audacity-4.0.0-alpha-2/Audacity-4.0.0.253031630.f3e3e3b.-x86_64.msi",
        type: ".msi",
      },
    ],
    mac: [
      {
        name: "DMG (Universal Binary)",
        browser_download_url: "https://github.com/audacity/audacity/releases/download/Audacity-4.0.0-alpha-2/Audacity-4.0.0.253031629.f3e3e3b.dmg",
        type: ".dmg",
      },
    ],
    lin: [
      {
        name: "AppImage",
        browser_download_url: "https://github.com/audacity/audacity/releases/download/Audacity-4.0.0-alpha-2/Audacity-4.0.0.253031629.f3e3e3b.-x86_64.AppImage",
        type: ".AppImage",
      },
    ],
    src: [],
  },
};

export const betaPreRelease: PreReleaseEntry = {
  id: "beta",
  label: "Beta",
  isActive: false,
  summary: "Help us test upcoming features before they ship.",
  pageHref: "/next",
  downloads: {
    version: "3.5.0 beta",
    win: [
      {
        name: "64 bit installer (recommended)",
        browser_download_url:
          "https://github.com/audacity/audacity/releases/download/Audacity-3.5.0-beta-3/audacity-win-3.5.0-beta-3-64bit.exe",
        checksum:
          "ed7de964ed11cbc8f74e815dbcb2cb8487ba136818cf1a148f16cadd4c10f3d0",
        type: ".exe",
      },
      {
        name: "64 bit zip file",
        browser_download_url:
          "https://github.com/audacity/audacity/releases/download/Audacity-3.5.0-beta-3/audacity-win-3.5.0-beta-3-64bit.zip",
        checksum:
          "52da5c3e2507408d72c4ab425c2e465e3c8ad452b2ac89ddfb3f5bc141d68a03",
        type: ".zip",
      },
      {
        name: "32 bit installer",
        browser_download_url:
          "https://github.com/audacity/audacity/releases/download/Audacity-3.5.0-beta-3/audacity-win-3.5.0-beta-3-32bit.exe",
        checksum:
          "6bb6c0d3513be7d98c400f43d84cd39992065f4c6460d80b6cb1667733ca95c7",
        type: ".exe",
      },
      {
        name: "32 bit zip file",
        browser_download_url:
          "https://github.com/audacity/audacity/releases/download/Audacity-3.5.0-beta-3/audacity-win-3.5.0-beta-3-32bit.zip",
        checksum:
          "c313ca3c475b487bf88a42537cbc9454090391250017fe210226b3ca78797d9a",
        type: ".zip",
      },
    ],
    mac: [
      {
        name: "Universal dmg (recommended)",
        browser_download_url:
          "https://github.com/audacity/audacity/releases/download/Audacity-3.5.0-beta-3/audacity-macOS-3.5.0-beta-3-universal.dmg",
        checksum:
          "9500ede91b837fc12e5106fa33d6603829288b90fb1e28d2d70bfee9db33406e",
        type: ".dmg",
      },
      {
        name: "ARM 64 dmg (Apple Silicon)",
        browser_download_url:
          "https://github.com/audacity/audacity/releases/download/Audacity-3.5.0-beta-3/audacity-macOS-3.5.0-beta-3-arm64.dmg",
        checksum:
          "0f3e9b9ee8e77d8b8613db8d66927e982bbec870e801811060d3d8fbc25c7698",
        type: ".dmg",
      },
      {
        name: "x86_64 dmg (Intel)",
        browser_download_url:
          "https://github.com/audacity/audacity/releases/download/Audacity-3.5.0-beta-3/audacity-macOS-3.5.0-beta-3-x86_64.dmg",
        checksum:
          "415342de27b572bd3801f51bd77e850a21701b39e2392c2c347ea8db4da4f122",
        type: ".dmg",
      },
    ],
    lin: [
      {
        name: "AppImage",
        browser_download_url:
          "https://github.com/audacity/audacity/releases/download/Audacity-3.5.0-beta-3/audacity-linux-3.5.0-beta-3-x64.AppImage",
        checksum:
          "fc5df63e3819f4f59b4366c436579bd1a73b045a4dae28316edf6c23948a06ce",
        type: ".AppImage",
      },
    ],
    src: [
      {
        name: "Source code",
        browser_download_url:
          "https://github.com/audacity/audacity/releases/download/Audacity-3.5.0-beta-3/audacity-sources-3.5.0-beta-3.tar.gz",
        checksum:
          "53c33ed875f4eb1501707d7989a6de253370a368c1c50a877e5cfa96c02bebdc",
        type: ".tar.gz",
      },
    ],
  },
};

export const preReleaseList: PreReleaseEntry[] = [
  alphaPreRelease,
  betaPreRelease,
];
