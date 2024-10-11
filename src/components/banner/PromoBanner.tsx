import { museHubReleases } from "../../assets/js/releaseData";
import "../../styles/icons.css";
import useBrowserOS from "../../hooks/useDetectOS";

function PromoBanner() {
  const browserOS = useBrowserOS();

  const getHref = () => {
    if (browserOS === "OS X") {
      return museHubReleases.mac[0].browser_download_url;
    } else if (browserOS === "Windows") {
      return museHubReleases.win[0].browser_download_url;
    }
    return "#"; // Default if OS is not supported
  };

  // Only show the banner for supported OSes
  const showBanner = browserOS === "OS X" || browserOS === "Windows";

  function handleButtonClick() {
    if (typeof _paq !== "undefined") {
      _paq.push([
        "trackEvent",
        "Promo CTA",
        "Promo CTA button",
        "Muse hub promo CTA",
      ]);
    }
  }

  return (
    <>
      {showBanner && (
        <div
          id="promo-banner"
          className="flex flex-col lg:flex-row justify-center items-center min-h-24 bg-yellow-300 py-4 gap-4 lg:gap-8"
        >
          <div className="lg:flex text-center">
            <p className="text-lg text-gray-900">🔥Limited-Time Offer: 80% OFF</p>
            <p className="text-lg text-gray-900 font-bold">
              Polyspectral MBC Multiband Compressor! Now $9.99🔥
            </p>
          </div>

          <a
            href={getHref()}
            id="promo-button"
            onClick={handleButtonClick}
            className="flex text-lg font-bold h-12 justify-center items-center px-4 border-2 border-gray-900 rounded-md hover:bg-gray-900 hover:text-white"
          >
            Get it on the Muse Hub
          </a>
        </div>
      )}
    </>
  );
}

export default PromoBanner;