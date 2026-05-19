import { audacityReleases } from "../../assets/data/audacityReleases";
import { museHubReleases } from "../../assets/data/museHubReleases";
import { trackEvent } from "../../utils/matomo";
import badgeBWhite from "../../assets/img/musehub/musehub-badge-b-white.svg";
import badgeCWhite from "../../assets/img/musehub/musehub-badge-c-white.svg";

function DownloadMuseHubButton() {
  function handleClick(label, os) {
    trackEvent("Download Button", label, `${label} ${os}`);
    setTimeout(() => {
      window.location.href = "/post-download";
    }, 2000);
  }

  const links = [
    {
      osClass: "os-mac",
      osLabel: "OS X",
      href: museHubReleases.mac[0].browser_download_url,
    },
    {
      osClass: "os-win",
      osLabel: "Windows",
      href: museHubReleases.win[0].browser_download_url,
    },
    {
      osClass: "os-linux",
      osLabel: "Linux",
      href: audacityReleases.lin[0].browser_download_url,
    },
  ];

  const renderControlButton = (link, key) => (
    <a
      key={key}
      onClick={() => handleClick("Download MuseHub", link.osLabel)}
      className={`os-specific ${link.osClass} py-3 px-4 gap-3 rounded-md justify-center bg-yellow-300 hover:bg-yellow-400 active:bg-yellow-500 w-fit`}
      href={link.href}
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

  const renderBadgeButton = (link, badge, label, key) => {
    if (link.osClass === "os-linux") {
      return renderControlButton(link, key);
    }

    return (
      <a
        key={key}
        onClick={() => handleClick(label, link.osLabel)}
        className={`os-specific ${link.osClass}`}
        href={link.href}
      >
        <img src={badge.src} alt="Download on MuseHub" />
      </a>
    );
  };

  return (
    <>
      <span className="ab-variant ab-musehub-badge-control">
        {links.map((link) => renderControlButton(link, link.osClass))}
      </span>
      <span className="ab-variant ab-musehub-badge-musehub">
        {links.map((link) =>
          renderBadgeButton(
            link,
            badgeBWhite,
            "Download MuseHub badge-B",
            link.osClass,
          ),
        )}
      </span>
      <span className="ab-variant ab-musehub-badge-download">
        {links.map((link) =>
          renderBadgeButton(
            link,
            badgeCWhite,
            "Download MuseHub badge-C",
            link.osClass,
          ),
        )}
      </span>
    </>
  );
}

export default DownloadMuseHubButton;
