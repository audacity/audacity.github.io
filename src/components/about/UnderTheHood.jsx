import React from "react";
import { useEntrance } from "../../hooks/useEntrance.js";

const ACCENT = "#F87171";

const ITEMS = [
  {
    id: "qt",
    tag: "Framework",
    headline: "Built on Qt",
    description:
      "Our interface is rebuilt on Qt, a modern codebase that runs natively on macOS, Windows and Linux.",
  },
  {
    id: "lv2",
    tag: "Plugins",
    headline: "LV2 + VST3 + AU",
    description:
      "Open-standard LV2 plugins load right alongside VST3 and Audio Units, with no wrappers required.",
  },
  {
    id: "compat",
    tag: "Compatibility",
    headline: ".aup3 opens natively",
    description:
      "Every .aup3 file from Audacity 3 opens directly in Audacity 4, exactly as you saved it.",
  },
  {
    id: "license",
    tag: "License",
    headline: "Free, GPL v3",
    description:
      "The same free, open-source license Audacity has always shipped under. Auditable and redistributable.",
  },
];

function UnderTheHoodItem({ item, i }) {
  const entrance = useEntrance({ delayMs: 150 + i * 90 });
  return (
    <div
      ref={entrance.ref}
      className={
        "py-10 lg:py-12 px-0 sm:px-6 lg:px-8 border-white/10 " +
        "border-b sm:border-b-0 " +
        (i > 0 ? "sm:border-l " : "") +
        (i >= 2 ? "sm:border-t lg:border-t-0 " : "") +
        (i % 2 === 0 ? "sm:border-l-0 lg:border-l " : "") +
        (i === 0 ? "lg:border-l-0 " : "")
      }
      style={entrance.style}
    >
      <div
        className="font-mono text-xs tracking-[0.3em] uppercase"
        style={{ color: ACCENT }}
        aria-hidden
      >
        {item.tag}
      </div>
      <div className="mt-6 font-harmony text-text-contrast text-3xl md:text-4xl lg:text-5xl leading-[1.05]">
        {item.headline}
      </div>
      <p className="mt-6 text-text-contrast/65 text-sm md:text-base leading-relaxed">
        {item.description}
      </p>
    </div>
  );
}

function UnderTheHood() {
  const headerEntrance = useEntrance();
  return (
    <section className="bg-background-dark px-6 lg:px-10 py-24 lg:py-32">
      <div className="max-w-[1600px] mx-auto">
        {/* Headline + lede above the stat columns. */}
        <div
          ref={headerEntrance.ref}
          className="max-w-3xl"
          style={headerEntrance.style}
        >
          <h2 className="font-harmony text-text-contrast text-5xl md:text-6xl lg:text-7xl leading-[1.05]">
            Under the hood
          </h2>
        </div>

        {/* Stat columns. Border-top + vertical dividers between columns
            on wider screens; stacks to single-column rows below sm with
            border-bottoms acting as separators. */}
        <div className="mt-14 lg:mt-20 border-t border-white/10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {ITEMS.map((item, i) => (
              <UnderTheHoodItem key={item.id} item={item} i={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default UnderTheHood;
