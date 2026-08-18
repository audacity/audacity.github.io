import React, { useEffect, useState } from "react";
import platform from "platform";
import { audacityReleases } from "../../assets/data/audacityReleases";
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
        `Download Audacity button ${platform.os.family}`,
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
        className="flex items-center justify-center gap-2 h-10 lg:h-11 w-fit px-5 rounded-full border border-white text-white font-semibold hover:bg-white/10 transition-colors"
        href={href}
      >
        <span className="icon icon-import icon-medium" aria-hidden="true" />
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
