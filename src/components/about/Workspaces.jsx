import React, { useEffect, useMemo, useState } from "react";
import { WORKSPACE_CONFIGS } from "./workspaces/workspaceConfigs.js";
import WorkspaceCanvas from "./workspaces/WorkspaceCanvas.jsx";

const WORKSPACE_KEYS = ["classic", "music", "modern", "custom"];
const FADE_MS = 180;

// Radial gradient inside the hero panel: magenta highlight top-right that
// fades through deep purple to brand navy at the bottom — echoes the section's
// purple-to-navy seam so the panel reads as the bridging element.
const HERO_PANEL_GRADIENT =
  "radial-gradient(140% 110% at 80% 0%, rgb(210, 80, 130) 0%, rgb(138, 46, 96) 22%, rgb(70, 36, 110) 55%, rgb(22, 30, 100) 100%)";

function Workspaces() {
  const [activeKey, setActiveKey] = useState("music");
  const [displayedKey, setDisplayedKey] = useState(activeKey);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    if (displayedKey === activeKey) return;
    setOpacity(0);
    const t = setTimeout(() => {
      setDisplayedKey(activeKey);
      setOpacity(1);
    }, FADE_MS);
    return () => clearTimeout(t);
  }, [activeKey, displayedKey]);

  const active = WORKSPACE_CONFIGS[displayedKey] ?? WORKSPACE_CONFIGS.music;
  const labelActive = WORKSPACE_CONFIGS[activeKey] ?? WORKSPACE_CONFIGS.music;
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
        className="max-w-screen-xl mx-auto rounded-[32px] border border-white/10 overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.5)]"
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
            Mockup window — short fixed height that clips the canvas. The
            WorkspaceCanvas inside renders at its natural 16:9 aspect, which
            is taller than the window, so only the top portion (the toolbar
            area that actually changes between workspaces) shows. The window
            itself butts against the panel's bottom edge — the panel's
            overflow:hidden + rounded corners do the final clip.
          */}
          <div
            className="mt-9 lg:mt-10 mx-4 sm:mx-6 h-[232px] sm:h-[252px] lg:h-[272px] overflow-hidden rounded-t-2xl border border-white/20 border-b-0 bg-black shadow-[0_28px_60px_rgba(0,0,0,0.55)]"
            role="tabpanel"
            aria-label={`${labelActive.label} workspace preview`}
            style={{
              opacity,
              transition: `opacity ${FADE_MS}ms ease`,
            }}
          >
            <div className="relative flex items-center h-8 px-3 bg-black/60 border-b border-white/10">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#ff5f57]/85" />
                <span className="w-3 h-3 rounded-full bg-[#febc2e]/85" />
                <span className="w-3 h-3 rounded-full bg-[#28c840]/85" />
              </div>
              <span className="absolute inset-x-0 text-center text-[11px] font-mono tracking-[0.08em] text-text-contrast/60 pointer-events-none">
                Audacity — Untitled Project
              </span>
            </div>
            <div className="aspect-[16/9]">
              <WorkspaceCanvas config={previewConfig} compact />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Workspaces;
