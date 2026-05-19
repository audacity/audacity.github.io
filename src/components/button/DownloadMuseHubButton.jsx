import { audacityReleases } from "../../assets/data/audacityReleases";
import { museHubReleases } from "../../assets/data/museHubReleases";
import { trackBinaryDownloadChoice, trackEvent } from "../../utils/matomo";
import badgeBWhite from "../../assets/img/musehub/musehub-badge-b-white.svg";
import badgeCWhite from "../../assets/img/musehub/musehub-badge-c-white.svg";

function DownloadMuseHubButton() {
  function handleClick(link, variant) {
    const os = link.osLabel;
    trackEvent(
      "Download Button",
      "Download MuseHub",
      `Download MuseHub button ${os}`,
    );
    trackBinaryDownloadChoice({
      variant,
      os,
      releaseName: link.releaseName,
      url: link.href,
      source: "primary-musehub-button",
    });
    setTimeout(() => {
      window.location.href = "/post-download";
    }, 2000);
  }

  const links = [
    {
      osClass: "os-mac",
      osLabel: "OS X",
      href: museHubReleases.mac[0].browser_download_url,
      releaseName: museHubReleases.mac[0].name,
    },
    {
      osClass: "os-win",
      osLabel: "Windows",
      href: museHubReleases.win[0].browser_download_url,
      releaseName: museHubReleases.win[0].name,
    },
    {
      osClass: "os-linux",
      osLabel: "Linux",
      href: audacityReleases.lin[0].browser_download_url,
      releaseName: audacityReleases.lin[0].name,
    },
  ];

  const renderControlButton = (link, key, variant = "control") => (
    <a
      key={key}
      onClick={() => handleClick(link, variant)}
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

  const renderBadgeButton = (link, badge, variant, key) => {
    if (link.osClass === "os-linux") {
      return renderControlButton(link, key, variant);
    }

    return (
      <a
        key={key}
        onClick={() => handleClick(link, variant)}
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
          renderBadgeButton(link, badgeBWhite, "badge-musehub", link.osClass),
        )}
      </span>
      <span className="ab-variant ab-musehub-badge-download">
        {links.map((link) =>
          renderBadgeButton(link, badgeCWhite, "badge-download", link.osClass),
        )}
      </span>
    </>
  );
}

export default DownloadMuseHubButton;
