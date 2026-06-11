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
  version: "3.7.8",
  win: [
    {
      name: "64 bit installer",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.8/audacity-win-3.7.8-64bit.exe",
      checksum:
        "4a6d77f023c0209a396fcf2f3c7c04e240b6ba9897b3231a6ed18e14c10caa16",
      type: ".exe",
    },
    {
      name: "64 bit zip file",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.8/audacity-win-3.7.8-64bit.zip",
      checksum:
        "900620f6e9bb6a9f6d1c0a1a10b58eaf480c0c8a4bfce134f89e80eddc83979f",
      type: ".zip",
    },
    {
      name: "32 bit installer",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.8/audacity-win-3.7.8-32bit.exe",
      checksum:
        "c0482d84a05ddd26905d010daff32b79eba18673489d2cb90ee87a386d24c74f",
      type: ".exe",
    },
    {
      name: "32 bit zip file",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.8/audacity-win-3.7.8-32bit.zip",
      checksum:
        "83bca05b912126c7b2a8f92721e8feccc4ac222301c6993eba612804a7ecfe06",
      type: ".zip",
    },
    {
      name: "ARM64 installer (BETA)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.8/audacity-win-3.7.8-arm64.exe",
      checksum:
        "108bbf08c7536747d01e76f68c9f116b49ca2e9b97d14e7d18fc657837f1fb20",
      type: ".exe",
    },
    {
      name: "ARM64 zip file (BETA)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.8/audacity-win-3.7.8-arm64.zip",
      checksum:
        "dac3b5a0009e98956a153742d01bd1b680720bdbaa4c50d41d2a68fd85a1ec34",
      type: ".zip",
    },
  ],
  mac: [
    {
      name: "Universal dmg",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.8/audacity-macOS-3.7.8-universal.dmg",
      checksum:
        "09099365c3d5a8b83b055ec04ed3468ccfd6a53d162bf0b32130ff3620cbfac6",
      type: ".dmg",
    },
    {
      name: "ARM 64 dmg (Apple Silicon)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.8/audacity-macOS-3.7.8-arm64.dmg",
      checksum:
        "2888d2bef5321990d3a11507f9b5cf9461831725a50f391fffd558f7404ffcf8",
      type: ".dmg",
    },
    {
      name: "x86_64 dmg (Intel)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.8/audacity-macOS-3.7.8-x86_64.dmg",
      checksum:
        "6d79d5ec2c1bbb69421b3c2c8ff5f34b34be96997e4cdb6e0fde12948b9fc173",
      type: ".dmg",
    },
  ],
  lin: [
    {
      name: "AppImage (Ubuntu 20.04)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.8/audacity-linux-3.7.8-x64-20.04.AppImage",
      checksum:
        "41519f65850be69c45fbbfbe4593abcc5182d6fb9312e5b59b8022fec36dd26a",
      type: ".AppImage",
    },
    {
      name: "AppImage (Ubuntu 22.04)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.8/audacity-linux-3.7.8-x64-22.04.AppImage",
      checksum:
        "7ffe002a759ae9c99da1ee443364ae1fef3e179db69c4a0e47b13a0827a9168b",
      type: ".AppImage",
    },
  ],
  src: [
    {
      name: "Source code",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.8/audacity-sources-3.7.8.tar.gz",
      checksum:
        "75f2b1d9c7d45faaaf193844d5fee796694deac7bf4932ca520563ab4fb74c27",
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
  isActive: true,
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
