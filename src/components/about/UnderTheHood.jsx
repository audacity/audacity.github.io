import React from "react";

const ACCENT = "#F87171";

const ITEMS = [
  {
    id: "qt",
    title: "Built on Qt",
    description:
      "The interface is rebuilt on Qt — one modern codebase, native on macOS, Windows and Linux.",
    tag: "Framework",
  },
  {
    id: "lv2",
    title: "LV2 plugin support",
    description:
      "Open-standard LV2 plugins load right alongside VST3 and Audio Units — no wrappers required.",
    tag: "Plugins",
  },
  {
    id: "compat",
    title: "Opens your Audacity 3 projects",
    description:
      "Every .aup3 file from Audacity 3 opens directly in Audacity 4 — your sessions, edits, and undo history come with you.",
    tag: "Compatibility",
  },
];

function UnderTheHood() {
  return (
    <section className="bg-background-dark px-6 lg:px-10 py-24 lg:py-32">
      <div className="max-w-[1600px] mx-auto">
        <header className="max-w-3xl">
          <div
            className="font-mono text-xs tracking-[0.3em] uppercase"
            style={{ color: ACCENT }}
            aria-hidden
          >
            Foundation
          </div>
          <h2 className="mt-5 font-harmony text-text-contrast text-5xl md:text-6xl lg:text-7xl leading-[1.05]">
            Under the hood
          </h2>
          <p className="mt-5 text-text-contrast/70 text-base md:text-lg">
            The work you can't see — the foundation that makes everything else
            feel quick and dependable.
          </p>
        </header>

        <ul className="mt-12 lg:mt-16">
          {ITEMS.map((item, i) => (
            <li
              key={item.id}
              className="grid items-start gap-5 lg:gap-8 py-7 lg:py-9 border-t border-white/10 last:border-b"
              style={{
                gridTemplateColumns:
                  "minmax(40px, 80px) minmax(180px, 280px) 1fr minmax(80px, 140px)",
              }}
            >
              <div
                className="font-mono text-base lg:text-lg"
                style={{ color: ACCENT }}
                aria-hidden
              >
                {String(i + 1).padStart(2, "0")}
              </div>
              <h3 className="font-harmony text-text-contrast text-xl md:text-2xl leading-tight">
                {item.title}
              </h3>
              <p className="text-text-contrast/65 text-base lg:text-lg leading-relaxed max-w-2xl">
                {item.description}
              </p>
              <div
                className="font-mono text-xs tracking-[0.3em] uppercase text-right text-text-contrast/40"
                aria-hidden
              >
                {item.tag}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default UnderTheHood;
