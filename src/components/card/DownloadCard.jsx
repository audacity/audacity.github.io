import React from "react";
import { trackBinaryDownloadChoice, trackEvent } from "../../utils/matomo";

function DownloadCard(props) {
  const {
    OS,
    title,
    downloadURL,
    downloadType,
    checksum,
    downloadLabel,
    checksumLabel,
  } = props;

  function handleDownloadButtonClick() {
    trackEvent(
      "Download Button",
      "Download Audacity",
      `${OS + " " + title + " " + downloadType}`,
    );
    trackBinaryDownloadChoice({
      os: OS,
      releaseName: title,
      url: downloadURL,
      source: "download-page-card",
    });

    setTimeout(() => {
      window.location.href = "/post-download";
    }, 2000);
  }

  return (
    <div className="rounded-xl border border-text-primary/15 bg-white px-6 pb-5 pt-6">
      <div className="flex flex-col sm:flex-row gap-2 justify-between items-center">
        <h2 className="text-20 font-semibold text-text-primary">{title}</h2>
        {title.includes("ARM64") && (
          <p>
            No plugin support.{" "}
            <a href="#arm" className="hyperlink">
              More info
            </a>
          </p>
        )}
        <a
          onClick={() => {
            handleDownloadButtonClick();
          }}
          href={downloadURL}
          className="flex h-12 w-full items-center justify-center rounded-full border border-accent px-6 text-16 font-semibold text-accent transition-colors hover:bg-accent hover:text-white sm:w-fit"
        >
          {downloadLabel ?? "Download"}
        </a>
      </div>

      {checksum && (
        <details className="group mt-4 border-t border-text-primary/10 pt-3 [&:not([open])]:pb-0">
          <summary className="cursor-pointer list-none text-14 font-semibold text-text-primary/60 transition-colors hover:text-accent">
            {checksumLabel ?? "Checksum:"}
          </summary>
          <div className="mt-2 rounded border border-text-primary/10 bg-background-light p-2">
            <code className="block break-all font-mono text-12 leading-snug text-text-primary/70">
              {checksum}
            </code>
          </div>
        </details>
      )}
    </div>
  );
}

export default DownloadCard;
