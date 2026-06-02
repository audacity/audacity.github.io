import React, { useState } from "react";

const WORKSPACES = [
  {
    key: "classic",
    name: "Classic",
    blurb: "Placeholder copy for the Classic workspace.",
  },
  {
    key: "music",
    name: "Music",
    blurb: "Placeholder copy for the Music workspace.",
  },
  {
    key: "modern",
    name: "Modern",
    blurb: "Placeholder copy for the Modern workspace.",
  },
  {
    key: "custom",
    name: "Custom",
    blurb: "Placeholder copy for the Custom workspace.",
  },
];

function Workspaces() {
  const [activeKey, setActiveKey] = useState(WORKSPACES[1].key);
  const active = WORKSPACES.find((w) => w.key === activeKey) ?? WORKSPACES[0];

  return (
    <section className="bg-background-dark px-6 lg:px-10 py-24 lg:py-32">
      <div className="max-w-screen-xl mx-auto">
        <header className="max-w-3xl">
          <h2 className="font-symphony text-text-contrast text-5xl md:text-6xl lg:text-7xl leading-[1.05]">
            Workspaces
          </h2>
          <p className="mt-6 text-text-contrast/70 text-base md:text-lg">
            Pick a workspace to see how Audacity adapts. Tools, panels, and
            shortcuts reshape around the way you actually work.
          </p>
        </header>

        <div
          role="tablist"
          aria-label="Workspaces"
          className="mt-10 lg:mt-12 flex flex-wrap gap-3"
        >
          {WORKSPACES.map((ws) => {
            const isActive = activeKey === ws.key;
            return (
              <button
                key={ws.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveKey(ws.key)}
                className={
                  "px-5 py-2.5 rounded-md border font-muse-sans text-base transition-colors " +
                  (isActive
                    ? "bg-text-contrast text-background-dark border-text-contrast"
                    : "bg-background-dark text-text-contrast border-white/15 hover:border-white/30")
                }
              >
                {ws.name}
              </button>
            );
          })}
        </div>

        <div className="mt-8 lg:mt-10 rounded-2xl border border-white/15 p-4 lg:p-6">
          <div
            role="tabpanel"
            aria-label={`${active.name} workspace preview`}
            className="aspect-[16/9] rounded-xl bg-white/10 flex items-center justify-center text-text-contrast/40 font-muse-sans"
          >
            {active.name} workspace preview
          </div>
          <p className="mt-4 text-text-contrast/70 text-sm lg:text-base font-muse-sans">
            {active.blurb}
          </p>
        </div>
      </div>
    </section>
  );
}

export default Workspaces;
