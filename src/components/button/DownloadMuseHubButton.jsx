import React, { useEffect, useState } from "react";
import platform from "platform";
import { audacityReleases } from "../../assets/js/releaseData";
import { museHubReleases } from "../../assets/js/releaseData";
import { trackEvent } from "../../utils/matomo";

function DownloadMuseHubButton() {
  const [browserOS, setBrowserOS] = useState("");

  useEffect(() => {
    setBrowserOS(platform.os.family);
  }, []);

  const isLinux = 
    browserOS === "Linux" || 
    browserOS === "Ubuntu" || 
    browserOS === "Debian" || 
    browserOS === "Red Hat" || 
    browserOS === "SuSE";

  function handleButtonClick(href) {
    if (
      href !== "https://www.musehub.com/" &&
      href !== audacityReleases.lin[0].browser_download_url
    ) {
      trackEvent(
        "Download Button",
        "Download Muse Hub",
        `Download Muse Hub button ${browserOS}`
      );
    } else if (href === audacityReleases.lin[0].browser_download_url) {
      trackEvent(
        "Download Button",
        "Download Audacity",
        `Download Audacity button ${browserOS}`
      );
    }

    setTimeout(() => {
      window.location.href = "post-download";
    }, 2000);
  }

  function renderButton(href) {
    return (
      <a
        onClick={() => handleButtonClick(href)}
        className="flex py-3 px-4 gap-3 rounded-md justify-center bg-yellow-300 hover:bg-yellow-400 active:bg-yellow-500 w-fit"
        href={href}
      >
        <span className="icon icon-import"></span>
        <p>
          <span className="font-semibold">
            Download Audacity {audacityReleases.version}
          </span>
          <br />
          {false && <span className="font-light text-s">via MuseHub</span>}
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
      return renderButton(audacityReleases.lin[0].browser_download_url); // appimage on Linux
    default:
      return renderButton("https://www.musehub.com/");
  }
}

export default DownloadMuseHubButton;