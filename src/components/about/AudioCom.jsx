import React from "react";

function AudioCom() {
  return (
    <section className="bg-background-dark px-6 lg:px-10 py-24 lg:py-32">
      <div className="max-w-screen-xl mx-auto">
        <header className="max-w-3xl">
          <h2 className="font-symphony text-text-contrast text-5xl md:text-6xl lg:text-7xl leading-[1.05]">
            Save to the cloud, share to the world.
          </h2>
          <p className="mt-6 text-text-contrast/70 text-base md:text-lg">
            Two-up: home screen with Cloud Projects tab beside the audio.com
            listing.
          </p>
        </header>

        <div className="mt-12 lg:mt-16 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <div
            className="aspect-video rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center"
            aria-hidden
          >
            <span className="text-text-contrast/30 font-muse-sans text-sm tracking-[0.2em] uppercase">
              Home screen on Cloud projects tab
            </span>
          </div>
          <div
            className="aspect-video rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center"
            aria-hidden
          >
            <span className="text-text-contrast/30 font-muse-sans text-sm tracking-[0.2em] uppercase">
              Audio.com listing
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AudioCom;
