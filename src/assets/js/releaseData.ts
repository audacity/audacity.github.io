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
        "https://github.com/audacity/audacity/releases/download/Audacity-3.5.0-beta-2/audacity-win-3.5.0-beta-2-64bit.exe",
      checksum:
        "13d24c64d222baa4b55f127a56ef968210093d593a39e0ca475659887548d543",
      type: ".exe",
    },
    {
      name: "64 bit zip file",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.5.0-beta-2/audacity-win-3.5.0-beta-2-64bit.zip",
      checksum:
        "8d5ba4cc583bfcbdd40c789b6e346c8ae7adc24801cd16f04eda1a0ede518daa",
      type: ".zip",
    },
    {
      name: "32 bit installer",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.5.0-beta-2/audacity-win-3.5.0-beta-2-32bit.exe",
      checksum:
        "e98d4bb8a99bdcb21d6677e012f57818a31faabe9b447d55391368377263d50e",
      type: ".exe",
    },
    {
      name: "32 bit zip file",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.5.0-beta-2/audacity-win-3.5.0-beta-2-32bit.zip",
      checksum:
        "e446953324e571d30c2b8433bde9bc688259fbf7b52b4003ef5d8687cff938d0",
      type: ".zip",
    },
  ],
  mac: [
    {
      name: "Universal dmg (recommended)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.5.0-beta-2/audacity-macOS-3.5.0-beta-2-universal.dmg",
      checksum:
        "74fbf5ed7bfae4e7df780181652df8f41b7857b9eea57d7690bcc517a2db4289",
      type: ".dmg",
    },
    {
      name: "ARM 64 dmg (Apple Silicon)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.5.0-beta-2/audacity-macOS-3.5.0-beta-2-arm64.dmg",
      checksum:
        "87a7e04d1890c848e1c660cc367727cc9015fd724a474ad99f25730e521c327b",
      type: ".dmg",
    },
    {
      name: "x86_64 dmg (Intel)",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.5.0-beta-2/audacity-macOS-3.5.0-beta-2-x86_64.dmg",
      checksum:
        "4181b374724f62210ae9b26fd7416695c3ba5c79626f71b5d7b4f19d8fa3ef6b",
      type: ".dmg",
    },
  ],
  lin: [
    {
      name: "AppImage",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.5.0-beta-2/audacity-linux-3.5.0-beta-2-x64.AppImage",
      checksum:
        "e73e237d6f902ffc1bbc07744d0cdb09d8737666e0de91f328489b6f16ee41e0",
      type: ".AppImage",
    },
  ],
  src: [
    {
      name: "Source code",
      browser_download_url:
        "https://github.com/audacity/audacity/releases/download/Audacity-3.5.0-beta-2/audacity-sources-3.5.0-beta-2.tar.gz",
      checksum:
        "d3a9d0514cc6b14491cb09792913709f780a454f08efcaf915278b0af44259a4",
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
