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
  version: "3.4.2",
  win: [
    {
      name: "64 bit installer (recommended)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.4.2/audacity-win-3.4.2-64bit.exe",
      checksum:
        "d7bd5ae775db9e42da6058da4a65a8f898a46ce467d9f21585084566213c36bf",
      type: ".exe",
    },
    {
      name: "64 bit zip file",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.4.2/audacity-win-3.4.2-64bit.zip",
      checksum:
        "0df85eda8b79ebcceca673a7f7dec32c4fcb4625342b91995217f3124b57f7d4",
      type: ".zip",
    },
    {
      name: "32 bit installer",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.4.2/audacity-win-3.4.2-32bit.exe",
      checksum:
        "7f7dd6f96643a1a826d1c91a5217721f97474f171a6335c47d4c50a76c7aceaa",
      type: ".exe",
    },
    {
      name: "32 bit zip file",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.4.2/audacity-win-3.4.2-32bit.zip",
      checksum:
        "9b9fceae802e76f5c91b42074331094c1fb90b9f519bee196f40aeb1ee863ce5",
      type: ".zip",
    },
  ],
  mac: [
    {
      name: "Universal dmg (recommended)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.4.2/audacity-macOS-3.4.2-universal.dmg",
      checksum:
        "4b23b5e0f1cbc7c7d33d1d9cecd6a163d0d89ccb5aadeb8901c96616d8e5565d",
      type: ".dmg",
    },
    {
      name: "ARM 64 dmg (Apple Silicon)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.4.2/audacity-macOS-3.4.2-arm64.dmg",
      checksum:
        "01946a56dc45acc01d693fd3b7e7d2325e6adb4f052253bc94fe7e7b272d5791",
      type: ".dmg",
    },
    {
      name: "x86_64 dmg (Intel)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.4.2/audacity-macOS-3.4.2-x86_64.dmg",
      checksum:
        "70400941a153815f803ab436d23c08f29dbb80f7777ab21134663539727307b7",
      type: ".dmg",
    },
  ],
  lin: [
    {
      name: "AppImage",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.4.2/audacity-linux-3.4.2-x64.AppImage",
      checksum:
        "d3a3695b02f99934b24b0d7587cbc4544676d9244fa2b65e63d3d8245c71d1e5",
      type: ".AppImage",
    },
  ],
  src: [
    {
      name: "Source code",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.4.2/audacity-sources-3.4.2.tar.gz",
      checksum:
        "f28dd718d2c5a2aa9f207b8351443a90c1f02b65378ca94bcc7febda42635e48",
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
        "https://github.com/audacity/audacity/releases/download/Audacity-3.5.0-beta/audacity-win-3.5.0-beta-64bit.exe",
      checksum:
        "86b6097166bf705483084cb681f40e8bf26ff06b50e993add60da120fe2c2a8b",
      type: ".exe",
    },
    {
      name: "64 bit zip file",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.5.0-beta/audacity-win-3.5.0-beta-64bit.zip",
      checksum:
        "d583e6c2b07bde74821e30b1871a082f85c1edff6888d27688b1cd21d989a4a2",
      type: ".zip",
    },
    {
      name: "32 bit installer",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.5.0-beta/audacity-win-3.5.0-beta-32bit.exe",
      checksum:
        "ee5d7aa386c477ed2bc47f75e71e953ef43b51f8dcbc39dc8aa1c0dce1f34726",
      type: ".exe",
    },
    {
      name: "32 bit zip file",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.5.0-beta/audacity-win-3.5.0-beta-32bit.zip",
      checksum:
        "6ef854c940948a37f56b00948ca12d995b8a3bd60f26e760e66562c894a2bed7",
      type: ".zip",
    },
  ],
  mac: [
    {
      name: "Universal dmg (recommended)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.5.0-beta/audacity-macOS-3.5.0-beta-universal.dmg",
      checksum:
        "dfdb5ad4bf97c4a50005b596fbc6f4e48109d4bdc9fe113b35779af3db47fe62",
      type: ".dmg",
    },
    {
      name: "ARM 64 dmg (Apple Silicon)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.5.0-beta/audacity-macOS-3.5.0-beta-arm64.dmg",
      checksum:
        "413effbca18f010a419f950b9978343c51596aaac89ca7faa02c97a799eb9925",
      type: ".dmg",
    },
    {
      name: "x86_64 dmg (Intel)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.5.0-beta/audacity-macOS-3.5.0-beta-x86_64.dmg",
      checksum:
        "09bc739411cf23ed3eb92e084021a2c34dd6386c3cb74c32b326e595e3d064b2",
      type: ".dmg",
    },
  ],
  lin: [
    {
      name: "AppImage",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.5.0-beta/audacity-linux-3.5.0-beta-x64.AppImage",
      checksum:
        "4bc6c5def987b62b7f28fc7f45875c55c523e0509f9082eafbeda976d6f1dcd8",
      type: ".AppImage",
    },
  ],
  src: [
    {
      name: "Source code",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.5.0-beta/audacity-sources-3.5.0-beta.tar.gz",
      checksum:
        "0c2a107c30387e7c9f8c3a659aeceed7fc866e75bf71b801895a0b7e646cae3f",
      type: ".tar.gz",
    },
  ],
};

type MuseHubReleaseInfo = Pick<ReleaseInfo, "name" | "browser_download_url" | "type">;

type MuseHubReleaseDirectory = {
  win: MuseHubReleaseInfo[];
  mac: MuseHubReleaseInfo[];
};

export const museHubReleases: MuseHubReleaseDirectory = {
  win: [
    {
      name: "Muse Hub installer",
      browser_download_url:
        "https://pub-c7a32e5b5d834ec9aeef400105452a42.r2.dev/Muse_Hub.exe",
      type: ".exe",
    },
  ],
  mac: [
    {
      name: "Muse Hub installer",
      browser_download_url:
        "https://pub-c7a32e5b5d834ec9aeef400105452a42.r2.dev/Muse_Hub.dmg",
      type: ".dmg",
    },
  ],
};
