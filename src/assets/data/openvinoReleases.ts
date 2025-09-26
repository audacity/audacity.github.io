export type OpenVinoReleaseInfo = {
  name: string;
  browser_download_url: string;
  type: string;
};

type OpenvinoReleaseDirectory = {
  version: string;
  revision: string;
  win: OpenVinoReleaseInfo[];
  mac: OpenVinoReleaseInfo[];
};

export const openvinoReleases: OpenvinoReleaseDirectory = {
  version: "3.7.5",
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
      browser_download_url:
        "https://github.com/audacity/mod-openvino-macos/releases/download/v3.7.1-R4.2-beta-3/Audacity-OpenVINO-3.7.1-R4.2.pkg",
      type: ".pkg",
    },
    {
      name: "OpenVino AI Plugins – Intel (x64)",
      browser_download_url:
        "https://github.com/audacity/mod-openvino-macos/releases/download/v3.7.1-R4.2-beta-3/Audacity-OpenVINO-3.7.1-R4.2-x86_64.pkg",
      type: ".pkg",
    },
    {
      name: "OpenVino AI Plugins – Apple Silicon (ARM64)",
      browser_download_url:
        "https://github.com/audacity/mod-openvino-macos/releases/download/v3.7.1-R4.2-beta-3/Audacity-OpenVINO-3.7.1-R4.2-arm64.pkg",
      type: ".pkg",
    },
  ],
};
