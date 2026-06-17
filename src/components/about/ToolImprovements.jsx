import React, { useState } from "react";

const TOOLS = [
  {
    key: "split",
    name: "Split tool",
    featuredTitle: "A dedicated split tool",
    featuredCopy:
      "One of the most-requested features, now in the toolbar with its own home. Click anywhere on a clip to split it cleanly — across multiple clips at once if you've got them selected.",
    href: "#",
    video: "/gifs/cut_tool.mov",
  },
  {
    key: "envelope",
    name: "Envelope",
    featuredTitle: "Envelope, reimagined",
    featuredCopy: "Placeholder copy for the envelope tool stage.",
    href: "#",
    video: "/gifs/envelope.mov",
  },
  {
    key: "labels",
    name: "Labels",
    featuredTitle: "Labels you can actually edit",
    featuredCopy: "Placeholder copy for the labels stage.",
    href: "#",
    video: null,
  },
  {
    key: "trackMeters",
    name: "Track meters",
    featuredTitle: "Per-track meters",
    featuredCopy: "Placeholder copy for the track meters stage.",
    href: "#",
    video: "/gifs/track_meter.mov",
  },
  {
    key: "looping",
    name: "Looping",
    featuredTitle: "Looping, finally",
    featuredCopy: "Placeholder copy for the looping stage.",
    href: "#",
    video: null,
  },
];

function ToolImprovements() {
  const [activeKey, setActiveKey] = useState(TOOLS[0].key);
  const activeIdx = Math.max(
    0,
    TOOLS.findIndex((t) => t.key === activeKey),
  );
  const active = TOOLS[activeIdx];
  const activeNum = String(activeIdx + 1).padStart(2, "0");

  return (
    <section className="bg-background-dark px-6 lg:px-10 py-24 lg:py-32">
      <div className="max-w-screen-xl mx-auto w-full">
        <header className="max-w-3xl mb-16 lg:mb-24">
          <h2 className="font-symphony text-text-contrast text-5xl md:text-6xl lg:text-7xl leading-[1.05]">
            Tool improvements
          </h2>
          <p className="mt-6 text-text-contrast/70 text-base md:text-lg">
            Small tools, big quality-of-life gains. Browse whatever catches your
            eye.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          <ul role="tablist" aria-label="Tool improvements">
            {TOOLS.map((tool, i) => {
              const isActive = activeKey === tool.key;
              const tnum = String(i + 1).padStart(2, "0");
              return (
                <li key={tool.key}>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveKey(tool.key)}
                    className={
                      "group block w-full text-left py-5 transition-opacity duration-300 " +
                      (isActive ? "opacity-100" : "opacity-40 hover:opacity-70")
                    }
                  >
                    <div className="flex items-baseline gap-5">
                      <span className="font-mono text-xs md:text-sm tracking-[0.25em] text-text-contrast/50 pt-2">
                        {tnum}
                      </span>
                      <span className="font-symphony text-text-contrast text-3xl md:text-4xl lg:text-5xl leading-[1.05]">
                        {tool.name}
                      </span>
                    </div>
                    <div
                      className={
                        "mt-3 ml-9 md:ml-10 h-px bg-text-contrast/70 origin-left transition-transform duration-500 " +
                        (isActive ? "scale-x-100" : "scale-x-0")
                      }
                    />
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="lg:sticky lg:top-24">
            {active.video ? (
              <video
                key={active.key}
                src={active.video}
                autoPlay
                loop
                muted
                playsInline
                aria-hidden
                className="aspect-video w-full bg-white/5 object-cover"
              />
            ) : (
              <div
                className="aspect-video w-full bg-white/5 flex items-center justify-center"
                aria-hidden
              >
                <span className="text-text-contrast/30 font-mono text-xs tracking-[0.3em] uppercase">
                  {active.name} preview
                </span>
              </div>
            )}
            <div className="mt-8 max-w-xl">
              <div className="font-mono text-xs md:text-sm tracking-[0.3em] uppercase text-text-contrast/40">
                Feature {activeNum}
              </div>
              <h3 className="mt-4 font-symphony text-text-contrast text-3xl md:text-4xl lg:text-5xl leading-tight">
                {active.featuredTitle}
              </h3>
              <p className="mt-4 text-text-contrast/70 text-base md:text-lg leading-relaxed">
                {active.featuredCopy}
              </p>
              <a
                href={active.href}
                className="mt-8 inline-flex items-center gap-2 text-text-contrast font-mono text-xs md:text-sm tracking-[0.25em] uppercase hover:gap-4 transition-all"
              >
                Read more
                <span aria-hidden>→</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ToolImprovements;
