import React from "react";
import { useEntrance } from "../../hooks/useEntrance.js";

/*
  Photography section that replaces the first decorative waveform, per the
  head of design's brief: "a few carefully composed images representing
  different types of Audacity users ... the waveform ... emerging from one of
  them." The `source` image is the one the waveform is composited into.

  Rendered with a `variant` so we can experiment with layout:
    - "hero"      → one large source image, three supporting tiles below
    - "filmstrip" → four equal tiles in a row
    - "mosaic"    → asymmetric bento (large source + stacked supporters)
*/
const CREATORS = [
  {
    id: "electronic",
    src: "/about/creators/electronic-producer.jpg",
    label: "Electronic production",
    source: true,
  },
  {
    id: "editor",
    src: "/about/creators/audio-editor.jpg",
    label: "Podcasts & audio editing",
  },
  {
    id: "songwriter",
    src: "/about/creators/songwriter.jpg",
    label: "Songwriting",
  },
  {
    id: "collab",
    src: "/about/creators/collab.jpg",
    label: "Video & collaboration",
  },
];

function Tile({ creator, idx, className = "", ratio = "4 / 3" }) {
  const entrance = useEntrance({ delayMs: 120 + idx * 90 });
  return (
    <figure
      ref={entrance.ref}
      style={{ ...entrance.style, aspectRatio: ratio }}
      className={`group relative overflow-hidden rounded-2xl border border-white/10 ${className}`}
    >
      <img
        src={creator.src}
        alt={creator.label}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <figcaption className="absolute bottom-3 left-3 font-mono text-[11px] uppercase tracking-[0.12em] text-white/90 rounded-full bg-black/40 backdrop-blur px-3 py-1.5 border border-white/10">
        {creator.label}
      </figcaption>
    </figure>
  );
}

function CreatorWorkflows({ variant = "hero" }) {
  const header = useEntrance();
  const [source, ...supporting] = [
    CREATORS.find((c) => c.source),
    ...CREATORS.filter((c) => !c.source),
  ];

  return (
    <section className="bg-background-dark px-6 lg:px-10 py-24 lg:py-32">
      <div className="max-w-screen-xl mx-auto">
        <header ref={header.ref} style={header.style} className="max-w-3xl">
          <div className="font-mono text-xs tracking-[0.3em] uppercase text-text-contrast/40">
            Made for every workflow
          </div>
          <h2 className="mt-4 font-harmony text-text-contrast text-5xl md:text-6xl lg:text-7xl leading-[1.05]">
            Built for the way you work
          </h2>
          <p className="mt-6 text-text-contrast/70 text-base md:text-lg">
            Audacity is built for a wide range of creative workflows — beat
            making, podcasts, electronic production, and plenty more.
          </p>
        </header>

        {variant === "filmstrip" && (
          <div className="mt-12 lg:mt-16 grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
            <Tile creator={source} idx={0} ratio="4 / 5" />
            {supporting.map((c, i) => (
              <Tile key={c.id} creator={c} idx={i + 1} ratio="4 / 5" />
            ))}
          </div>
        )}

        {variant === "hero" && (
          <div className="mt-12 lg:mt-16 flex flex-col gap-4 lg:gap-5">
            <Tile creator={source} idx={0} ratio="16 / 9" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-5">
              {supporting.map((c, i) => (
                <Tile key={c.id} creator={c} idx={i + 1} ratio="4 / 3" />
              ))}
            </div>
          </div>
        )}

        {variant === "mosaic" && (
          <div className="mt-12 lg:mt-16 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
            <Tile
              creator={source}
              idx={0}
              ratio="16 / 10"
              className="lg:col-span-7 lg:row-span-2"
            />
            <Tile
              creator={supporting[0]}
              idx={1}
              ratio="16 / 9"
              className="lg:col-span-5"
            />
            <div className="lg:col-span-5 grid grid-cols-2 gap-4 lg:gap-5">
              <Tile creator={supporting[1]} idx={2} ratio="3 / 4" />
              <Tile creator={supporting[2]} idx={3} ratio="3 / 4" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default CreatorWorkflows;
