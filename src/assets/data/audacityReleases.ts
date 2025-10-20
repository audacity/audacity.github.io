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
  version: "3.7.5",
  win: [
    {
      name: "64 bit installer",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.5/audacity-win-3.7.5-64bit.exe",
      checksum:
        "d618903c6368785e35a0d6933a741f7efb75d869ca0897cb690d323c720d27c9",
      type: ".exe",
    },
    {
      name: "64 bit zip file",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.5/audacity-win-3.7.5-64bit.zip",
      checksum:
        "0bc382a89cd44ee2df80f9b725fa22a697163572a8aa04899ee8544dc2932926",
      type: ".zip",
    },
    {
      name: "32 bit installer",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.5/audacity-win-3.7.5-32bit.exe",
      checksum:
        "ee0bcad98c38084510858bf6eea3315986096af850c1d0b1edd951879c3185d3",
      type: ".exe",
    },
    {
      name: "32 bit zip file",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.5/audacity-win-3.7.5-32bit.zip",
      checksum:
        "c80c0767cbb4b74eabf0c206a2c9c4ab9c6996a3fcf14713f542c8660882893f",
      type: ".zip",
    },
    {
      name: "ARM64 installer (BETA)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.5/audacity-win-3.7.5-arm64.exe",
      checksum:
        "604216c823de66ddcf2629f80aba050e9d7bead3df7d8d7e32750e0a3fef42fe",
      type: ".exe",
    },
    {
      name: "ARM64 zip file (BETA)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.5/audacity-win-3.7.5-arm64.zip",
      checksum:
        "996c68cdc97ca85f84777b557b3991a5dfa49727bad4086dba474b1525abfbc9",
      type: ".zip",
    },
  ],
  mac: [
    {
      name: "Universal dmg",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.5/audacity-macOS-3.7.5-universal.dmg",
      checksum:
        "5e14508ca00b07fa69bfb4670185bcb2ae003448f0737bbec11c003aff030c52",
      type: ".dmg",
    },
    {
      name: "Universal pkg",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.5/audacity-macOS-3.7.5-universal.pkg",
      checksum:
        "d108d6e55501a7395394dc035530511a13394c91097cacc656a0a2509284ea1f",
      type: ".pkg",
    },
    {
      name: "ARM 64 dmg (Apple Silicon)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.5/audacity-macOS-3.7.5-arm64.dmg",
      checksum:
        "20beb5515153a0df8cb02c270a39a90efbfaaa5f2d21fe1db06c7b0d987ea653",
      type: ".dmg",
    },
    {
      name: "x86_64 dmg (Intel)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.5/audacity-macOS-3.7.5-x86_64.dmg",
      checksum:
        "d9ba4c5b61030151953bfd0c0611fbb340208d3a3f149a9a6c297155e1f57289",
      type: ".dmg",
    },
  ],
  lin: [
    {
      name: "AppImage (Ubuntu 20.04)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.5/audacity-linux-3.7.5-x64-20.04.AppImage",
      checksum:
        "30c92ff76d05fcf4fbd73a778dd7864e7e60641c9c92d139e2f8a5e95021dd8b",
      type: ".AppImage",
    },
    {
      name: "AppImage (Ubuntu 22.04)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.5/audacity-linux-3.7.5-x64-22.04.AppImage",
      checksum:
        "aa092571e6447b3e82d8cf6b9e31ee4907581e4925b791f49c8563e1cfa93716",
      type: ".AppImage",
    },
  ],
  src: [
    {
      name: "Source code",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.5/audacity-sources-3.7.5.tar.gz",
      checksum:
        "f59e05a05a41c6d895b8d65d9afd90b0e2b453046ea4ac0be11981dca4a44c07",
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
  isActive: false,
  summary:
    "Get an early look at the next major release. Expect unfinished features and potential bugs.",
  pageHref: "/next",
  downloads: {
    version: "Audacity 4 Alpha 1",
    win: [
      {
        name: "64 bit",
        browser_download_url:
          "https://github.com/audacity/audacity/actions/runs/18406361889/artifacts/4237171895",
        type: ".zip",
      },
    ],
    mac: [
      {
        name: "ARM 64 zip (Apple Silicon)",
        browser_download_url:
          "https://github.com/audacity/audacity/actions/runs/18406354692/artifacts/4237536953",
        type: ".zip",
      },
    ],
    lin: [
      {
        name: "AppImage",
        browser_download_url:
          "https://github.com/audacity/audacity/actions/runs/18406368664/artifacts/4237050905",
        type: ".zip",
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