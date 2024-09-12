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

    setTimeout(() => {
      window.location.href = "download-success";
    }, 2000);
  }

  function renderButton(href) {
    return (
      <a
        onClick={() => handleButtonClick(href)}
        className="text-white hover:underline"
        href={href}
      >
        Download without Muse Hub
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
      return; //primary button is Linux download already
    default:
      return renderButton("/download");
  }
}

export default DownloadButton;
