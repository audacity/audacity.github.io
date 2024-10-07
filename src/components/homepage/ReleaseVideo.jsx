import React, { useState } from "react";
import VideoPlaceholder from "../../assets/img/audacity-placeholder.webp";

function ReleaseVideo() {
  const [isClicked, setIsClicked] = useState(false);

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

  return (
    <section className="max-w-screen-xl mx-auto my-12">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-900 rounded-md text-white">
          {/* <div className="flex flex-col">
            <h2 className="text-white">
              Produce music. Produce podcasts. Take total control of your sound.
            </h2>
            <a
              href="https://support.audacityteam.org/additional-resources/changelog"
              target="_blank"
            >
              <p className="dark-hyperlink">More about our new release</p>
            </a>
          </div> */}
          <div>
            {isClicked ? (
              <iframe
                className="w-full aspect-video rounded-md shadow-xl"
                loading="lazy"
                src="https://www.youtube-nocookie.com/embed/f5TXPUOFH6A?autoplay=1"
                title="Audacity 3.2 - Real-Time Effects and Free Cloud Sharing"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            ) : (
              <img
                tabIndex="0"
                src={VideoPlaceholder.src}
                alt="YouTube thumbnail"
                className="w-full aspect-video rounded-md shadow-xl cursor-pointer"
                onClick={() => handleVideoClick()}
                onKeyDown={(e) => e.key === "Enter" && handleVideoClick()}
              />
            )}
          </div>
        </div>
        <div className="bg-gray-900 rounded-md text-white">
          <div>
            {isClicked ? (
              <iframe
                className="w-full aspect-video rounded-md shadow-xl"
                loading="lazy"
                src="https://www.youtube-nocookie.com/embed/f5TXPUOFH6A?autoplay=1"
                title="Audacity 3.2 - Real-Time Effects and Free Cloud Sharing"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            ) : (
              <img
                tabIndex="0"
                src={VideoPlaceholder.src}
                alt="YouTube thumbnail"
                className="w-full aspect-video rounded-md shadow-xl cursor-pointer"
                onClick={() => handleVideoClick()}
                onKeyDown={(e) => e.key === "Enter" && handleVideoClick()}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ReleaseVideo;
