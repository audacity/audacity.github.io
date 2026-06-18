import React from "react";

const CARDS = [
  {
    id: "clip-handles",
    eyebrow: "Trim handles",
    title: "Trim from either edge",
    description:
      "Every clip has handles on both sides. Drag them in to trim, drag them back out to recover audio — the source is always there.",
  },
  {
    id: "multi-select",
    eyebrow: "Multi-select",
    title: "Select many, edit once",
    description:
      "Shift-click or lasso to grab any combination of clips across any tracks. Move, fade, or process them together.",
  },
  {
    id: "drop-anywhere",
    eyebrow: "Free placement",
    title: "Drop clips anywhere",
    description:
      "Drop a clip on top of another and Audacity sorts it out. Overlaps preserve both clips so you can layer takes and pick later.",
  },
  {
    id: "clip-groups",
    eyebrow: "Clip groups",
    title: "Group clips that belong together",
    description:
      "Bind related takes into a group so they move and edit as one. Ungroup any time — nothing is destructive.",
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
            Core editing
          </div>
          <h2 className="mt-4 font-harmony text-text-contrast text-4xl md:text-5xl lg:text-6xl leading-[1.05]">
            Everyday editing,
            <br />
            refreshed
          </h2>
          <p className="mt-5 text-text-contrast/70 text-base md:text-lg max-w-2xl">
            The fundamentals you reach for every session. Faster, more direct,
            never destructive.
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
