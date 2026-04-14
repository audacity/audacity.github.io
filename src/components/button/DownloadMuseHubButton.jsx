import { useEffect, useState } from "react";
import platform from "platform";
import { audacityReleases } from "../../assets/data/audacityReleases";
import { museHubReleases } from "../../assets/data/museHubReleases";
import { trackEvent } from "../../utils/matomo";
import { useExperiment } from "../../hooks/useExperiment";

function DownloadMuseHubButton() {
  const [browserOS, setBrowserOS] = useState("");
  const { variant } = useExperiment("musehub-download");
  const isDirect = variant === "direct-download";

  useEffect(() => {
    setBrowserOS(platform.os.family);
  }, []);

  function handleButtonClick(href) {
    if (
      href !== "https://www.musehub.com/" &&
      href !== "/download" &&
      href !== audacityReleases.lin[0].browser_download_url
    ) {
      trackEvent(
        "Download Button",
        isDirect ? "Download Audacity" : "Download MuseHub",
        `${isDirect ? "Download Audacity" : "Download MuseHub"} button ${browserOS}`,
      );
    } else if (href === audacityReleases.lin[0].browser_download_url) {
      trackEvent(
        "Download Button",
        "Download Audacity",
        `Download Audacity button ${browserOS}`,
      );
    }

    setTimeout(() => {
      window.location.href = "/post-download";
    }, 2000);
  }

  function renderButton(href) {
    return (
      <a
        onClick={() => handleButtonClick(href)}
        className="flex py-3 px-4 gap-3 rounded-md justify-center bg-yellow-300 hover:bg-yellow-400 active:bg-yellow-500 w-fit"
        href={href}
      >
        <span className="icon icon-import"></span>
        <p>
          <span className="font-semibold">
            Download Audacity {audacityReleases.version}
          </span>
          <br />
          {false && <span className="font-light text-s">via MuseHub</span>}
        </p>
      </a>
    );
  }

  function getHref() {
    switch (browserOS) {
      case "OS X":
        return isDirect
          ? audacityReleases.mac[0].browser_download_url
          : museHubReleases.mac[0].browser_download_url;
      case "Windows":
        return isDirect
          ? audacityReleases.win[0].browser_download_url
          : museHubReleases.win[0].browser_download_url;
      case "Linux":
      case "Ubuntu":
      case "Debian":
      case "Red Hat":
      case "SuSE":
        return audacityReleases.lin[0].browser_download_url;
      default:
        return isDirect ? "/download" : "https://www.musehub.com/";
    }
  }

  return renderButton(getHref());
}

export default DownloadMuseHubButton;
