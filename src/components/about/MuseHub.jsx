import React from "react";
import { useEntrance } from "../../hooks/useEntrance.js";

const PANELS = [
  {
    id: "effects",
    image: "/museHub/MuseHub_effects.png",
    eyebrow: "Get Effects",
    title: "Get Effects opens MuseHub",
    description:
      "MuseHub opens with plugins, samples, and oneshots, free and paid, all in one place.",
  },
  {
    id: "plugin",
    image: "/museHub/MuseHub_plugin.png",
    eyebrow: "Background install",
    title: "Keep working while it installs",
    description:
      "Choose a plugin in MuseHub and it installs in the background. Switch back to Audacity and it's ready in your effect chain once it's done. No restart needed.",
  },
];

function MuseHubPanel({ panel, idx }) {
  const entrance = useEntrance({ delayMs: 120 + idx * 110 });
  return (
    <article
      ref={entrance.ref}
      className="flex flex-col"
      style={entrance.style}
    >
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
        <img
          src={panel.image}
          alt={`${panel.title} — ${panel.eyebrow}`}
          loading="lazy"
          decoding="async"
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

function MuseHub() {
  const headerEntrance = useEntrance();
  return (
    <section className="bg-background-dark px-6 lg:px-10 py-24 lg:py-32">
      <div className="max-w-screen-xl mx-auto">
        <header
          ref={headerEntrance.ref}
          className="max-w-3xl"
          style={headerEntrance.style}
        >
          <h2 className="font-harmony text-text-contrast text-5xl md:text-6xl lg:text-7xl leading-[1.05]">
            Effects, samples, and oneshots, from MuseHub
          </h2>
          <p className="mt-6 text-text-contrast/70 text-base md:text-lg">
            MuseHub is the companion app that ships with Audacity 4. Open it
            from Get Effects to browse thousands of plugins, samples, and
            oneshots, free and paid.
          </p>
        </header>

        <div className="mt-12 lg:mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {PANELS.map((panel, idx) => (
            <MuseHubPanel key={panel.id} panel={panel} idx={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default MuseHub;
