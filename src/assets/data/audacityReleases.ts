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
  version: "3.7.6",
  win: [
    {
      name: "64 bit installer",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.6/audacity-win-3.7.6-64bit.exe",
      checksum:
        "8f88e52fe75e67e4cf74446e5dbb3b0db00f2e6894df819a180afe56e8f57b04",
      type: ".exe",
    },
    {
      name: "64 bit zip file",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.6/audacity-win-3.7.6-64bit.zip",
      checksum:
        "7f7f8f4248da9277ae80008875f22df0fec86f93984541c17c1d685f98c67ebd",
      type: ".zip",
    },
    {
      name: "32 bit installer",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.6/audacity-win-3.7.6-32bit.exe",
      checksum:
        "6f2ce96fb2ad7531155b9873dec53a909f189d55ad913a1e8800863fff628f88",
      type: ".exe",
    },
    {
      name: "32 bit zip file",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.6/audacity-win-3.7.6-32bit.zip",
      checksum:
        "6416c3e9fa370e4beef3314f674e128b2f826bdfffe4233370cb8764249d5608",
      type: ".zip",
    },
    {
      name: "ARM64 installer (BETA)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.6/audacity-win-3.7.6-arm64.exe",
      checksum:
        "14b2f48ad1713695425c1684933004444947e15835d353b79007d60135d59ed1",
      type: ".exe",
    },
    {
      name: "ARM64 zip file (BETA)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.6/audacity-win-3.7.6-arm64.zip",
      checksum:
        "b4f8b736d386c1055efac368e7ec8dc289ff901ddfbc0c889d6488234b3ca04b",
      type: ".zip",
    },
  ],
  mac: [
    {
      name: "Universal dmg",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.6/audacity-macOS-3.7.6-universal.dmg",
      checksum:
        "5e14508ca00b07fa69bfb4670185bcb2ae003448f0737bbec11c003aff030c52",
      type: ".dmg",
    },
    {
      name: "Universal pkg",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.6/audacity-macOS-3.7.6-universal.pkg",
      checksum:
        "89e7c9dac7da4a9d223cc9e1aded74d8bc1e44cae96d246d251db882b4a6e1b5",
      type: ".pkg",
    },
    {
      name: "ARM 64 dmg (Apple Silicon)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.6/audacity-macOS-3.7.6-arm64.dmg",
      checksum:
        "9a9db7b3748446d6cbc9d41596819bbc82f4ef884a7f8b66c727f72e0581f9ac",
      type: ".dmg",
    },
    {
      name: "x86_64 dmg (Intel)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.6/audacity-macOS-3.7.6-x86_64.dmg",
      checksum:
        "5bbf022f94bf4ab30933acfb0113c4299b8050bfd0cc4117f6112615fdd6d717",
      type: ".dmg",
    },
  ],
  lin: [
    {
      name: "AppImage (Ubuntu 20.04)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.6/audacity-linux-3.7.6-x64-20.04.AppImage",
      checksum:
        "6a48e0c155cd729b7db5f3e4d2225a5429e2c6a2ab816c10dd2481e809b9704a",
      type: ".AppImage",
    },
    {
      name: "AppImage (Ubuntu 22.04)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.6/audacity-linux-3.7.6-x64-22.04.AppImage",
      checksum:
        "b82b080504d62f7bd2a13a386385dd1bc76a97c32f353a77da41586e0d5f4669",
      type: ".AppImage",
    },
  ],
  src: [
    {
      name: "Source code",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.6/audacity-sources-3.7.6.tar.gz",
      checksum:
        "429c9ea122a335b61898191c82bbbb61c6f6ab4dc345a8e927a9b7951a1843c3",
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
