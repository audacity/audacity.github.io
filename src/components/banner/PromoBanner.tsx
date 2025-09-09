import { museHubReleases } from "../../assets/js/releaseData";
import "../../styles/icons.css";
import useBrowserOS from "../../hooks/useDetectOS";
import { trackEvent } from "../../utils/matomo";

function PromoBanner() {
  // no promo atm
  //return false;

  const browserOS = useBrowserOS();

  // Only show the banner for supported OSes
  const showBanner = browserOS === "OS X" || browserOS === "Windows";

  const getHref = () => {
    if (showBanner) {
      return "https://www.musehub.com/plugin/ampknob-revc?utm_source=audacity&utm_medium=web&utm_campaign=auampknob-revc";
    } else {
      return "#"; // Default if OS is not supported
    }
  };


  function handleButtonClick() {
    trackEvent("Promo CTA", "Promo CTA button", "Ampknob Revc Muse Hub");
  }

  return (
    <>
      {showBanner && (
        <div
          id="promo-banner"
          className="flex flex-col lg:flex-row justify-center items-center align-start min-h-24 bg-yellow-300 py-2 gap-4 lg:gap-8"
        >
          <div className="lg:flex text-center gap-4">
            <p className="text-lg text-gray-900 font-bold">
              Heavy guitar tone in seconds. One knob, no distractions.
            </p>
          </div>

          <a
            href={getHref()}
            id="promo-button"
            onClick={handleButtonClick}
            className="flex text-lg font-bold h-8 justify-center items-center px-4 border-2 border-gray-900 bg-gray-900 rounded-md hover:bg-yellow-300 text-white hover:text-gray-900 hover:border-gray-900"
          >
            Try for free
          </a>
        </div>
      )}
    </>
  );
}

export default PromoBanner;
