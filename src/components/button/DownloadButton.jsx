import { audacityReleases } from "../../assets/data/audacityReleases";
import { trackEvent } from "../../utils/matomo";

function DownloadButton() {
  function handleButtonClick(href, os) {
    if (href !== "/download") {
      trackEvent(
        "Download Button",
        "Download Audacity",
        `Download Audacity button ${os}`,
      );
    }

    setTimeout(() => {
      window.location.href = "/post-download";
    }, 2000);
  }

  const links = [
    {
      osClass: "os-mac",
      osLabel: "OS X",
      href: audacityReleases.mac[0].browser_download_url,
    },
    {
      osClass: "os-win",
      osLabel: "Windows",
      href: audacityReleases.win[0].browser_download_url,
    },
  ];

  const renderDownloadLink = (link) => (
    <a
      key={link.osClass}
      onClick={() => handleButtonClick(link.href, link.osLabel)}
      className={`os-specific ${link.osClass} text-white font-semibold hover:underline`}
      href={link.href}
    >
      Download without MuseHub
    </a>
  );

  const renderOtherVersionsLink = (link) => (
    <a
      key={link.osClass}
      onClick={() =>
        trackEvent(
          "Download Button",
          "Other Versions",
          `Other versions ${link.osLabel}`,
        )
      }
      className={`os-specific ${link.osClass} text-white font-semibold hover:underline`}
      href="https://www.audacityteam.org/download/"
    >
      Other versions
    </a>
  );

  return (
    <>
      <span className="ab-variant ab-musehub-badge-control">
        {links.map(renderDownloadLink)}
      </span>
      <span className="ab-variant ab-musehub-badge-musehub">
        {links.map(renderOtherVersionsLink)}
      </span>
      <span className="ab-variant ab-musehub-badge-download">
        {links.map(renderOtherVersionsLink)}
      </span>
    </>
  );
}

export default DownloadButton;
