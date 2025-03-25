import React, { useState } from "react";
import { trackEvent } from "../../utils/matomo";

function FeaturedVideo(props) {
  const [isClicked, setIsClicked] = useState(false);

  const {
    placeholderImages,
    placeholderImage, // For backward compatibility
    videoURL,
    label,
    title,
    imageAltText,
    dimensions,
    CTA,
    ctaText,
    ctaURL = "",
    textColor = "text-slate-900",
    matomoEventName,
  } = props;

  function handleVideoClick() {
    setIsClicked(true);
    trackEvent("Video embed", "Watch video", matomoEventName || title);
  }

  function handleCTAClick() {
    trackEvent("Promo CTA", "Promo CTA video button", ctaText);
  }

  // Render the optimized responsive image with picture element
  function renderThumbnail() {
    // Check if we're using the new optimized structure or the legacy format
    const isOptimizedFormat = placeholderImages && 
                             placeholderImages.avif && 
                             placeholderImages.webp;
    
    // If using the legacy format, render a simple image
    if (!isOptimizedFormat) {
      return (
        <img
          tabIndex="0"
          src={placeholderImage}
          alt={imageAltText || "Video thumbnail"}
          className="w-full aspect-video rounded-md shadow-xl cursor-pointer"
          width={dimensions?.width || 732}
          height={dimensions?.height || 412}
          loading="lazy" 
          decoding="async"
          onClick={() => handleVideoClick()}
          onKeyDown={(e) => e.key === "Enter" && handleVideoClick()}
        />
      );
    }
    
    // Otherwise use the optimized picture element with multiple formats
    return (
      <picture>
        {/* AVIF format - best compression, newer browsers */}
        <source
          media="(min-width: 768px)"
          srcSet={placeholderImages.avif.default}
          type="image/avif"
        />
        <source
          media="(max-width: 767px)"
          srcSet={placeholderImages.avif.mobile}
          type="image/avif"
        />
        
        {/* WebP format - good compression, wider support */}
        <source
          media="(min-width: 768px)"
          srcSet={placeholderImages.webp.default}
          type="image/webp"
        />
        <source
          media="(max-width: 767px)"
          srcSet={placeholderImages.webp.mobile}
          type="image/webp"
        />
        
        {/* Fallback image */}
        <img
          tabIndex="0"
          src={placeholderImages.webp.default}
          alt={imageAltText || "Video thumbnail"}
          className="w-full aspect-video rounded-md shadow-xl cursor-pointer"
          width={dimensions?.width || 732}
          height={dimensions?.height || 412}
          loading="lazy" 
          decoding="async"
          onClick={() => handleVideoClick()}
          onKeyDown={(e) => e.key === "Enter" && handleVideoClick()}
        />
      </picture>
    );
  }

  return (
    <div className="flex flex-col gap-2 lg:gap-4">
      <div className="flex flex-col xs:flex-row xs:justify-between md:h-10">
        <h3 className={`${textColor} content-center`}>{title}</h3>
        {CTA && (
          <a
            className="py-3 px-4 rounded-md justify-center bg-yellow-300 hover:bg-yellow-400 active:bg-yellow-500 w-fit"
            href={ctaURL}
            onClick={() => handleCTAClick()}
          >
            <p className="text-slate-900 leading-none font-semibold">{ctaText}</p>
          </a>
        )}
      </div>

      {isClicked ? (
        <iframe
          className="w-full aspect-video rounded-md shadow-xl"
          loading="lazy"
          src={videoURL}
          title={title}
          width={dimensions?.width || 732}
          height={dimensions?.height || 412}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        ></iframe>
      ) : (
        renderThumbnail()
      )}
      <p className={textColor}>{label}</p>
    </div>
  );
}

export default FeaturedVideo;