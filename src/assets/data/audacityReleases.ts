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