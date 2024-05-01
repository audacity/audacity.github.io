import React, { useEffect, useState } from "react";
import platform from "platform";
import { audacityReleases } from "../../assets/js/releaseData";
import { museHubReleases } from "../../assets/js/releaseData";

function DownloadMuseHubButton() {
  const [browserOS, setBrowserOS] = useState("");

  useEffect(() => {
    setBrowserOS(platform.os.family);
  }, []);

  function handleButtonClick(href) {
    if (href !== "https://www.musehub.com/") {
      if (typeof _paq !== "undefined") {
        _paq.push([
          "trackEvent",
          "Download Button",
          "Download Muse Hub",
          `Download Muse Hub button ${platform.os.family}`,
        ]);
      }
    }
  }

  function renderButton(href) {
    return (
      <a
        onClick={() => handleButtonClick(href)}
        className="flex items-center p-4 gap-3 rounded-md justify-center bg-blue-700 hover:bg-blue-600 w-fit"
        href={href}
      >
        <span className="icon icon-import text-white"></span>
        <p className="text-white font-semibold">
          Download Audacity {audacityReleases.version} for {platform.os.family}<br />
          <span className="font-light text-sm">via Muse Hub </span>
        </p>
      </a>
    );
  }

  switch (browserOS) {
    case "OS X":
      return renderButton(museHubReleases.mac[0].browser_download_url);
    case "Windows":
      return renderButton(museHubReleases.win[0].browser_download_url);
    case "Linux":
    case "Ubuntu":
    case "Debian":
    case "Red Hat":
    case "SuSE":
      return; // Musehub not relevant on Linux yet
    default:
      return renderButton("https://www.musehub.com/");
  }
}

export default DownloadMuseHubButton;
