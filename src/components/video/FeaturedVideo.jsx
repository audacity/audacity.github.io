import React, { useState } from "react";

function FeaturedVideo(props) {
  const [isClicked, setIsClicked] = useState(false);

  const { placeholderImage, videoURL, label, title, CTA, ctaText, ctaURL = "" } = props;

  function handleVideoClick() {
    setIsClicked(true);
    if (typeof _paq !== "undefined") {
      _paq.push([
        "trackEvent",
        "Video embed",
        "Watch release video",
        "Audacity release video",
      ]);
    }
  }
  function handleCTAClick() {
    if (typeof _paq !== "undefined") {
      _paq.push([
        "trackEvent",
        "Promo CTA",
        "Promo CTA video button",
        "Ace Studio",
      ]);
    }
  }

  return (
    <div className="flex flex-col gap-2 lg:gap-4 ">
      <div className="flex flex-col xs:flex-row xs:justify-between md:h-10">
        <h3 className="text-white content-center">{title}</h3>
        {CTA && (
          <a className="py-3 px-2 rounded-md justify-center bg-yellow-300 hover:bg-yellow-400 active:bg-yellow-500 w-fit" href={ctaURL} onclick={() => handleVideoClick()}>
            <p className="leading-none font-semibold">{ctaText}</p>
          </a>
        )}
      </div>

      {isClicked ? (
        <iframe
          className="w-full aspect-video rounded-md shadow-xl"
          loading="lazy"
          src={videoURL}
          title="Audacity 3.2 - Real-Time Effects and Free Cloud Sharing"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        ></iframe>
      ) : (
        <img
          tabIndex="0"
          src={placeholderImage.src}
          alt="YouTube thumbnail"
          className="w-full aspect-video rounded-md shadow-xl cursor-pointer"
          onClick={() => handleVideoClick()}
          onKeyDown={(e) => e.key === "Enter" && handleVideoClick()}
        />
      )}
      <p className="text-white">{label}</p>
    </div>
  );
}

export default FeaturedVideo;
