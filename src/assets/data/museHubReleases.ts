export type MuseHubReleaseInfo = {
  name: string;
  browser_download_url: string;
  type: string;
};

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
