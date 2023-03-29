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
        className="flex flex-col gap-1 py-2 px-4 items-center rounded justify-center border border-gray-200 text-blue-700 hover:bg-gray-100 hover:border-gray-300"
        href={href}
      >
        Audacity + free effects & samples
        <p class="text-xs text-gray-700">Requires the MuseHub installer</p>
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
