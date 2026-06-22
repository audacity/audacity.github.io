import React, { useMemo, useState } from "react";
import { WORKSPACE_CONFIGS } from "./workspaces/workspaceConfigs.js";
import WorkspaceCanvas from "./workspaces/WorkspaceCanvas.jsx";

const WORKSPACE_KEYS = ["classic", "music", "modern", "custom"];

// Radial gradient inside the hero panel: magenta highlight top-right that
// fades through deep purple to brand navy at the bottom — echoes the section's
// purple-to-navy seam so the panel reads as the bridging element.
const HERO_PANEL_GRADIENT =
  "radial-gradient(140% 110% at 80% 0%, rgb(210, 80, 130) 0%, rgb(138, 46, 96) 22%, rgb(70, 36, 110) 55%, rgb(22, 30, 100) 100%)";

function Workspaces() {
  const [activeKey, setActiveKey] = useState("music");
  const active = WORKSPACE_CONFIGS[activeKey] ?? WORKSPACE_CONFIGS.music;
  // Workspaces are toolbar/UI presets — the underlying project (tracks,
  // clips, mixer) stays the same. We borrow the podcast project as the
  // demo content and only let the active workspace's toolbar/envelope
  // settings drive the canvas.
  const PROJECT = WORKSPACE_CONFIGS.podcast;
  const previewConfig = useMemo(
    () => ({
      ...PROJECT,
      toolbar: active.toolbar,
      envelopeMode: !!active.envelopeMode,
      label: active.label,
      blurb: active.blurb,
    }),
    [active, PROJECT],
  );

  return (
    <section className="bg-background-dark px-6 lg:px-10 pt-24 lg:pt-32 pb-40 lg:pb-56">
      <div
        className="max-w-[1440px] mx-auto rounded-[32px] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.5)]"
        style={{ background: HERO_PANEL_GRADIENT }}
      >
        <div className="pt-14 lg:pt-16 px-6 sm:px-10 lg:px-12">
          <header className="max-w-2xl mx-auto text-center">
            <h2 className="font-harmony text-text-contrast text-5xl md:text-6xl lg:text-7xl leading-[1.05]">
              Workspaces
            </h2>
            <p className="mt-6 text-text-contrast/85 text-base md:text-lg">
              Pick a workspace to see how Audacity adapts. Tools, panels, and
              shortcuts reshape around the way you actually work.
            </p>
          </header>

          <div
            role="tablist"
            aria-label="Workspaces"
            className="mt-9 lg:mt-10 flex flex-wrap justify-center gap-2.5"
          >
            {WORKSPACE_KEYS.map((key) => {
              const cfg = WORKSPACE_CONFIGS[key];
              if (!cfg) return null;
              const isActive = activeKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveKey(key)}
                  className={
                    "px-4 py-2 rounded-md border font-muse-sans text-sm md:text-base transition-colors " +
                    (isActive
                      ? "bg-text-contrast text-background-dark border-text-contrast"
                      : "bg-white/5 text-text-contrast border-white/30 hover:border-white/50")
                  }
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>

          {/*
            Mockup window — taller fixed height that clips the canvas.
            compact={false} makes WorkspaceCanvas render its built-in
            ApplicationHeader (Windows menu bar) instead of our custom
            macOS chrome — matches the same faux app frame used in the
            ScrollyLaptopTour.
          */}
          <div
            className="mt-9 lg:mt-10 mx-4 sm:mx-6 h-[340px] sm:h-[380px] lg:h-[420px] overflow-hidden rounded-t-2xl border border-white/20 border-b-0 bg-black shadow-[0_28px_60px_rgba(0,0,0,0.55)]"
            role="tabpanel"
            aria-label={`${active.label} workspace preview`}
          >
            <div className="aspect-[16/9]">
              <WorkspaceCanvas config={previewConfig} compact={false} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Workspaces;
