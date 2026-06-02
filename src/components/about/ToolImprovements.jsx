import React, { useState } from "react";

const TOOLS = [
  {
    key: "split",
    name: "Split tool",
    blurb: "Additional line of text",
    featuredTitle: "A dedicated split tool",
    featuredCopy:
      "One of the most-requested features, now in the toolbar with its own home. Click anywhere on a clip to split it cleanly — across multiple clips at once if you've got them selected.",
    href: "#",
  },
  {
    key: "envelope",
    name: "Envelope",
    blurb: "Additional line of text",
    featuredTitle: "Envelope, reimagined",
    featuredCopy: "Placeholder copy for the envelope tool stage.",
    href: "#",
  },
  {
    key: "labels",
    name: "Labels",
    blurb: "Additional line of text",
    featuredTitle: "Labels you can actually edit",
    featuredCopy: "Placeholder copy for the labels stage.",
    href: "#",
  },
  {
    key: "trackMeters",
    name: "Track meters",
    blurb: "Additional line of text",
    featuredTitle: "Per-track meters",
    featuredCopy: "Placeholder copy for the track meters stage.",
    href: "#",
  },
  {
    key: "looping",
    name: "Looping",
    blurb: "Additional line of text",
    featuredTitle: "Looping, finally",
    featuredCopy: "Placeholder copy for the looping stage.",
    href: "#",
  },
];

function ToolImprovements() {
  const [activeKey, setActiveKey] = useState(TOOLS[0].key);
  const active = TOOLS.find((t) => t.key === activeKey) ?? TOOLS[0];

  return (
    <section className="bg-background-dark px-6 lg:px-10 py-24 lg:py-32">
      <div className="max-w-screen-xl mx-auto">
        <header className="max-w-3xl">
          <h2 className="font-symphony text-text-contrast text-5xl md:text-6xl lg:text-7xl leading-[1.05]">
            Tool improvements
          </h2>
          <p className="mt-6 text-text-contrast/70 text-base md:text-lg">
            Pick a tool from the list — the stage on the right shows what
            changed. Always visible, never offscreen.
          </p>
        </header>

        <div className="mt-16 lg:mt-24 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-8 lg:gap-12 items-start">
          <ul className="flex flex-col gap-3 lg:gap-4">
            {TOOLS.map((tool) => {
              const isActive = activeKey === tool.key;
              return (
                <li key={tool.key}>
                  <button
                    type="button"
                    onClick={() => setActiveKey(tool.key)}
                    aria-pressed={isActive}
                    className={
                      "w-full text-left rounded-2xl border p-6 lg:p-7 transition-colors " +
                      (isActive
                        ? "bg-text-contrast text-background-dark border-text-contrast"
                        : "bg-background-dark text-text-contrast border-white/15 hover:border-white/30")
                    }
                  >
                    <p className="font-semibold text-xl lg:text-2xl">
                      {tool.name}
                    </p>
                    <p
                      className={
                        "mt-2 text-sm font-muse-sans " +
                        (isActive ? "opacity-80" : "text-text-contrast/60")
                      }
                    >
                      {tool.blurb}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="lg:sticky lg:top-24">
            <div className="rounded-2xl border border-white/15 p-4 lg:p-6">
              <div className="aspect-video rounded-xl bg-white/10 flex items-center justify-center text-text-contrast/40 font-muse-sans">
                GIF
              </div>
              <h3 className="mt-6 text-text-contrast text-2xl lg:text-3xl font-semibold leading-tight">
                {active.featuredTitle}
              </h3>
              <p className="mt-3 text-text-contrast/70 text-base lg:text-lg leading-relaxed">
                {active.featuredCopy}
              </p>
              <a
                href={active.href}
                className="mt-6 inline-block px-6 py-3 rounded-full border border-text-contrast text-text-contrast hover:bg-text-contrast hover:text-background-dark transition-colors font-muse-sans text-sm"
              >
                Try it yourself
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ToolImprovements;
