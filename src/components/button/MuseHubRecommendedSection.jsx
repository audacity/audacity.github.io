import { useExperiment } from "../../hooks/useExperiment";
import { trackBinaryDownloadChoice, trackEvent } from "../../utils/matomo";

function MuseHubRecommendedSection({ museHubReleaseData, OS }) {
  const { variant, isReady } = useExperiment("musehub-download");

  if (!isReady) {
    return null;
  }

  if (variant === "direct-download") {
    return null;
  }

  function onClickButtonHandler() {
    trackEvent(
      "Download Button",
      "Download MuseHub",
      `Download MuseHub button ${OS}`,
    );
    trackBinaryDownloadChoice({
      os: OS,
      releaseName: museHubReleaseData[0].name,
      url: museHubReleaseData[0].browser_download_url,
      source: "download-page-musehub-recommendation",
    });

    setTimeout(() => {
      window.location.href = "/post-download";
    }, 2000);
  }

  return (
    <section className="mx-4 sm:mx-12 mb-4">
      <div className="rounded-xl border-2 border-accent bg-white p-6">
        <div className="flex flex-col sm:flex-row gap-2 justify-between items-center">
          <div className="flex-col gap-2">
            <h2 className="text-20 font-semibold text-text-primary">
              Audacity installer (recommended)
            </h2>
            <p>via MuseHub</p>
          </div>

          <a
            onClick={onClickButtonHandler}
            href={museHubReleaseData[0].browser_download_url}
            className="flex h-12 w-full items-center justify-center rounded-full bg-accent px-6 text-16 font-semibold text-white transition-opacity hover:opacity-90 sm:w-fit"
          >
            Download
          </a>
        </div>
      </div>
    </section>
  );
}

export default MuseHubRecommendedSection;
