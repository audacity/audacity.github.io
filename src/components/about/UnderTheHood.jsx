import React from "react";

const ITEMS = [
  {
    id: "engine",
    title: "Rewritten audio engine",
    description:
      "Lower latency and higher channel counts on the same hardware.",
  },
  {
    id: "formats",
    title: "Broader format support",
    description:
      "Modern codecs, surround configurations, and metadata handled natively.",
  },
  {
    id: "performance",
    title: "Faster, everywhere",
    description:
      "Project loads, waveform rendering, and effect processing are noticeably quicker.",
  },
];

function UnderTheHood() {
  return (
    <section className="bg-background-dark px-6 lg:px-10 py-24 lg:py-32">
      <div className="max-w-screen-xl mx-auto">
        <header className="max-w-3xl">
          <h2 className="font-symphony text-text-contrast text-5xl md:text-6xl lg:text-7xl leading-[1.05]">
            Under the hood
          </h2>
          <p className="mt-6 text-text-contrast/70 text-base md:text-lg">
            The work you can't see — the foundation that makes everything else
            feel quick and dependable.
          </p>
        </header>

        <ul className="mt-12 lg:mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {ITEMS.map((item) => (
            <li
              key={item.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 lg:p-8"
            >
              <h3 className="font-symphony text-text-contrast text-2xl md:text-3xl leading-tight">
                {item.title}
              </h3>
              <p className="mt-3 text-text-contrast/65 text-base">
                {item.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default UnderTheHood;
