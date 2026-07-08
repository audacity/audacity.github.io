import React from "react";
import { useEntrance } from "../../hooks/useEntrance.js";

const PANELS = [
  {
    id: "project-page",
    image: "/audiocom/Project_page.png",
    eyebrow: "Project page",
    title: "Every project, one home",
    description:
      "Open recents, manage local projects, and pull anything from audio.com into your session without leaving Audacity.",
  },
  {
    id: "audiocom",
    image: "/audiocom/Audio_com.png",
    eyebrow: "Audio.com",
    title: "Publish in two clicks",
    description:
      "Upload straight from the editor to your audio.com workspace. Listeners get a shareable page, you get cloud storage and revision history.",
  },
];

function AudioComPanel({ panel, idx }) {
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

function AudioCom() {
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
            Save to the cloud, share to the world.
          </h2>
          <p className="mt-6 text-text-contrast/70 text-base md:text-lg">
            Sign in with your audio.com account and the editor and the web meet
            in the middle — projects on one side, listeners on the other.
          </p>
        </header>

        <div className="mt-12 lg:mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {PANELS.map((panel, idx) => (
            <AudioComPanel key={panel.id} panel={panel} idx={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default AudioCom;
