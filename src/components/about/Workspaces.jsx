import React, { useMemo, useState } from "react";
import { WORKSPACE_CONFIGS } from "./workspaces/workspaceConfigs.js";
import WorkspaceCanvas from "./workspaces/WorkspaceCanvas.jsx";
import { useEntrance } from "../../hooks/useEntrance.js";

const WORKSPACE_KEYS = ["classic", "music", "modern", "custom"];

// The mockup used to size itself with a JS hook that watched window
// dimensions and called setState on mount/resize. That meant SSR
// rendered a fixed default and the first client paint snapped to the
// real size — a visible content shift on first load. The math is now
// expressed in pure CSS (see the constants + min() calc below). Both
// the SSR pass and every client render get the exact same dimensions,
// so there's nothing to shift.
//
// The mockup window is shorter than the workspace's intrinsic 16:9
// height — we show roughly the top half. WorkspaceCanvas scales to
// fit the container's width and the container's overflow:hidden
// clips everything below the cut.
const MOCKUP_TRIM = 0.5;
// Container aspect ratio: a full 16:9 workspace trimmed to MOCKUP_TRIM
// of its height is 16 wide by (9 * MOCKUP_TRIM) tall.
const MOCKUP_ASPECT = `16 / ${9 * MOCKUP_TRIM}`;
// Vertical real-estate the rest of the section eats (heading, lede,
// tab strip, panel padding). Used to cap the mockup's pre-trim height
// so the full workspace can still fit in the section on shorter
// viewports — the container then trims to MOCKUP_TRIM of that.
const RESERVED_VERTICAL_PX = 240;
const PANEL_MAX_W_PX = 2200;

// Section / panel horizontal padding totals (both sides combined),
// keyed off the Tailwind breakpoints we use in the markup below:
//   - below 640:  section px-6 (48 total) + panel px-6 (48 total)
//   - 640..1024:  section px-6 (48 total) + panel px-10 (80 total)
//   - 1024+:      section px-10 (80 total) + panel px-12 (96 total)
// Expressed as CSS variables on the mockup element so the width
// calc below can reference them at every breakpoint without us
// hand-rolling media queries inside calc().
const MOCKUP_BASE_STYLE = {
  // aspectRatio is set via CSS class (see MOCKUP_VAR_CSS) so mobile
  // gets full 16:9 and desktop gets the 32:9 trimmed strip. Setting it
  // here as an inline style would override the CSS media query.
  //
  // The full-height 16:9 workspace would be (panel-content-width) ×
  // (panel-content-width × 9/16). We cap that height at the reserved
  // viewport budget, then size the container's width off the smaller
  // of those two limits.
  //
  // svh (not vh) so mobile browser chrome toggling as the user scrolls
  // doesn't change the mockup dimensions — otherwise the inner
  // ResizeObserver-driven `useScaleToFit` re-scales the workspace
  // canvas continuously, which reads as the UI "moving" mid-scroll.
  width:
    "min(" +
    "calc(min(75svh, 100svh - " +
    RESERVED_VERTICAL_PX +
    "px) * 16 / 9), " +
    "calc(min(100vw - var(--mockup-section-total), " +
    PANEL_MAX_W_PX +
    "px) - var(--mockup-panel-total))" +
    ")",
  maxWidth: "100%",
};

const MOCKUP_VAR_CSS = `
  .workspaces-mockup {
    /* Mobile — full 16:9 aspect (not the 32:9 trimmed strip used on
       desktop) so the mockup renders TALL enough to actually show the
       tracks. Section padding = px-2 (16px total). Panel padding =
       px-4 (32px total) to give the card content some breathing room
       inside the rounded/shadowed hero container. */
    --mockup-section-total: 16px;
    --mockup-panel-total: 32px;
    aspect-ratio: 16 / 9;
  }
  @media (min-width: 640px) {
    .workspaces-mockup {
      --mockup-section-total: 48px;
      --mockup-panel-total: 80px;
      aspect-ratio: 32 / 9;
    }
  }
  @media (min-width: 1024px) {
    .workspaces-mockup {
      --mockup-section-total: 80px;
      --mockup-panel-total: 96px;
    }
  }
`;

// Radial gradient inside the hero panel: magenta highlight top-right that
// fades through deep purple to brand navy at the bottom — echoes the section's
// purple-to-navy seam so the panel reads as the bridging element.
const HERO_PANEL_GRADIENT =
  "radial-gradient(140% 110% at 80% 0%, rgb(210, 80, 130) 0%, rgb(138, 46, 96) 22%, rgb(70, 36, 110) 55%, rgb(22, 30, 100) 100%)";

function Workspaces() {
  const [activeKey, setActiveKey] = useState("music");
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
    <section
      className="bg-background-dark px-2 sm:px-6 lg:px-10 py-4 sm:py-16 lg:py-20 min-h-[100vh] sm:min-h-0 flex flex-col"
      style={{
        // svh (small viewport height) so the section keeps a stable
        // height even as Safari's bottom chrome bar hides/shows. dvh
        // would grow/shrink with the chrome and cause the flex-1 hero
        // card + centred content to visibly reflow on every scroll.
        minHeight: "100svh",
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: MOCKUP_VAR_CSS }} />
      <div
        className="max-w-[1600px] mx-auto w-full flex-1 sm:flex-none flex flex-col justify-center sm:block rounded-3xl sm:rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] sm:shadow-[0_50px_100px_rgba(0,0,0,0.5)] ring-1 ring-white/10 sm:ring-0"
        style={{ background: HERO_PANEL_GRADIENT }}
      >
        <div className="sm:pt-14 lg:pt-16 px-4 sm:px-10 lg:px-12 py-6 sm:py-0 flex flex-col gap-6 sm:block">
          <header
            ref={headerEntrance.ref}
            className="max-w-2xl mx-auto text-center order-2 sm:order-none"
            style={headerEntrance.style}
          >
            <h2 className="font-harmony text-text-contrast text-3xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.05]">
              Pick a workspace, or build your own
            </h2>
            <p className="mt-3 sm:mt-6 text-text-contrast/85 text-sm sm:text-base md:text-lg">
              Each workspace changes the tools in your toolbar, and swaps the
              ruler between seconds and bars and beats. Build your own to
              personalise Audacity further.
            </p>
          </header>

          <div
            ref={chipsEntrance.ref}
            role="tablist"
            aria-label="Workspaces"
            className="mt-0 sm:mt-9 lg:mt-10 flex flex-wrap justify-center gap-2 order-3 sm:order-none"
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
                    "px-3 sm:px-4 py-1.5 sm:py-2 rounded-md border font-muse-sans text-xs sm:text-sm md:text-base transition-colors " +
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
            className="workspaces-mockup mt-0 sm:mt-8 lg:mt-10 mx-auto rounded-2xl sm:rounded-t-2xl sm:rounded-b-none border border-white/20 sm:border-b-0 bg-[#171F25] shadow-[0_28px_60px_rgba(0,0,0,0.55)] overflow-hidden order-1 sm:order-none"
            style={{
              ...MOCKUP_BASE_STYLE,
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
