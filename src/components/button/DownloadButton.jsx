import React, { useEffect, useState } from "react";
import platform from "platform";
import { useMatomo } from "@datapunt/matomo-tracker-react";
import { releaseData } from "../../assets/js/releaseData";

function DownloadButton() {
  const [browserOS, setBrowserOS] = useState("");
  const { trackEvent } = useMatomo();

  useEffect(() => {
    setBrowserOS(platform.os.family);
  }, []);

  const handleDownloadButtonClick = () => {
    trackEvent({
      category: "product-download",
      action: "Standalone Audacity download",
    });
  };

  function renderButton(href) {
    return (
      <a className="flex flex-1 flex-col justify-center bg-blue-700 hover:bg-blue-600 rounded-md items-center text-center py-3" href={href} onClick={() => handleDownloadButtonClick()}>
          <div className="flex gap-2 items-center">
            <span className="icon icon-import text-white"></span>
            <p className="button-text font-semibold text-white"> Download Audacity {releaseData.version}</p>
          </div>
          <p className="button-caption text-white">Installs with no extras</p>
      </a>
    );
  }

  switch (browserOS) {
    case "OS X":
      return renderButton(
        releaseData.mac[1].browser_download_url
      );
    case "Windows":
      return renderButton(
        releaseData.win[2].browser_download_url
      );
    case "Linux":
      return renderButton(
        releaseData.lin[0].browser_download_url
      );
    default:
      return renderButton("/download");
  }
}

export default DownloadButton;
