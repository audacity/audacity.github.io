import React, { useEffect, useState } from "react";
import platform from "platform";
import { audacityReleases } from "../../assets/js/releaseData";
import { trackEvent } from "../../utils/matomo";

function DownloadButton() {
  const [browserOS, setBrowserOS] = useState("");

  useEffect(() => {
    setBrowserOS(platform.os.family);
  }, []);

  function handleButtonClick(href) {
    if (href !== "/download") {
        trackEvent(
          "Download Button",
          "Download Audacity",
          `Download Audacity button ${platform.os.family}`
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
        className="flex py-3 px-4 gap-3 rounded-md items-center bg-yellow-300 hover:bg-yellow-400 active:bg-yellow-500 w-fit"
        href={href}
      >
        <div className="flex items-center gap-4">
        <span className="icon icon-import"></span>
        <p className="">
        <span className="font-semibold">Download Audacity {audacityReleases.version}</span><br />
        <span className="font-light">Installs with no extras</span></p>
        </div>
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
