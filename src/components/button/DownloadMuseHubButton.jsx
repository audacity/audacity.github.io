import React, { useEffect, useState } from "react";
import platform from "platform";
import { useMatomo } from "@datapunt/matomo-tracker-react";

function DownloadMuseHubButton() {
  const [browserOS, setBrowserOS] = useState("");
  const { trackEvent } = useMatomo();

  useEffect(() => {
    setBrowserOS(platform.os.family);
  }, []);

  const handleDownloadButtonClick = () => {
    trackEvent({ category: "product-download", action: "Muse Hub download" });
  };

  function renderButton(href) {
    return (
      <a
        className="flex flex-1 flex-col py-3 items-center rounded justify-center border bg-white border-gray-200 text-blue-700 hover:bg-gray-100 hover:border-gray-300 text-center"
        href={href}
        onClick={() => handleDownloadButtonClick()}
      >
        <p className="text-blue-700 font-semibold">
          Audacity + free effects & samples
        </p>
        <p className="text-gray-500">Requires the MuseHub installer</p>
      </a>
    );
  }

  switch (browserOS) {
    case "OS X":
      return renderButton(
        "https://pub-c7a32e5b5d834ec9aeef400105452a42.r2.dev/Muse_Hub.dmg"
      );
    case "Windows":
      return renderButton(
        "https://pub-c7a32e5b5d834ec9aeef400105452a42.r2.dev/Muse_Hub.exe"
      );
    case "Linux":
      return renderButton(
        "https://pub-c7a32e5b5d834ec9aeef400105452a42.r2.dev/Muse_Hub.deb"
      );
    default:
      return renderButton("/download", "Download Audacity");
  }
}

export default DownloadMuseHubButton;
