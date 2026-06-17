import React from "react";

function Reassurance() {
  return (
    <section className="bg-background-dark px-6 lg:px-10 py-24 lg:py-32">
      <div className="max-w-screen-xl mx-auto">
        <header className="max-w-4xl">
          <h2 className="font-symphony text-text-contrast text-5xl md:text-6xl lg:text-7xl leading-[1.05]">
            The Audacity DNA that you know and love.
          </h2>
          <p className="mt-6 text-text-contrast/70 text-base md:text-lg">
            The waveform style you're used to, the tool layout you had set up,
            the clip colours you got used to — all still there. Audacity 4 is
            bigger than Audacity 3, but nothing about that has to land on day
            one. Open it up, find the things you remember, take the rest at your
            own pace.
          </p>
        </header>

        <div className="mt-12 lg:mt-16 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <div
            className="aspect-[4/3] rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center"
            aria-hidden
          >
            <span className="text-text-contrast/30 font-muse-sans text-sm tracking-[0.2em] uppercase">
              Classic clips
            </span>
          </div>
          <div
            className="aspect-[4/3] rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center"
            aria-hidden
          >
            <span className="text-text-contrast/30 font-muse-sans text-sm tracking-[0.2em] uppercase">
              Familiar toolbar layout
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Reassurance;
