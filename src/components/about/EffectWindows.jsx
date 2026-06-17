import React from "react";
import { Carousel } from "@dilsonspickles/components";

const EFFECTS = [
  { id: "compressor", name: "Compressor" },
  { id: "equalizer", name: "Equalizer" },
  { id: "reverb", name: "Reverb" },
  { id: "noise-reduction", name: "Noise Reduction" },
  { id: "limiter", name: "Limiter" },
  { id: "delay", name: "Delay" },
];

function Slide({ effect }) {
  return (
    <div className="px-4 lg:px-8 py-6">
      <div
        className="aspect-video w-full rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center"
        aria-hidden
      >
        <span className="text-text-contrast/30 font-muse-sans text-sm tracking-[0.2em] uppercase">
          {effect.name}
        </span>
      </div>
      <div className="mt-6 text-center">
        <h3 className="font-symphony text-text-contrast text-3xl md:text-4xl leading-tight">
          {effect.name}
        </h3>
      </div>
    </div>
  );
}

function EffectWindows() {
  return (
    <section className="bg-background-dark px-6 lg:px-10 py-24 lg:py-32">
      <div className="max-w-screen-xl mx-auto">
        <header className="max-w-3xl">
          <h2 className="font-symphony text-text-contrast text-5xl md:text-6xl lg:text-7xl leading-[1.05]">
            Effects, redesigned
          </h2>
          <p className="mt-6 text-text-contrast/70 text-base md:text-lg">
            Every built-in effect now lives in a focused window — clear
            controls, real-time preview, and the same vocabulary across the
            whole suite.
          </p>
        </header>

        <div className="mt-12 lg:mt-16">
          <Carousel showArrows showDots>
            {EFFECTS.map((effect) => (
              <Slide key={effect.id} effect={effect} />
            ))}
          </Carousel>
        </div>
      </div>
    </section>
  );
}

export default EffectWindows;
