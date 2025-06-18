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
  version: "3.7.4",
  win: [
    {
      name: "64 bit installer",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.4/audacity-win-3.7.4-64bit.exe",
      checksum:
        "b3f16f4ba9c25abfb08d7a93cfcdc7086cf784b20e014ba4ebe68c38f1394f5c",
      type: ".exe",
    },
    {
      name: "64 bit zip file",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.4/audacity-win-3.7.4-64bit.zip",
      checksum:
        "80d1cba8eac4070fd394031c0c54d698e0850682e5cd9d55a3be30ef9ce6f9c6",
      type: ".zip",
    },
    {
      name: "32 bit installer",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.4/audacity-win-3.7.4-32bit.exe",
      checksum:
        "9a7d9246fbcd99b17c32db0f7f12a6687518c9904ee809cfff1b4499cb0be0cd",
      type: ".exe",
    },
    {
      name: "32 bit zip file",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.4/audacity-win-3.7.4-32bit.zip",
      checksum:
        "f328d075b951a8df6560e5fdecad0d65a097541ea2df6209eba44f6baf4b63f0",
      type: ".zip",
    },
  ],
  mac: [
    {
      name: "Universal dmg",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.4/audacity-macOS-3.7.4-universal.dmg",
      checksum:
        "b653b65f06d870b33f22215bddadcb09270c4142aec23a956baa68912eeea8e2",
      type: ".dmg",
    },
    {
      name: "Universal pkg",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.4/audacity-macOS-3.7.4-universal.pkg",
      checksum:
        "14dc5e52ad9786405954b6dcadff1dfbee69fbdbfde7cf19aac6b4926d9fe342",
      type: ".pkg",
    },
    {
      name: "ARM 64 dmg (Apple Silicon)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.4/audacity-macOS-3.7.4-arm64.dmg",
      checksum:
        "63c551cc74e16ff8e788b51aeacda8e866bb21213cf721a9b09a8a3b4e81d046",
      type: ".dmg",
    },
    {
      name: "x86_64 dmg (Intel)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.4/audacity-macOS-3.7.4-x86_64.dmg",
      checksum:
        "11dd95c619dd1cb8e47ee78e0855affc199a669a05439d194c81ed1bfc90b263",
      type: ".dmg",
    },
  ],
  lin: [
    {
      name: "AppImage (Ubuntu 20.04)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.4/audacity-linux-3.7.4-x64-20.04.AppImage",
      checksum:
        "8e5986b4fb07b6a627a5d88da03f60f75c5cbe879b08cccf75804eea9c23dcd6",
      type: ".AppImage",
    },
    {
      name: "AppImage (Ubuntu 22.04)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.4/audacity-linux-3.7.4-x64-22.04.AppImage",
      checksum:
        "378b25113a243e3c1e4207989444174796fbbd9c2e6fa673ed59213a2882a386",
      type: ".AppImage",
    },
  ],
  src: [
    {
      name: "Source code",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.4/audacity-sources-3.7.4.tar.gz",
      checksum:
        "6b2cd01108e9c97c401051909bbe0e34bbc5420a88eb43de1d8deb9715eefed9",
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
      browser_download_url: "https://github.com/audacity/mod-openvino-macos/releases/download/v3.7.1-R4.2-beta-2/Audacity-OpenVINO-3.7.1-R4.2.pkg",
      type: ".pkg",
    },
        {
      name: "OpenVino AI Plugins – Intel (x64)",
      browser_download_url: "https://github.com/audacity/mod-openvino-macos/releases/download/v3.7.1-R4.2-beta-2/Audacity-OpenVINO-3.7.1-R4.2-x86_64.pkg",
      type: ".pkg",
    },
        {
      name: "OpenVino AI Plugins – Apple Silicon (ARM64)",
      browser_download_url: "https://github.com/audacity/mod-openvino-macos/releases/download/v3.7.1-R4.2-beta-2/Audacity-OpenVINO-3.7.1-R4.2-arm64.pkg",
      type: ".pkg",
    },
  ],
};
