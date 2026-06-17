import React from "react";

function TourPanel({ stop, panelRef }) {
  if (!stop || !stop.panelSide) {
    return <div ref={panelRef} style={{ visibility: "hidden" }} />;
  }
  return (
    <div ref={panelRef} className="max-w-md text-text-contrast">
      <div
        key={stop.id}
        style={{
          animation: "tour-panel-in 360ms cubic-bezier(0.2, 0.7, 0.2, 1) both",
        }}
      >
        <div
          className="font-mono text-sm tracking-[0.2em] uppercase"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          {stop.eyebrow}
        </div>
        <h3
          className="font-symphony mt-3 text-4xl md:text-5xl leading-[1.05]"
          data-tour-panel-heading
        >
          {stop.heading}
        </h3>
        <p className="mt-5 text-base md:text-lg text-text-contrast/70 leading-relaxed">
          {stop.description}
        </p>
      </div>
      <style>{`@keyframes tour-panel-in{from{opacity:0;transform:translateY(12px);filter:blur(4px)}to{opacity:1;transform:translateY(0);filter:blur(0)}}`}</style>
    </div>
  );
}

export default TourPanel;
