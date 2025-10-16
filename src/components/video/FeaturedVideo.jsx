import React, { useState } from "react";
import { trackEvent } from "../../utils/matomo";
import ytLogo from "../../assets/img/yt.svg"

function FeaturedVideo(props) {
  const [isClicked, setIsClicked] = useState(false);

  const {
    placeholderImage,
    imageAltText,
    videoURL,
    label,
    title,
    CTA,
    ctaText,
    ctaURL = "",
    textColor = "text-slate-900",
    matomoEventName,
  } = props;

  function handleVideoClick() {
    setIsClicked(true);
    trackEvent("Video embed", "Watch release video", matomoEventName);
  }
  function handleCTAClick() {
    trackEvent("Promo CTA", "Promo CTA video button", ctaText);
  }

  return (
    <div className="flex flex-col gap-2 lg:gap-4 w-full">
      {title && (
        <div className="flex flex-col xs:flex-row xs:justify-between md:h-10">
          <h3 className={`content-center ${textColor}`}>{title}</h3>
          {CTA && (
            <a
              className="py-2 px-4 rounded-full justify-center bg-accent text-white hover:opacity-90 transition-opacity w-fit font-semibold"
              href={ctaURL}
              onClick={() => handleCTAClick()}
            >
              {ctaText}
            </a>
          )}
        </div>
      )}

      {isClicked ? (
        <iframe
          className="w-full aspect-video rounded-md shadow-xl"
          loading="lazy"
          src={videoURL}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        ></iframe>
      ) : (
        <div className="thumbnail-container grid grid-cols-1 grid-rows-1 place-items-center [grid-template-areas:'main']">
        <img
          tabIndex="0"
          src={placeholderImage}
          alt={imageAltText}
          className="w-full aspect-video rounded-md shadow-xl cursor-pointer [grid-area:main]"
          onClick={() => handleVideoClick()}
          onKeyDown={(e) => e.key === "Enter" && handleVideoClick()}
        />
        <img src={ytLogo.src} alt="YouTube logo" className="yt-logo w-24 h-24 [grid-area:main] pointer-events-none" />
        </div>
      )}
      {label && <p className={`${textColor}`}>{label}</p>}
    </div>
  );
}

export default FeaturedVideo;
