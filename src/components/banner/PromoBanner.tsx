import { museHubReleases } from "../../assets/js/releaseData";
import "../../styles/icons.css";
import useBrowserOS from "../../hooks/useDetectOS";

function PromoBanner() {
  // no promo atm
  return false;

  const browserOS = useBrowserOS();

  const getHref = () => {
    if (browserOS === "OS X" || browserOS === "Windows") {
      return "https://www.musehub.com/app/ace-studio?utm_source=au-web&utm_medium=mh-app-cta&utm_campaign=au-web-mh-app-ace-studio";
    } else {
      return "#"; // Default if OS is not supported
    }
  };

  // Only show the banner for supported OSes
  const showBanner = browserOS === "OS X" || browserOS === "Windows";

  function handleButtonClick() {
    if (typeof _paq !== "undefined") {
      _paq.push([
        "trackEvent",
        "Promo CTA",
        "Promo CTA button",
        "Ace Studio Muse Hub",
      ]);
    }
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
            Ace Studio - The World's No.1 AI Singing Voice Generator  
            </p>
          </div>

          <a
            href={getHref()}
            id="promo-button"
            onClick={handleButtonClick}
            className="flex text-lg font-bold h-8 justify-center items-center px-4 border-2 border-gray-900 bg-gray-900 rounded-md hover:bg-yellow-300 text-white hover:text-gray-900 hover:border-gray-900"
          >
            Try For Free
          </a>
        </div>
      )}
    </>
  );
}

export default PromoBanner;
