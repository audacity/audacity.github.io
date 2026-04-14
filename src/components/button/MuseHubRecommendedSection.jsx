import { useExperiment } from "../../hooks/useExperiment";
import { trackEvent } from "../../utils/matomo";

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

    setTimeout(() => {
      window.location.href = "/post-download";
    }, 2000);
  }

  return (
    <section className="mx-4 sm:mx-12 mb-4">
      <div className="border border-bg-200 rounded-md p-6">
        <div className="flex flex-col sm:flex-row gap-2 justify-between items-center">
          <div className="flex-col gap-2">
            <h2 className="text-xl font-semibold">
              Audacity installer (recommended)
            </h2>
            <p>via MuseHub</p>
          </div>

          <a
            onClick={onClickButtonHandler}
            href={museHubReleaseData[0].browser_download_url}
            className="flex justify-center text-center items-center px-4 h-12 w-full sm:w-fit bg-blue-700 hover:bg-blue-600 text-base text-white rounded"
          >
            Download
          </a>
        </div>
      </div>
    </section>
  );
}

export default MuseHubRecommendedSection;
