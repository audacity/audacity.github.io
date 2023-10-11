import React, { useState } from "react";
import VideoPlaceholder from "../../assets/img/audacity-placeholder.webp";

function ReleaseVideo() {
  const [isClicked, setIsClicked] = useState(false);

  function handleVideoClick() {
    setIsClicked(true);
    console.log("video clicked");
  }

  return (
    <section className="bg-gray-900">
      <div className="grid grid-cols-12 max-w-screen-xl mx-auto py-12 gap-y-4">
        <div className="flex flex-col gap-4 justify-center row-start-2 md:row-start-1 col-start-2 col-span-10 md:col-start-2 md:col-span-4">
          <h2 className="text-white">
            Produce music. Produce podcasts. Take total control of your sound.
          </h2>
          <a
            href="https://support.audacityteam.org/additional-resources/changelog"
            target="_blank"
          >
            <p className="dark-hyperlink">More about our new release</p>
          </a>
        </div>
        <div className="flex align-middle col-start-2 col-span-10 md:col-start-7 md:col-span-5">
            <iframe
              className="w-full aspect-video rounded-md shadow-xl"
              loading="lazy"
              src="https://www.youtube-nocookie.com/embed/DTRnDNR9LR8"
              title="Audacity 3.2 - Real-Time Effects and Free Cloud Sharing"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen
            ></iframe>
        </div>
      </div>
    </section>
  );
}

export default ReleaseVideo;
