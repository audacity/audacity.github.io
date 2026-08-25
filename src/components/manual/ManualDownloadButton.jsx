import { useEffect, useState } from "react";
import platform from "platform";
import { audacityReleases } from "../../assets/data/audacityReleases";
import { trackEvent } from "../../utils/matomo";

/*
  The manual's download button: same release data and OS detection as the
  homepage hero's DownloadButton, restyled for a light article page. Renders
  as a link to /download on the server and for Linux (where the right build
  is a per-distro choice), then upgrades to the direct installer for the
  visitor's platform after mount.
*/
export default function ManualDownloadButton() {
  const [href, setHref] = useState("/download");

  useEffect(() => {
    const os = platform.os?.family;
    if (os === "OS X") setHref(audacityReleases.mac[0].browser_download_url);
    else if (os === "Windows")
      setHref(audacityReleases.win[0].browser_download_url);
  }, []);

  return (
    <p className="not-prose my-6">
      <a
        href={href}
        onClick={() => {
          if (href !== "/download") {
            trackEvent(
              "Download Button",
              "Download Audacity",
              "Download Audacity button (manual)",
            );
          }
        }}
        className="inline-flex items-center gap-2 rounded-full bg-blue-700 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-blue-800"
      >
        <span className="icon icon-import icon-medium" aria-hidden="true" />
        Download Audacity
      </a>
    </p>
  );
}
