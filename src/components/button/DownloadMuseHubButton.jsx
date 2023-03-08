import React, { useEffect, useState } from "react";
import platform from "platform";

function DownloadMuseHubButton(props) {
  const [browserOS, setBrowserOS] = useState("");

  useEffect(() => {
    setBrowserOS(platform.os.family);
  }, []);

  function renderButton(href) {
    return (
      <a
        className="flex h-12 gap-3 px-4 items-center rounded justify-center whitespace-nowrap border border-blue-700 text-blue-700 hover:bg-blue-700 hover:text-white"
        href={href}
      >
        Download with free VST effects
      </a>
    );
  }

  switch (browserOS) {
    case "OS X":
      return renderButton(
        "https://pub-c7a32e5b5d834ec9aeef400105452a42.r2.dev/Muse_Hub.dmg"
      );
      break;
    case "Windows":
      return renderButton(
        "https://pub-c7a32e5b5d834ec9aeef400105452a42.r2.dev/Muse_Hub.exe"
      );
      break;
    case "Linux":
      return renderButton(
        "https://pub-c7a32e5b5d834ec9aeef400105452a42.r2.dev/Muse_Hub.deb"
      );
      break;
    default:
      return renderButton("/downloads", "Download Audacity");
  }
}

export default DownloadMuseHubButton;
