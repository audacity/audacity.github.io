import React, { useState } from "react";
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

  const [copied, setCopied] = useState(false);
  const [showChecksum, setShowChecksum] = useState(false);

  /*
    A SHA-256 is never read, it's compared — so the useful affordance is
    copying it. The toggle keeps the word "checksum": anyone who wants one
    is looking for that word, and describing it only by its purpose leaves
    them nothing to scan for.
  */
  async function copyChecksum() {
    try {
      await navigator.clipboard.writeText(checksum);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked (insecure context, denied permission) — the hash
         stays selectable, so this degrades to selecting it by hand. */
    }
  }

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
    <div className="rounded-xl border border-text-primary/15 bg-white px-6 py-5">
      {/*
        The checksum toggle sits under the title inside the row. As its own
        full-width band with a rule it gave one short line the weight of a
        section, and left an empty gap across the card.
      */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="text-20 font-semibold text-text-primary">{title}</h2>

          {title.includes("ARM64") && (
            <p className="text-14 text-text-primary/60">
              No plugin support.{" "}
              <a
                href="#arm"
                className="text-accent underline underline-offset-2"
              >
                More info
              </a>
            </p>
          )}

          {checksum && (
            <button
              type="button"
              onClick={() => setShowChecksum((v) => !v)}
              aria-expanded={showChecksum}
              aria-controls={`checksum-${title.replace(/\W+/g, "-")}`}
              className="flex w-fit items-center gap-1.5 text-14 text-text-primary/50 transition-colors hover:text-accent"
            >
              <span
                className={`icon icon-caret-right transition-transform ${
                  showChecksum ? "rotate-90" : ""
                }`}
              />
              {/* the shared label ships with a trailing colon */}
              {(checksumLabel ?? "Checksum").replace(/:\s*$/, "")} (SHA-256)
            </button>
          )}
        </div>

        <a
          onClick={() => {
            handleDownloadButtonClick();
          }}
          href={downloadURL}
          className="flex h-12 w-full shrink-0 items-center justify-center rounded-full border border-accent px-6 text-16 font-semibold text-accent transition-colors hover:bg-accent hover:text-white sm:w-fit"
        >
          {downloadLabel ?? "Download"}
        </a>
      </div>

      {/*
        Animating grid-template-rows from 0fr to 1fr opens to the content's
        own height — no max-height guess that clips a long hash or lands
        short. The row stays mounted so there's something to transition, and
        aria-controls points the toggle at it.
      */}
      {checksum && (
        <div
          id={`checksum-${title.replace(/\W+/g, "-")}`}
          className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${
            showChecksum ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            <div className="mt-4 flex items-start gap-2 border-t border-text-primary/10 pt-4">
              <code className="min-w-0 flex-1 select-all break-all rounded border border-text-primary/10 bg-background-light px-2 py-1.5 font-mono text-12 leading-snug text-text-primary/70">
                {checksum}
              </code>
              <button
                type="button"
                onClick={copyChecksum}
                tabIndex={showChecksum ? 0 : -1}
                className="shrink-0 rounded-full border border-accent px-3 py-1.5 text-12 font-semibold text-accent transition-colors hover:bg-accent hover:text-white"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DownloadCard;
