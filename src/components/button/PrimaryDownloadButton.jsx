import React, { useEffect, useState } from "react";
import platform from "platform";

function PrimaryDownloadButton() {
  const [browserOS, setBrowserOS] = useState("");

  useEffect(() => {
    setBrowserOS(platform.os.family);
  }, []);

  function renderButton(href, buttonText) {
    return (
      <a
        className="flex h-14 xl:h-16 text-lg xl:text-lg px-4 xl:px-6 w-fit bg-blue-700 hover:bg-blue-600 active:bg-blue-800 text-white items-center gap-x-3 rounded mt-8"
        href={href}
      >
        <svg className="w-4 fill-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
          <path d="M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32V274.7l-73.4-73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l128 128c12.5 12.5 32.8 12.5 45.3 0l128-128c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L288 274.7V32zM64 352c-35.3 0-64 28.7-64 64v32c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V416c0-35.3-28.7-64-64-64H346.5l-45.3 45.3c-25 25-65.5 25-90.5 0L165.5 352H64zm368 56a24 24 0 1 1 0 48 24 24 0 1 1 0-48z" />
        </svg>
        {buttonText}
      </a>
    );
  }

  switch (browserOS) {
    case "OS X":
      return renderButton(
        "https://github.com/audacity/audacity/releases/download/Audacity-3.2.4/audacity-macOS-3.2.4-universal.dmg",
        "Download for Mac OS"
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
      return renderButton(
        "/downloads",
        "Download Audacity"
      );
  }
}

export default PrimaryDownloadButton;
