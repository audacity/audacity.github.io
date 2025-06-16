import { museHubReleases } from "../../assets/js/releaseData";
import "../../styles/icons.css";
import useBrowserOS from "../../hooks/useDetectOS";
import { trackEvent } from "../../utils/matomo";

function PromoBanner() {
  // no promo atm
  //return false;

  const browserOS = useBrowserOS();

  // Only show the banner for supported OSes
  // const showBanner = browserOS === "OS X" || browserOS === "Windows";
  const showBanner = true; // For merch, always show the banner

  const getHref = () => {
    if (showBanner) {
      return "https://merch.audacityteam.org/?utm_source=audacitywebsite&utm_medium=promo&utm_campaign=merch";
    } else {
      return "#"; // Default if OS is not supported
    }
  };


  function handleButtonClick() {
    trackEvent("Promo CTA", "Promo CTA button", "Audacity merch CTA");
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
              Show your support for Audacity with merch! 
            </p>
          </div>

          <a
            href={getHref()}
            id="promo-button"
            onClick={handleButtonClick}
            className="flex text-lg font-bold h-8 justify-center items-center px-4 border-2 border-gray-900 bg-gray-900 rounded-md hover:bg-yellow-300 text-white hover:text-gray-900 hover:border-gray-900"
          >
            Shop  now
          </a>
        </div>
      )}
    </>
  );
}

export default PromoBanner;
