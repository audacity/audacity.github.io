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
  version: "3.7.3",
  win: [
    {
      name: "64 bit installer",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.3/audacity-win-3.7.3-64bit.exe",
      checksum:
        "82abda13ca234b9c11361501a4cb2191a2c10cb28c181e42952b3ff0d8f6d41a",
      type: ".exe",
    },
    {
      name: "64 bit zip file",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.3/audacity-win-3.7.3-64bit.zip",
      checksum:
        "1d4c91d0bc1b5376f4c8768d48a6e79ab9dcb4600c1162053f61556becb45ce5",
      type: ".zip",
    },
    {
      name: "32 bit installer",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.3/audacity-win-3.7.3-32bit.exe",
      checksum:
        "d0bc10fb9689e6954f5bb9d6006c7f1af37627ed215aab8ed294820a36e00a01",
      type: ".exe",
    },
    {
      name: "32 bit zip file",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.3/audacity-win-3.7.3-32bit.zip",
      checksum:
        "85cf57f6f0e0b12d0b80f39d0cdc2a12a39d54aae6056322318cb376ac544972",
      type: ".zip",
    },
  ],
  mac: [
    {
      name: "Universal dmg",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.3/audacity-macOS-3.7.3-universal.dmg",
      checksum:
        "da789bcac206f9298728c7d13565e0a878e6fa3e8486713fed787548c3d19d14",
      type: ".dmg",
    },
    {
      name: "Universal pkg",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.3/audacity-macOS-3.7.3-universal.pkg ",
      checksum:
        "246f3a1a9e30481d3aae6dc221bacc212ce017b2a2cf8594e90e693956296d2d",
      type: ".pkg",
    },
    {
      name: "ARM 64 dmg (Apple Silicon)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.3/audacity-macOS-3.7.3-arm64.dmg",
      checksum:
        "9f763cf59fff9817da8f273f1fb28d3d8680eaf0444abcc70b84d8c5476d8bcd",
      type: ".dmg",
    },
    {
      name: "x86_64 dmg (Intel)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.3/audacity-macOS-3.7.3-x86_64.dmg",
      checksum:
        "4f3472d2314f902892c68d74cb23a416a9027232aa54bbdd3017a081590ee0e3",
      type: ".dmg",
    },
  ],
  lin: [
    {
      name: "AppImage (Ubuntu 20.04)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.3/audacity-linux-3.7.3-x64-20.04.AppImage",
      checksum:
        "12058dbb10998312a78ca7c3d48bd173743493683340ae40d5fa3c84dbda67fc",
      type: ".AppImage",
    },
        {
      name: "AppImage (Ubuntu 22.04)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.3/audacity-linux-3.7.3-x64-22.04.AppImage",
      checksum:
        "4e7600c3d9f09dca52c7171cc0bfe76abb168436143cd02ecfa3052ab9f7aaa1",
      type: ".AppImage",
    },
  ],
  src: [
    {
      name: "Source code",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.3/audacity-sources-3.7.3.tar.gz",
      checksum:
        "5dbe4f494f9fa51e47bfe6dc2c3bf62e1eaedbf087bad79cce51e461c1db3e92",
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

export type MuseHubReleaseInfo = Pick<ReleaseInfo, "name" | "browser_download_url" | "type">;

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

type OpenVinoReleaseInfo = Pick<ReleaseInfo, "name" | "browser_download_url" | "type">;

type OpenvinoReleaseDirectory = {
  version: string;
  revision: string;
  win: OpenVinoReleaseInfo[];
  macBeta: OpenVinoReleaseInfo[];
};

export const openvinoReleases: OpenvinoReleaseDirectory = {
  version: "3.7.3",
  revision: "R4.2",
  win: [
    {
      name: "OpenVino AI Plugins",
      browser_download_url: "https://github.com/intel/openvino-plugins-ai-audacity/releases/download/v3.7.1-R4.2/audacity-win-v3.7.1-R4.2-64bit-OpenVINO-AI-Plugins.exe",
      type: ".exe"
    },
  ],
  macBeta: [
    {
      name: "OpenVino AI Plugins",
      browser_download_url: "",
      type: ".pkg"
    },
  ],
}
