import React from "react";
import DownloadMuseHubButton from "../button/DownloadMuseHubButton";
import DownloadButton from "../button/DownloadButton";

function CtaSection() {
  return (
    /*
      id="download": the sticky bar's button scrolls here instead of
      leaving the page, and it gives the section a shareable anchor.
    */
    <section
      id="download"
      className="bg-background-dark px-6 lg:px-10 py-28 lg:py-40"
    >
      <div className="max-w-screen-xl mx-auto text-center">
        <h2 className="font-harmony text-text-contrast text-5xl md:text-6xl lg:text-8xl leading-[1.02] max-w-4xl mx-auto">
          Free for all, forever
        </h2>
        <p className="mt-8 text-text-contrast/70 text-base md:text-lg max-w-2xl mx-auto">
          Audacity 4 is free, open source, and available for macOS, Windows, and
          Linux.
        </p>

        <div className="mt-10 lg:mt-12 flex flex-col items-center gap-5">
          {/*
            The same MuseHub-primary / direct-download-secondary pair as the
            homepage hero and the feature pages: per-OS installer links,
            Matomo download events and the /post-download hand-off all live
            in the shared button components. The wrapper keeps
            data-au4-download-cta so the page script's surface tracking and
            the sticky bar's show/hide geometry stay wired to this spot
            (clicks on either button bubble to it).
          */}
          <div
            data-au4-download-cta
            className="flex flex-col items-center gap-4 text-text-contrast"
          >
            <DownloadMuseHubButton />
            <DownloadButton />
          </div>
        </div>
      </div>
    </section>
  );
}

export default CtaSection;
