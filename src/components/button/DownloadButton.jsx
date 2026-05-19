import { audacityReleases } from "../../assets/data/audacityReleases";
import { trackBinaryDownloadChoice, trackEvent } from "../../utils/matomo";

function DownloadButton() {
  function handleButtonClick(link) {
    const { href, osLabel, releaseName } = link;
    if (href !== "/download") {
      trackEvent(
        "Download Button",
        "Download Audacity",
        `Download Audacity button ${osLabel}`,
      );
      trackBinaryDownloadChoice({
        variant: "control",
        os: osLabel,
        releaseName,
        url: href,
        source: "primary-audacity-button",
      });
    } else {
      trackEvent(
        "Download Button",
        "Other Versions",
        `Other versions ${osLabel}`,
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
      releaseName: audacityReleases.mac[0].name,
    },
    {
      osClass: "os-win",
      osLabel: "Windows",
      href: audacityReleases.win[0].browser_download_url,
      releaseName: audacityReleases.win[0].name,
    },
  ];

  const renderDownloadLink = (link) => (
    <a
      key={link.osClass}
      onClick={() => handleButtonClick(link)}
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
