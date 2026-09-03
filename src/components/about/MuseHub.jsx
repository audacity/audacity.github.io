import React from "react";
import { useEntrance } from "../../hooks/useEntrance.js";

const PANELS = [
  {
    id: "effects",
    eyebrow: "Get Effects",
    title: "Browse everything we've got",
    description:
      "Get Effects lists everything available from MuseHub, sorted by category.",
  },
  {
    id: "plugin",
    eyebrow: "Smooth and simple",
    title: "Runs right in Audacity",
    description:
      "MuseHub effects sit in the same effect chain as Audacity's built-in ones. Couldn't be simpler.",
  },
];

function MuseHubPanel({ panel, idx, src }) {
  const entrance = useEntrance({ delayMs: 120 + idx * 110 });
  return (
    <article
      ref={entrance.ref}
      className="flex flex-col"
      style={entrance.style}
    >
      <div className="rounded-lg border border-white/10 bg-white/[0.03] overflow-hidden">
        <img
          src={src}
          alt={`${panel.title} — ${panel.eyebrow}`}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="block w-full h-auto"
        />
      </div>
      <div className="mt-6">
        <div
          className="font-mono text-xs tracking-[0.3em] uppercase text-text-contrast/40"
          aria-hidden
        >
          {panel.eyebrow}
        </div>
        <h3 className="mt-3 font-sans font-semibold text-text-contrast text-xl md:text-2xl leading-tight">
          {panel.title}
        </h3>
        <p className="mt-3 text-text-contrast/65 text-base leading-relaxed max-w-md">
          {panel.description}
        </p>
      </div>
    </article>
  );
}

function MuseHub({ images = {} }) {
  const headerEntrance = useEntrance();
  return (
    <section className="bg-background-dark px-6 lg:px-10 py-24 lg:py-32">
      <div className="max-w-[1600px] mx-auto w-full">
        <header
          ref={headerEntrance.ref}
          className="max-w-3xl"
          style={headerEntrance.style}
        >
          <h2 className="font-harmony text-text-contrast text-5xl md:text-6xl lg:text-7xl leading-[1.05]">
            More from MuseHub
          </h2>
          <p className="mt-6 text-text-contrast/70 text-base md:text-lg">
            Open "Get Effects" to browse thousands of plugins, samples, and
            oneshots from MuseHub. Including free and paid options.
          </p>
        </header>

        <div className="mt-12 lg:mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {PANELS.map((panel, idx) => (
            <MuseHubPanel
              key={panel.id}
              panel={panel}
              src={images[panel.id]}
              idx={idx}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default MuseHub;
