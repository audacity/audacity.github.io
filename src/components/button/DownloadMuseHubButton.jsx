import { useEffect, useState } from "react";
import platform from "platform";
import { audacityReleases } from "../../assets/data/audacityReleases";
import { museHubReleases } from "../../assets/data/museHubReleases";
import { trackEvent } from "../../utils/matomo";
import { useExperiment } from "../../hooks/useExperiment";
import badgeBWhite from "../../assets/img/musehub/musehub-badge-b-white.svg";
import badgeCWhite from "../../assets/img/musehub/musehub-badge-c-white.svg";

function DownloadMuseHubButton() {
  const [browserOS, setBrowserOS] = useState("");
  const { variant } = useExperiment("musehub-badge");

  useEffect(() => {
    setBrowserOS(platform.os.family);
  }, []);

  function handleClick(label) {
    trackEvent("Download Button", label, `${label} ${browserOS}`);
    setTimeout(() => {
      window.location.href = "/post-download";
    }, 2000);
  }

  function getHref() {
    switch (browserOS) {
      case "OS X":
        return museHubReleases.mac[0].browser_download_url;
      case "Windows":
        return museHubReleases.win[0].browser_download_url;
      case "Linux":
      case "Ubuntu":
      case "Debian":
      case "Red Hat":
      case "SuSE":
        return audacityReleases.lin[0].browser_download_url;
      default:
        return "https://www.musehub.com/";
    }
  }

  const href = getHref();
  const isLinux = ["Linux", "Ubuntu", "Debian", "Red Hat", "SuSE"].includes(
    browserOS,
  );

  if (variant === "badge-musehub" && !isLinux) {
    return (
      <a onClick={() => handleClick("Download MuseHub badge-B")} href={href}>
        <img src={badgeBWhite.src} alt="Download on MuseHub" />
      </a>
    );
  }

  if (variant === "badge-download" && !isLinux) {
    return (
      <a onClick={() => handleClick("Download MuseHub badge-C")} href={href}>
        <img src={badgeCWhite.src} alt="Download on MuseHub" />
      </a>
    );
  }

  return (
    <a
      onClick={() => handleClick("Download MuseHub")}
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

export default DownloadMuseHubButton;
