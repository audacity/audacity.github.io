import React, { useEffect, useState } from "react";
import platform from "platform";

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
          "Download MuseHub button",
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
        className="flex flex-1 flex-col py-3 items-center rounded justify-center border-2 bg-white border-gray-300 text-blue-700 hover:bg-gray-100 text-center"
        href={href}
      >
        <p className="text-blue-700 font-semibold">
          Audacity + free effects & samples
        </p>
        <p className="text-gray-700">Requires the MuseHub installer</p>
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
      return renderButton("https://www.musehub.com/");
  }
}

export default DownloadMuseHubButton;
