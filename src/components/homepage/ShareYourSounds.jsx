import React, { useState } from "react";
import AudioDotComLogo from "../../assets/img/audio-dot-com.svg";
import VideoPlaceholder from '../../assets/img/audiocom-placeholder.webp'

function ShareYourSounds() {
  const [isClicked, setIsClicked] = useState(false);

  function handleVideoClick() {
    setIsClicked(true);
  }

  return (
    <section className="bg-[url('../assets/img/audiocom-background.webp')] bg-cover">
      <div className="max-w-screen-xl mx-6 sm:mx-12 md:mx-16 xl:mx-auto py-12 grid gap-12 lg:grid-cols-12">
        <div className="flex flex-col gap-8 lg:col-span-6 lg:col-start-7 lg:py-12">
          <img src={AudioDotComLogo.src} className="w-20" alt="audio.com" />
          <div>
            <h2 className="text-white">Get free web space for your audio files</h2>
            <p className="text-gray-300 mt-4">
              Host and share your audio instantly using our sister service
              <a className="dark-hyperlink" href="https://audio.com">
                audio.com
              </a>
              .
            </p>
          </div>
          <a
            href="https://audio.com"
            className="px-4 py-2 bg-blue-700 w-fit text-white rounded hover:bg-blue-600"
          >
            Join for free
          </a>
        </div>

        <div className="lg:col-start-1 lg:col-span-6 lg:row-start-1 items-center flex">
          {isClicked ? (
            <iframe
              className="w-full aspect-video rounded-md shadow-xl"
              loading="lazy"
              src="https://www.youtube-nocookie.com/embed/-rBOZ9Bi4rk"
              title="Introducing Audio.com"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen
            ></iframe>
          ) : (
            <img
              src={VideoPlaceholder.src}
              alt="YouTube thumbnail"
              className="w-full aspect-video rounded-md shadow-xl"
              onClick={() => handleVideoClick()}
            />
          )}
        </div>
      </div>
    </section>
  );
}

export default ShareYourSounds;
