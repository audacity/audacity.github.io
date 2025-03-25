import React, { useState } from "react";
import { trackEvent } from "../../utils/matomo";

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
    <div className="flex flex-col gap-2 lg:gap-4 ">
      {title && (
        <div className="flex flex-col xs:flex-row xs:justify-between md:h-10">
          <h3 className={`content-center ${textColor}`}>{title}</h3>
          {CTA && (
            <a
              className="py-3 px-4 rounded-md justify-center bg-yellow-300 hover:bg-yellow-400 active:bg-yellow-500 w-fit"
              href={ctaURL}
              onClick={() => handleCTAClick()}
            >
              <p className={`text-slate-900 leading-none font-semibold`}>
                {ctaText}
              </p>
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
        <img
          tabIndex="0"
          src={placeholderImage}
          alt={imageAltText}
          className="w-full aspect-video rounded-md shadow-xl cursor-pointer"
          onClick={() => handleVideoClick()}
          onKeyDown={(e) => e.key === "Enter" && handleVideoClick()}
        />
      )}
      {label && <p className={`${textColor}`}>{label}</p>}
    </div>
  );
}

export default FeaturedVideo;
