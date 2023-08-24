import React, { useEffect, useState } from "react";
import platform from "platform";
import { useMatomo } from "@datapunt/matomo-tracker-react";

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
            <span className="icon icon-export text-white"></span>
            <p className="button-text font-semibold text-white"> Download Audacity</p>
          </div>
          <p className="button-caption text-white opacity-80">Installs with no add-ons</p>
      </a>
    );
  }

  switch (browserOS) {
    case "OS X":
      return renderButton(
        "https://github.com/audacity/audacity/releases/download/Audacity-3.2.4/audacity-macOS-3.2.4-universal.dmg"
      );
    case "Windows":
      return renderButton(
        "https://github.com/audacity/audacity/releases/download/Audacity-3.2.4/audacity-win-3.2.4-x64.exe"
      );
    case "Linux":
      return renderButton(
        "https://github.com/audacity/audacity/releases/download/Audacity-3.2.4/audacity-win-3.2.4-x64.exe"
      );
    default:
      return renderButton("/downloads");
  }
}

export default DownloadButton;
