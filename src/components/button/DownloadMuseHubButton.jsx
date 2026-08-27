import { audacityReleases } from "../../assets/data/audacityReleases";
import { museHubReleases } from "../../assets/data/museHubReleases";
import { trackBinaryDownloadChoice, trackEvent } from "../../utils/matomo";
import badgeBWhite from "../../assets/img/musehub/musehub-badge-b-white.svg";
import badgeCWhite from "../../assets/img/musehub/musehub-badge-c-white.svg";
import badgeDownloadOn from "../../assets/img/musehub/musehub-badge-download-on.svg";

/** @param {{ surface?: "hero" }} [props] */
function DownloadMuseHubButton({ surface } = {}) {
  function handleClick(link, variant, experimentName) {
    const os = link.osLabel;
    trackEvent(
      "Download Button",
      "Download MuseHub",
      `Download MuseHub button ${os}`,
    );
    trackBinaryDownloadChoice({
      experimentName,
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

  const renderControlButton = (
    link,
    key,
    variant = "control",
    experimentName,
  ) => (
    <a
      key={key}
      onClick={() => handleClick(link, variant, experimentName)}
      /*
        This branch's treatment, kept through the main merge: accent pill, not
        the bg-yellow-300 the button arrived in. Yellow isn't in the palette,
        and this is the page's primary CTA.
      */
      className={`os-specific ${link.osClass} items-center justify-center h-12 lg:h-14 w-fit px-6 lg:px-8 rounded-full bg-accent text-white font-semibold hover:opacity-90 transition-opacity`}
      href={link.href}
    >
      Download Audacity {audacityReleases.version}
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

  // Iteration 3 (musehub-copy): the white "download on musehub" badge for arms
  // b/c (Figma C/D). Routes to the same MuseHub installer as the control button.
  // Linux has no MuseHub installer, so it falls back to the direct Audacity
  // button.
  const renderMuseHubBadgeButton = (link, variant, key) => {
    if (link.osClass === "os-linux") {
      return renderControlButton(link, key, variant, "musehub-copy");
    }

    return (
      <a
        key={key}
        onClick={() => handleClick(link, variant, "musehub-copy")}
        className={`os-specific ${link.osClass}`}
        href={link.href}
      >
        <img src={badgeDownloadOn.src} alt="Download on MuseHub" />
      </a>
    );
  };

  // Homepage hero only: iteration 3 copy test (arms match Confluence A/B/C/D).
  // a (original) / b keep the "Download Audacity <ver>" button; c/d use the
  // "download on musehub" badge.
  if (surface === "hero") {
    return (
      <>
        <span className="ab-variant ab-musehub-copy-a">
          {links.map((link) =>
            renderControlButton(link, link.osClass, "a", "musehub-copy"),
          )}
        </span>
        <span className="ab-variant ab-musehub-copy-b">
          {links.map((link) =>
            renderControlButton(link, link.osClass, "b", "musehub-copy"),
          )}
        </span>
        <span className="ab-variant ab-musehub-copy-c">
          {links.map((link) =>
            renderMuseHubBadgeButton(link, "c", link.osClass),
          )}
        </span>
        <span className="ab-variant ab-musehub-copy-d">
          {links.map((link) =>
            renderMuseHubBadgeButton(link, "d", link.osClass),
          )}
        </span>
      </>
    );
  }

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
