import React, { useState, useEffect } from "react";
import { museHubReleases, audacityReleases } from "../../assets/js/releaseData";
import "../../styles/icons.css";
import DownloadMuseHubButton from "../button/DownloadMuseHubButton";
import platform from "platform";
declare interface Props {
  url: string;
}

function PromoBanner({ url }: Props) {
  //no promo running
  //return null;
  const [showBanner, setShowBanner] = useState(true);

  function getHref() {
    switch(platform.os.family){
      case "OS X":
        return museHubReleases.mac[0].browser_download_url;
      case "Windows":
        return museHubReleases.win[0].browser_download_url;
      default: 
        setShowBanner(false); return "#";
    }
  }

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

  return ( <> { showBanner &&
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
          href={getHref()}
          id="promo-button"
          onClick={handleButtonClick}
          className="flex text-lg font-bold h-12 my-4 justify-center items-center px-4 border-2 border-gray-900 rounded-md hover:bg-gray-900 hover:text-white"
        >
          Get it on the Muse Hub
        </a>
      </div>
    } </>
  );
}

export default PromoBanner;
