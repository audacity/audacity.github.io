import React, { useEffect, useMemo, useState } from "react";
import { WORKSPACE_CONFIGS } from "./workspaces/workspaceConfigs.js";
import WorkspaceCanvas from "./workspaces/WorkspaceCanvas.jsx";

const WORKSPACE_KEYS = ["classic", "music", "modern", "custom"];

// Vertical real-estate the rest of the section eats (heading, lede,
// tab strip, panel padding, section padding). Subtracted from viewport
// height when sizing the mockup so it always fits without clipping.
const RESERVED_VERTICAL = 380;
// Horizontal slack: section padding + hero-panel padding either side.
const RESERVED_HORIZONTAL = 96;
// Absolute cap so we don't blow up the workspace on ultra-wide displays.
const MAX_MOCKUP_W = 1280;

function useMockupSize() {
  const [size, setSize] = useState({ width: 1056, height: 594 });
  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const maxH = Math.max(240, Math.min(vh * 0.6, vh - RESERVED_VERTICAL));
      const maxW = Math.min(vw - RESERVED_HORIZONTAL, MAX_MOCKUP_W);
      const ratio = 16 / 9;
      let width = maxH * ratio;
      let height = maxH;
      if (width > maxW) {
        width = maxW;
        height = maxW / ratio;
      }
      setSize({ width: Math.round(width), height: Math.round(height) });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return size;
}

// Radial gradient inside the hero panel: magenta highlight top-right that
// fades through deep purple to brand navy at the bottom — echoes the section's
// purple-to-navy seam so the panel reads as the bridging element.
const HERO_PANEL_GRADIENT =
  "radial-gradient(140% 110% at 80% 0%, rgb(210, 80, 130) 0%, rgb(138, 46, 96) 22%, rgb(70, 36, 110) 55%, rgb(22, 30, 100) 100%)";

function Workspaces() {
  const [activeKey, setActiveKey] = useState("music");
  const mockupSize = useMockupSize();
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
    <section className="bg-background-dark px-6 lg:px-10 py-16 lg:py-20">
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
            Mockup window — 16:9 frame sized off the viewport so the full
            workspace fits in the section regardless of screen size.
            Width caps at min(parent, 880px, height*16/9) so we never
            overflow horizontally on phones nor get crushed on short
            laptop screens. compact={false} keeps the Windows-style
            ApplicationHeader inside the canvas.
          */}
          <div
            className="mt-8 lg:mt-10 mx-auto rounded-t-2xl border border-white/20 border-b-0 bg-[#171F25] shadow-[0_28px_60px_rgba(0,0,0,0.55)] overflow-hidden"
            style={{
              width: mockupSize.width,
              height: mockupSize.height,
              maxWidth: "100%",
            }}
            role="tabpanel"
            aria-label={`${active.label} workspace preview`}
          >
            <WorkspaceCanvas config={previewConfig} compact={false} />
          </div>
        </div>
      </div>
    </section>
  );
}

export default Workspaces;
