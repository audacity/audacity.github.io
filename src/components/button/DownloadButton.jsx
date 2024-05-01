import React, { useEffect, useState } from "react";
import platform from "platform";
import { audacityReleases } from "../../assets/js/releaseData";

function DownloadButton() {
  const [browserOS, setBrowserOS] = useState("");

  useEffect(() => {
    setBrowserOS(platform.os.family);
  }, []);

  function handleButtonClick(href) {
    if (href !== "/download") {
      if (typeof _paq !== "undefined") {
        _paq.push([
          "trackEvent",
          "Download Button",
          "Download Audacity",
          `Download Audacity button ${platform.os.family}`,
        ]);
      }
    }
  }

  function renderButton(href) {
    return (
      <a
        onClick={() => handleButtonClick(href)}
        className="flex gap-3 text-blue-700 font-semibold hover:text-blue-600 rounded-md border-2 border-gray-300 px-4 py-2"
        href={href}
      > <span className="icon icon-import text-blue-700"></span> 
        <p>Download without Muse Hub</p>
      </a>
    );
  }

  switch (browserOS) {
    case "OS X":
      return renderButton(audacityReleases.mac[0].browser_download_url);
    case "Windows":
      return renderButton(audacityReleases.win[0].browser_download_url);
    case "Linux":
    case "Ubuntu":
    case "Debian":
    case "Red Hat":
    case "SuSE":
      return renderButton(audacityReleases.lin[0].browser_download_url);
    default:
      return renderButton("/download");
  }
}

export default DownloadButton;
