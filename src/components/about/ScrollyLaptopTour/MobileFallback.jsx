import React from "react";
import LaptopFrame from "./LaptopFrame.jsx";
import TourOverlay from "./TourOverlay.jsx";
import WorkspaceCanvas from "../workspaces/WorkspaceCanvas.jsx";
import { WORKSPACE_CONFIGS } from "../workspaces/workspaceConfigs.js";
import { STOPS } from "./stops.js";

// Reduced-motion fallback. The main experience (DesktopTour) handles
// both desktop and mobile layouts, so this component is only used when
// the user has requested reduced motion — a simple stacked list, no
// scroll pinning, no per-stop rAF loops.
function MobileFallback() {
  const config = WORKSPACE_CONFIGS.podcast;
  return (
    <section className="bg-background-dark px-6 py-16">
      <div className="max-w-screen-md mx-auto flex flex-col gap-20">
        {STOPS.map((stop) => (
          <div key={stop.id} className="flex flex-col gap-6">
            <LaptopFrame>
              <WorkspaceCanvas config={config} />
              <TourOverlay
                overlay={stop.overlay}
                targetId={stop.id}
                target={stop.target}
              />
            </LaptopFrame>
            <div className="text-text-contrast">
              <div
                className="font-mono text-xs tracking-[0.2em] uppercase"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                {stop.eyebrow}
              </div>
              <h3
                className="font-harmony mt-2 text-3xl leading-tight text-text-contrast"
                style={
                  stop.accentColor ? { color: stop.accentColor } : undefined
                }
              >
                {stop.heading}
              </h3>
              {stop.description && (
                <p className="mt-3 text-base text-text-contrast/70 leading-relaxed">
                  {stop.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default MobileFallback;
