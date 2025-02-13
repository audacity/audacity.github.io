import React, { useState } from "react";

function FeaturedVideo(props) {
  const [isClicked, setIsClicked] = useState(false);

  const {
    placeholderImage,
    videoURL,
    label,
    title,
    CTA,
    ctaText,
    ctaURL = "",
  } = props;

  function handleVideoClick() {
    setIsClicked(true);
    if (typeof _paq !== "undefined") {
      _paq.push(["trackEvent", "Video embed", "Watch release video", title]);
    }
  }
  function handleCTAClick() {
    if (typeof _paq !== "undefined") {
      _paq.push(["trackEvent", "Promo CTA", "Promo CTA video button", ctaText]);
    }
  }

  return (
    <div className="flex flex-col">
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
      <div class="flex flex-col mt-2">
      <h4 className="text-white content-center">{title}</h4>
      <p className="text-gray-200">{label}</p>
      {CTA && (
        <a
          className="mt-4"
          href={ctaURL}
          onClick={() => handleCTAClick()}
        >
          <p className="leading-none underline text-yellow-300">{ctaText}</p>
        </a>
      )}
      </div>
    </div>
  );
}

export default FeaturedVideo;
