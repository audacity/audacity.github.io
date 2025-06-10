import { museHubReleases } from "../../assets/js/releaseData";
import "../../styles/icons.css";
import useBrowserOS from "../../hooks/useDetectOS";
import { trackEvent } from "../../utils/matomo";

function PromoBanner() {
  // no promo atm
  //return false;

  const browserOS = useBrowserOS();

  const getHref = () => {
    if (browserOS === "OS X" || browserOS === "Windows") {
      return "https://www.musehub.com/plugin/playgrnd-fx?utm_source=au-web-banner-mh-web&utm_medium=playgrnd-fx&utm_campaign=au-web-banner-mh-web-playgrnd-fx&utm_id=au-web-banner";
    } else {
      return "#"; // Default if OS is not supported
    }
  };

  // Only show the banner for supported OSes
  const showBanner = browserOS === "OS X" || browserOS === "Windows";

  function handleButtonClick() {
    trackEvent("Promo CTA", "Promo CTA button", "Playgrnd Muse Hub");
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
              Access tons of fun and powerful plugins for music creators. 50% OFF!
            </p>
          </div>

          <a
            href={getHref()}
            id="promo-button"
            onClick={handleButtonClick}
            className="flex text-lg font-bold h-8 justify-center items-center px-4 border-2 border-gray-900 bg-gray-900 rounded-md hover:bg-yellow-300 text-white hover:text-gray-900 hover:border-gray-900"
          >
            Get it on MuseHub 
          </a>
        </div>
      )}
    </>
  );
}

export default PromoBanner;
