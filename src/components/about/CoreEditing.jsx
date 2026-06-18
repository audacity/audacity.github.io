import React from "react";

const CARDS = [
  {
    id: "clip-handles",
    eyebrow: "Clip handles",
    title: "Trim or stretch, same gesture",
    description:
      "Grab a handle on either edge of a clip. Drag to trim, or hold to time-stretch — the source is always there if you change your mind.",
  },
  {
    id: "track-meters",
    eyebrow: "Track meters",
    title: "See every level at a glance",
    description:
      "Per-track meters next to every channel and a master meter in the transport — peaks held, recents shown, calibrated to dBFS.",
  },
  {
    id: "labels",
    eyebrow: "Label tracks",
    title: "Mark up your project",
    description:
      "Drop labels on the timeline to mark takes, edits or sections. They travel with the audio and survive every move.",
  },
  {
    id: "looping",
    eyebrow: "Looping",
    title: "Loop any region, instantly",
    description:
      "Set a loop range with two clicks and iterate. The range stays visible and you can drag the edges to refine without losing your place.",
  },
  {
    id: "sample-editing",
    eyebrow: "Sample editing",
    title: "Zoom in, edit samples directly",
    description:
      "No mode to enter, no setting to flip. Zoom all the way in and Audacity hands you the samples — drag them by hand and zoom back out.",
  },
];

function CoreEditing() {
  return (
    <section className="bg-background-dark core-editing-section">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-10 shrink-0">
        <header className="max-w-3xl">
          <div
            className="font-mono text-sm tracking-[0.2em] uppercase text-text-contrast/40"
            aria-hidden
          >
            Also new
          </div>
          <h2 className="mt-4 font-harmony text-text-contrast text-4xl md:text-5xl lg:text-6xl leading-[1.05]">
            The smaller things
          </h2>
          <p className="mt-5 text-text-contrast/70 text-base md:text-lg max-w-2xl">
            Quieter improvements you'll notice every session.
          </p>
        </header>
      </div>

      <div className="mt-8 lg:mt-10 flex-1 min-h-0 flex">
        <ul
          className="flex items-stretch gap-5 lg:gap-7 overflow-x-auto snap-x snap-mandatory px-6 lg:px-10 scrollbar-hide w-full"
          style={{
            scrollPaddingLeft: "calc((100vw - min(100vw, 80rem)) / 2 + 1.5rem)",
          }}
        >
          {CARDS.map((card) => (
            <li
              key={card.id}
              className="snap-start shrink-0 w-[min(82vw,420px)] flex flex-col"
            >
              <div
                className="flex-1 min-h-0 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.015] relative overflow-hidden"
                aria-hidden
              >
                <div className="absolute inset-0 flex items-end p-7">
                  <div className="font-mono text-xs tracking-[0.2em] uppercase text-text-contrast/50">
                    {card.eyebrow}
                  </div>
                </div>
              </div>
              <div className="mt-5 px-1 shrink-0 card-text-block">
                <h3 className="font-harmony text-text-contrast text-xl md:text-2xl leading-[1.1]">
                  {card.title}
                </h3>
                <p className="mt-2 text-text-contrast/65 text-sm md:text-base leading-relaxed">
                  {card.description}
                </p>
              </div>
            </li>
          ))}
          <li
            aria-hidden
            className="shrink-0 w-6 lg:w-10"
            style={{ scrollSnapAlign: "none" }}
          />
        </ul>
      </div>

      <style>{`
        .core-editing-section {
          height: 100vh;
          min-height: 100vh !important;
          max-height: 100vh;
          display: flex !important;
          flex-direction: column;
          justify-content: center !important;
          padding-top: 6vh;
          padding-bottom: 6vh;
          gap: 0;
          scroll-snap-align: start;
          scroll-snap-stop: normal;
        }
        .core-editing-section .card-text-block {
          min-height: 132px;
        }
        @media (min-width: 768px) {
          .core-editing-section .card-text-block {
            min-height: 148px;
          }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { scrollbar-width: none; }
      `}</style>
    </section>
  );
}

export default CoreEditing;
