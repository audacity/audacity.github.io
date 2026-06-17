import React from "react";

function MuseHub() {
  return (
    <section className="bg-background-dark px-6 lg:px-10 py-24 lg:py-32">
      <div className="max-w-screen-xl mx-auto">
        <header className="max-w-3xl">
          <h2 className="font-symphony text-text-contrast text-5xl md:text-6xl lg:text-7xl leading-[1.05]">
            And even more from MuseHub
          </h2>
          <p className="mt-6 text-text-contrast/70 text-base md:text-lg">
            Two-up: Get effects window
          </p>
        </header>

        <div className="mt-12 lg:mt-16 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <div
            className="aspect-video rounded-2xl border border-white/10 bg-white/5"
            aria-hidden
          />
          <div
            className="aspect-video rounded-2xl border border-white/10 bg-white/5"
            aria-hidden
          />
        </div>
      </div>
    </section>
  );
}

export default MuseHub;
