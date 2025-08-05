export type ReleaseInfo = {
  name: string;
  browser_download_url: string;
  checksum: string;
  type: string;
};

type ReleaseDirectory = {
  version: string;
  win: ReleaseInfo[];
  mac: ReleaseInfo[];
  lin: ReleaseInfo[];
  src: ReleaseInfo[];
};

export const audacityReleases: ReleaseDirectory = {
  version: "3.7.5",
  win: [
    {
      name: "64 bit installer",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.5/audacity-win-3.7.5-64bit.exe",
      checksum:
        "dc93003f1f84f327026e31a49829a3e2ca3beb0b24dbe0ec19adf2074fd6be5d",
      type: ".exe",
    },
    {
      name: "64 bit zip file",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.5/audacity-win-3.7.5-64bit.zip",
      checksum:
        "1a380f477511dc7102285198312743329409772adcfbbbebd7517ca9387ceedb",
      type: ".zip",
    },
    {
      name: "32 bit installer",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.5/audacity-win-3.7.5-32bit.exe",
      checksum:
        "0776fb98623577af04faa382ff59d30bdfacb36449352cf3f42578837abe9b57",
      type: ".exe",
    },
    {
      name: "32 bit zip file",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.5/audacity-win-3.7.5-32bit.zip",
      checksum:
        "61115f29c3ccf8b348eeac6b26f251186f51e4b005ac810a7fe6d85458b75914",
      type: ".zip",
    },
    {
      name: "ARM64 installer (BETA)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.5/audacity-win-3.7.5-arm64.exe",
      checksum:
        "5a9e7e925283971a6fa76871c296524ffb34055b033b8af2538450b6fdce5556",
      type: ".exe",
    },
    {
      name: "ARM64 zip file (BETA)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.5/audacity-win-3.7.5-arm64.zip",
      checksum:
        "99dd7b5b6c1229741ff43a3d651597816b87045a47b1bd8c0d23fa18fc6bd4f0",
      type: ".zip",
    },
  ],
  mac: [
    {
      name: "Universal dmg",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.5/audacity-macOS-3.7.5-universal.dmg",
      checksum:
        "7378053a4ef44962031e524ccd7d44d36d0a6e84b27ac980b6faf039a0c78ab0",
      type: ".dmg",
    },
    {
      name: "Universal pkg",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.5/audacity-macOS-3.7.5-universal.pkg",
      checksum:
        "77bc2775d79cf70d61085731892f1033b1fa539641a80ba9cb4fcd342581445b",
      type: ".pkg",
    },
    {
      name: "ARM 64 dmg (Apple Silicon)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.5/audacity-macOS-3.7.5-arm64.dmg",
      checksum:
        "faa9cb53bd2515447b5e4f71d1220e258f484489cd8db4939b8ffbc255c9c0b3",
      type: ".dmg",
    },
    {
      name: "x86_64 dmg (Intel)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.5/audacity-macOS-3.7.5-x86_64.dmg",
      checksum:
        "e910e80f2e395f77a81d94ea8b2592ac018605dc15d480cc4ddb7c1adb3dea70",
      type: ".dmg",
    },
  ],
  lin: [
    {
      name: "AppImage (Ubuntu 20.04)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.5/audacity-linux-3.7.5-x64-20.04.AppImage",
      checksum:
        "c241491794bc8b6b0d53bcce32e476fc65ccdf51b4423e5eec3a77347c34433f",
      type: ".AppImage",
    },
    {
      name: "AppImage (Ubuntu 22.04)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.5/audacity-linux-3.7.5-x64-22.04.AppImage",
      checksum:
        "d7c4949673d60b5566a215aaffa0ed6b37993fc7c4a67fd51334f1edac18b8f4",
      type: ".AppImage",
    },
  ],
  src: [
    {
      name: "Source code",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.5/audacity-sources-3.7.5.tar.gz",
      checksum:
        "b33ad9f8b53e8ddf3ee0a6ba920ce9a2fd47915e329388729900ec6c0c49567f",
      type: ".tar.gz",
    },
  ],
};

export const betaReleases: ReleaseDirectory = {
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
        "415342de27b572bd3800f51bd77e850a21701b39e2392c2c347ea8db4da4f122",
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
};

export type MuseHubReleaseInfo = Pick<
  ReleaseInfo,
  "name" | "browser_download_url" | "type"
>;

type MuseHubReleaseDirectory = {
  win: MuseHubReleaseInfo[];
  mac: MuseHubReleaseInfo[];
};

export const museHubReleases: MuseHubReleaseDirectory = {
  win: [
    {
      name: "Muse Hub installer",
      browser_download_url:
        "https://muse-cdn.com/Audacity_Installer_via_MuseHub.exe",
      type: ".exe",
    },
  ],
  mac: [
    {
      name: "Muse Hub installer",
      browser_download_url:
        "https://muse-cdn.com/Audacity_Installer_via_MuseHub.dmg",
      type: ".dmg",
    },
  ],
};

type OpenVinoReleaseInfo = Pick<
  ReleaseInfo,
  "name" | "browser_download_url" | "type"
>;

type OpenvinoReleaseDirectory = {
  version: string;
  revision: string;
  win: OpenVinoReleaseInfo[];
  mac: OpenVinoReleaseInfo[];
};

export const openvinoReleases: OpenvinoReleaseDirectory = {
  version: "3.7.4",
  revision: "R4.2",
  win: [
    {
      name: "OpenVino AI Plugins",
      browser_download_url:
        "https://github.com/intel/openvino-plugins-ai-audacity/releases/download/v3.7.1-R4.2/audacity-win-v3.7.1-R4.2-64bit-OpenVINO-AI-Plugins.exe",
      type: ".exe",
    },
  ],
  mac: [
    {
      name: "OpenVino AI Plugins – Universal Binary (large)",
      browser_download_url: "https://github.com/audacity/mod-openvino-macos/releases/download/v3.7.1-R4.2-beta-3/Audacity-OpenVINO-3.7.1-R4.2.pkg",
      type: ".pkg",
    },
        {
      name: "OpenVino AI Plugins – Intel (x64)",
      browser_download_url: "https://github.com/audacity/mod-openvino-macos/releases/download/v3.7.1-R4.2-beta-3/Audacity-OpenVINO-3.7.1-R4.2-x86_64.pkg",
      type: ".pkg",
    },
        {
      name: "OpenVino AI Plugins – Apple Silicon (ARM64)",
      browser_download_url: "https://github.com/audacity/mod-openvino-macos/releases/download/v3.7.1-R4.2-beta-3/Audacity-OpenVINO-3.7.1-R4.2-arm64.pkg",
      type: ".pkg",
    },
  ],
};
