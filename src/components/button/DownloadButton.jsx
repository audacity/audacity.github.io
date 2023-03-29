import React, { useEffect, useState } from "react";
import platform from "platform";

function DownloadButton(props) {
  const { primary } = props;
  const [browserOS, setBrowserOS] = useState("");

  useEffect(() => {
    setBrowserOS(platform.os.family);
  }, []);

  function renderButton(href, buttonText) {
    return (
      <a
        className={`flex h-12 gap-3 px-4 items-center rounded justify-center whitespace-nowrap	 + ${
          primary
            ? "bg-blue-700 hover:bg-blue-600 active:bg-blue-800 text-white rounded "
            : "bg-white hover:bg-gray-200 text-blue-700"
        }`}
        href={href}
      >
        {buttonText}
      </a>
    );
  }

  switch (browserOS) {
    case "OS X":
      return renderButton(
        "https://github.com/audacity/audacity/releases/download/Audacity-3.2.4/audacity-macOS-3.2.4-universal.dmg",
        "Download standalone Audacity"
      );
      break;
    case "Windows":
      return renderButton(
        "https://github.com/audacity/audacity/releases/download/Audacity-3.2.4/audacity-win-3.2.4-x64.exe",
        "Download for Windows"
      );
      break;
    case "Linux":
      return renderButton(
        "https://github.com/audacity/audacity/releases/download/Audacity-3.2.4/audacity-win-3.2.4-x64.exe",
        "Download for Linux"
      );
      break;
    default:
      return renderButton("/downloads", "Download Audacity");
  }
}

export default DownloadButton;
