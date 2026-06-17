import React from "react";

const CARDS = [
  {
    id: "layout",
    title: "Layout",
    description: "Dock and undock panels",
  },
  {
    id: "toolbar",
    title: "Toolbar",
    description: "Pick the tools you use",
  },
  {
    id: "themes",
    title: "Themes",
    description: "Light, dark, high contrast",
  },
  {
    id: "clip-colours",
    title: "Clip colours",
    description: "Colour code your project",
  },
];

function CustomisableUI() {
  return (
    <section className="bg-background-dark px-6 lg:px-10 py-24 lg:py-32">
      <div className="max-w-screen-xl mx-auto">
        <header className="max-w-3xl">
          <h2 className="font-symphony text-text-contrast text-5xl md:text-6xl lg:text-7xl leading-[1.05]">
            Fully customisable UI
          </h2>
          <p className="mt-6 text-text-contrast/70 text-base md:text-lg">
            Workspaces are the starting point. From there, almost everything
            bends to fit.
          </p>
        </header>

        <ul className="mt-12 lg:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {CARDS.map((card) => (
            <li key={card.id} className="flex flex-col">
              <div
                className="aspect-[4/3] rounded-xl border border-white/10 bg-white/5"
                aria-hidden
              />
              <div className="mt-5">
                <h3 className="text-text-contrast font-muse-sans text-lg font-semibold">
                  {card.title}
                </h3>
                <p className="mt-1.5 text-text-contrast/65 text-base">
                  {card.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default CustomisableUI;
