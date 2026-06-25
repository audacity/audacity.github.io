import React, { useEffect, useMemo, useState } from "react";
import { WORKSPACE_CONFIGS } from "./workspaces/workspaceConfigs.js";
import WorkspaceCanvas from "./workspaces/WorkspaceCanvas.jsx";
import { useEntrance } from "../../hooks/useEntrance.js";

const WORKSPACE_KEYS = ["classic", "music", "modern", "custom"];

// Vertical real-estate the rest of the section eats (heading, lede,
// tab strip, panel padding, section padding). Smaller value than the
// "true" reserved height — content below the mockup is allowed to
// overflow the viewport on shorter screens so the mockup itself can
// stay generous.
const RESERVED_VERTICAL = 240;
// Hero panel max-width — kept in sync with the Tailwind max-w on the
// panel below, so the mockup can fill the full panel content area.
const PANEL_MAX_W = 2200;

// Show roughly the top half of the workspace — toolbar + a couple of
// track lanes. The mockup window is shorter than the workspace's
// intrinsic 16:9 height; WorkspaceCanvas scales to fit the container's
// width and the container's overflow: hidden clips everything below
// the cut.
const MOCKUP_TRIM = 0.5;

function useMockupSize() {
  const [size, setSize] = useState({ width: 1248, height: 234 });
  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // Mirror the section + hero-panel padding stack so the mockup can
      // fill the *actual* panel content area rather than a rough offset.
      const sectionPx = vw >= 1024 ? 80 : 48;
      const panelPx = vw >= 1024 ? 96 : vw >= 640 ? 80 : 48;
      const panelContentW = Math.min(vw - sectionPx, PANEL_MAX_W) - panelPx;
      const maxH = Math.max(240, Math.min(vh * 0.75, vh - RESERVED_VERTICAL));
      const maxW = Math.max(260, panelContentW);
      const ratio = 16 / 9;
      let width = maxH * ratio;
      let height = maxH;
      if (width > maxW) {
        width = maxW;
        height = maxW / ratio;
      }
      // Trim height to show just the top slice; WorkspaceCanvas inside
      // still renders at its native size (its useScaleToFit watches
      // width only), so the toolbar and the top of the canvas read
      // crisp while everything below clips off via the container.
      setSize({
        width: Math.round(width),
        height: Math.round(height * MOCKUP_TRIM),
      });
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

  const headerEntrance = useEntrance();
  const chipsEntrance = useEntrance({ delayMs: 100 });
  const mockupEntrance = useEntrance({ delayMs: 200 });
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
      workspace: active.workspace,
      label: active.label,
      blurb: active.blurb,
    }),
    [active, PROJECT],
  );

  return (
    <section className="bg-background-dark px-6 lg:px-10 py-16 lg:py-20">
      <div
        className="max-w-[2200px] mx-auto rounded-[32px] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.5)]"
        style={{ background: HERO_PANEL_GRADIENT }}
      >
        <div className="pt-14 lg:pt-16 px-6 sm:px-10 lg:px-12">
          <header
            ref={headerEntrance.ref}
            className="max-w-2xl mx-auto text-center"
            style={headerEntrance.style}
          >
            <h2 className="font-harmony text-text-contrast text-5xl md:text-6xl lg:text-7xl leading-[1.05]">
              Workspaces
            </h2>
            <p className="mt-6 text-text-contrast/85 text-base md:text-lg">
              Pick a workspace to see how Audacity adapts. Tools, panels, and
              shortcuts reshape around the way you actually work.
            </p>
          </header>

          <div
            ref={chipsEntrance.ref}
            role="tablist"
            aria-label="Workspaces"
            className="mt-9 lg:mt-10 flex flex-wrap justify-center gap-2.5"
            style={chipsEntrance.style}
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
            ref={mockupEntrance.ref}
            className="mt-8 lg:mt-10 mx-auto rounded-t-2xl border border-white/20 border-b-0 bg-[#171F25] shadow-[0_28px_60px_rgba(0,0,0,0.55)] overflow-hidden"
            style={{
              width: mockupSize.width,
              height: mockupSize.height,
              maxWidth: "100%",
              ...mockupEntrance.style,
            }}
            role="tabpanel"
            aria-label={`${active.label} workspace preview`}
          >
            <WorkspaceCanvas
              config={previewConfig}
              compact={false}
              workspaceKey={activeKey}
              workspaceOptions={WORKSPACE_KEYS.map((k) => ({
                value: k,
                label: WORKSPACE_CONFIGS[k]?.label ?? k,
              }))}
              onWorkspaceChange={setActiveKey}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default Workspaces;
