import React, { useEffect, useState } from "react";
import platform from "platform";
import { releaseData } from "../../assets/js/releaseData";

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
          "Button",
          "Download",
          "Download Muse Hub button",
        ]);
      }
    } else {
      console.log(href, "No event sent");
    }
  }

  function renderButton(href) {
    return (
      <a
        onClick={() => handleButtonClick(href)}
        className="flex flex-col py-3 items-center rounded-md justify-center border-2 bg-white border-gray-300 text-blue-700 hover:bg-gray-100 text-center w-full sm:w-72"
        href={href}
      >
        <p className="text-blue-700 font-semibold">
          Audacity + free effects & samples
        </p>
        <p className="text-gray-700">Requires the Muse Hub installer</p>
      </a>
    );
  }

  switch (browserOS) {
    case "OS X":
      return renderButton(
        releaseData.mac[3].browser_download_url
      );
    case "Windows":
      return renderButton(
        releaseData.win[4].browser_download_url
      );
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
