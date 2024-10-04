import "../../styles/icons.css";
declare interface Props {
  url: string;
}

function PromoBanner({ url }: Props) {
  //no promo running
  //return null;

  function handleButtonClick() {
    if (typeof _paq !== "undefined") {
      _paq.push([
        "trackEvent",
        "Promo CTA",
        "Promo CTA button",
        "Go to Survey",
      ]);
    }
  }

  return (
      <div
        id="promo-banner"
        className="flex items-center justify-center min-h-24 bg-yellow-300 gap-4 flex-wrap"
      >
        <div className="flex gap-2 flex-wrap my-4 mx-2">
          <p className="text-lg text-gray-900">🔥Limited-Time Offer: 80% OFF</p>
          <p className="text-lg text-gray-900 font-bold">
            Polyspectral MBC Multiband Compressor! Now $9.99🔥
          </p>
        </div>
        <a
          href="https://musehub.com/?mtm_campaign=audacityteam&mtm_content=bannerad"
          id="promo-button"
          onClick={handleButtonClick}
          className="flex text-lg font-bold h-12 my-4 justify-center items-center px-4 border-2 border-gray-900 rounded-md hover:bg-gray-900 hover:text-white"
        >
          Get it on the Muse Hub
        </a>
      </div>
  );
}

export default PromoBanner;
