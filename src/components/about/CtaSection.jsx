import React from "react";

function CtaSection() {
  return (
    <section className="bg-background-dark px-6 lg:px-10 py-28 lg:py-40">
      <div className="max-w-screen-xl mx-auto text-center">
        <h2 className="font-symphony text-text-contrast text-5xl md:text-6xl lg:text-8xl leading-[1.02] max-w-4xl mx-auto">
          Ready when you are.
        </h2>
        <p className="mt-8 text-text-contrast/70 text-base md:text-lg max-w-2xl mx-auto">
          Audacity 4 is free, open source, and available now for macOS, Windows,
          and Linux.
        </p>

        <div className="mt-10 lg:mt-12 flex flex-wrap items-center justify-center gap-3">
          <a
            href="/download"
            className="inline-flex items-center justify-center rounded-full bg-text-contrast text-background-dark px-7 py-3.5 font-muse-sans text-base font-semibold hover:opacity-90 transition-opacity"
          >
            Download Audacity 4
          </a>
          <a
            href="/manual"
            className="inline-flex items-center justify-center rounded-full border border-white/20 text-text-contrast px-7 py-3.5 font-muse-sans text-base hover:border-white/40 transition-colors"
          >
            Read the manual
          </a>
        </div>
      </div>
    </section>
  );
}

export default CtaSection;
