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
  version: "3.6.4",
  win: [
    {
      name: "64 bit installer",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.6.4/audacity-win-3.6.4-64bit.exe",
      checksum:
        "b11b3a96639d78ed295ca8a426da628dea951a965bfbce170708de5d4a93a75d",
      type: ".exe",
    },
    {
      name: "64 bit zip file",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.6.4/audacity-win-3.6.4-64bit.zip",
      checksum:
        "89bcc815209556f50464e6466b7c5e5c93b1e6c2bc60bdbf3b310b320590f84c",
      type: ".zip",
    },
    {
      name: "32 bit installer",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.6.4/audacity-win-3.6.4-32bit.exe",
      checksum:
        "dcc10df1e55d2db753a2d4e29fb7fad7018352a035fa72ce91b052e8ec317c38",
      type: ".exe",
    },
    {
      name: "32 bit zip file",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.6.4/audacity-win-3.6.4-32bit.zip",
      checksum:
        "8efca7e77788957fb70ad8b1ba88720eed8a24ca2db30640ee9d48ffa1834047",
      type: ".zip",
    },
  ],
  mac: [
    {
      name: "Universal dmg",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.6.4/audacity-macOS-3.6.4-universal.dmg",
      checksum:
        "32018deee267b823c7de289478ef29df9815706e2409e2026d08f9532a656044",
      type: ".dmg",
    },
    {
      name: "ARM 64 dmg (Apple Silicon)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.6.4/audacity-macOS-3.6.4-arm64.dmg",
      checksum:
        "8d1aa3f7529e3e112aaf649385ae7ce7506a05955782f54743d09440cec14bfe",
      type: ".dmg",
    },
    {
      name: "x86_64 dmg (Intel)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.6.4/audacity-macOS-3.6.4-x86_64.dmg",
      checksum:
        "afab4f232c9dfedced418208a77ea781869d05e1109e98d1bd727662a350347a",
      type: ".dmg",
    },
  ],
  lin: [
    {
      name: "AppImage",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.6.4/audacity-linux-3.6.4-x64.AppImage",
      checksum:
        "d00e89394a69f610bda86276fbdf90ca0fab37f433e6a3c4ef3128b23e09be30",
      type: ".AppImage",
    },
  ],
  src: [
    {
      name: "Source code",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.6.4/audacity-sources-3.6.4.tar.gz",
      checksum:
        "8e8c184d9304e961deee7c1621d475ab529f2d550f236c59f43940a842721ac3",
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
        "https://muse-cdn.com/Muse_Hub.exe",
      type: ".exe",
    },
  ],
  mac: [
    {
      name: "Muse Hub installer",
      browser_download_url:
        "https://muse-cdn.com/Muse_Hub.dmg",
      type: ".dmg",
    },
  ],
};

type OpenVinoReleaseInfo = Pick<ReleaseInfo, "name" | "browser_download_url" | "type">;

type OpenvinoReleaseDirectory = {
  version: string;
  revision: string;
  win: OpenVinoReleaseInfo[];
};

export const openvinoReleases: OpenvinoReleaseDirectory = {
  version: "3.6.4",
  revision: "R3.4",
  win: [
    {
      name: "OpenVino AI Plugins",
      browser_download_url: "https://github.com/intel/openvino-plugins-ai-audacity/releases/download/v3.6.4-R3.4/audacity-win-v3.6.4-R3.4-64bit-OpenVINO-AI-Plugins.exe",
      type: ".exe"
    },
  ],
}