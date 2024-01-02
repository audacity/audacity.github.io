import React, { useEffect, useState } from "react";
import platform from "platform";
import { releaseData } from "../../assets/js/releaseData";

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
          "Button",
          "Download",
          "Download Audacity button",
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
        className="flex flex-col justify-center bg-blue-700 hover:bg-blue-600 rounded-md items-center text-center py-3 w-full sm:w-72"
        href={href}
      >
        <div className="flex gap-2 items-center">
          <span className="icon icon-import text-white"></span>
          <p className="button-text font-semibold text-white">
            Download Audacity {releaseData.version}
          </p>
        </div>
        <p className="button-caption text-white">Installs with no extras</p>
      </a>
    );
  }

  switch (browserOS) {
    case "OS X":
      return renderButton(releaseData.mac[0].browser_download_url);
    case "Windows":
      return renderButton(releaseData.win[0].browser_download_url);
    case "Linux":
    case "Ubuntu":
    case "Debian":
    case "Red Hat":
    case "SuSE":
      return renderButton(releaseData.lin[0].browser_download_url);
    default:
      return renderButton("/download");
  }
}

export default DownloadButton;
