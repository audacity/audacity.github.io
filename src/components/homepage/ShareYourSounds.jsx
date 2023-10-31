import React, { useState } from "react";
import AudioDotComLogo from "../../assets/img/audio-dot-com.svg";
import VideoPlaceholder from "../../assets/img/audiocom-placeholder.webp";

function ShareYourSounds() {
  const [isClicked, setIsClicked] = useState(false);

  function handleVideoClick() {
    setIsClicked(true);
  }

  return (
    <section className="bg-[url('../assets/img/audiocom-background.webp')] bg-cover">
      <div className="max-w-screen-xl mx-6 sm:mx-12 md:mx-16 xl:mx-auto py-12 grid grid-cols-12 gap-y-12 md:gap-12">
        <div className="col-span-12 md:col-span-6 md:col-start-7 flex flex-col gap-8 lg:py-12">
          <img src={AudioDotComLogo.src} className="w-20" alt="audio.com" />
          <div>
            <h2 className="text-white">
              Get free web space for your audio files
            </h2>
            <p className="text-gray-300 mt-4">
              Host and share your audio instantly using our sister service
              <a className="dark-hyperlink ml-1" href="https://audio.com">
                audio.com
              </a>
              .
            </p>
          </div>
          <a
            href="https://audio.com/auth/sign-up"
            className="px-4 py-2 bg-blue-700 w-fit text-white rounded hover:bg-blue-600"
          >
            Join for free
          </a>
        </div>

        <div className="col-span-12 md:col-start-1 md:col-span-6 md:row-start-1 items-center flex">
          {isClicked ? (
            <iframe
              className="w-full aspect-video rounded-md shadow-xl"
              loading="lazy"
              src="https://www.youtube-nocookie.com/embed/-rBOZ9Bi4rk?autoplay=1"
              title="Introducing Audio.com"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen
            ></iframe>
          ) : (
            <img
              tabIndex="0"
              src={VideoPlaceholder.src}
              alt="YouTube thumbnail"
              className="w-full aspect-video rounded-md shadow-xl"
              onClick={() => handleVideoClick()}
              onKeyDown={(e) => e.key === "Enter" && handleVideoClick()}
            />
          )}
        </div>
      </div>
    </section>
  );
}

export default ShareYourSounds;
