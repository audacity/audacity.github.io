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
  version: "3.7.0",
  win: [
    {
      name: "64 bit installer",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.0/audacity-win-3.7.0-64bit.exe",
      checksum:
        "1034c8189843c4a2f284746369ce0ec1a3667b7b10d88aca2f44b68369c2347f",
      type: ".exe",
    },
    {
      name: "64 bit zip file",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.0/audacity-win-3.7.0-64bit.zip",
      checksum:
        "a24a5dea7eb21d62057cae6f55ea1a84046e32b748081791f4591c123c95c57a",
      type: ".zip",
    },
    {
      name: "32 bit installer",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.0/audacity-win-3.7.0-32bit.exe",
      checksum:
        "84c2643dae27a26703e725f97258ba8b8d428478fa10f0df141cf093aa6f2432",
      type: ".exe",
    },
    {
      name: "32 bit zip file",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.0/audacity-win-3.7.0-32bit.zip",
      checksum:
        "3764da1c1d9255ff0c24ec73a1f09a86f064b8c55608d822474da14925fdf342",
      type: ".zip",
    },
  ],
  mac: [
    {
      name: "Universal dmg",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.0/audacity-macOS-3.7.0-universal.dmg",
      checksum:
        "dd54c9a42c7ea851873b4f39929265d7f30d912bf003d2424b49f24fcba4da69",
      type: ".dmg",
    },
    {
      name: "ARM 64 dmg (Apple Silicon)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.0/audacity-macOS-3.7.0-arm64.dmg",
      checksum:
        "40e7749e876897524d65ae159a0df90591d13a9a775d6b98ba57339a2f0d6442",
      type: ".dmg",
    },
    {
      name: "x86_64 dmg (Intel)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.0/audacity-macOS-3.7.0-x86_64.dmg",
      checksum:
        "0c3e148947e1a0b7f5428eafbfe1c5b2750a178af594b2651d63b9cb126fded1",
      type: ".dmg",
    },
  ],
  lin: [
    {
      name: "AppImage (Ubuntu 20.04)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.0/audacity-linux-3.7.0-x64-20.04.AppImage",
      checksum:
        "8ac096bbeb2a4db0ca303e49a65726673a8f01b3c02ac5846c297b23e519afb5",
      type: ".AppImage",
    },
        {
      name: "AppImage (Ubuntu 22.04)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.0/audacity-linux-3.7.0-x64-22.04.AppImage",
      checksum:
        "8c92601a46456b2cfc942a3effd5588dd69f8b79f7aaa735e88f447be5efbe41",
      type: ".AppImage",
    },
  ],
  src: [
    {
      name: "Source code",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.7.0/audacity-sources-3.7.0.tar.gz",
      checksum:
        "fefe75f375a7e63c436eefe7258e0817bb17abf433252df7fa2667813031eb70",
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
  version: "3.7.0",
  revision: "R4.0",
  win: [
    {
      name: "OpenVino AI Plugins",
      browser_download_url: "https://github.com/intel/openvino-plugins-ai-audacity/releases/download/v3.7.0-R4.0/audacity-win-v3.7.0-R4.0-64bit-OpenVINO-AI-Plugins.exe",
      type: ".exe"
    },
  ],
}
