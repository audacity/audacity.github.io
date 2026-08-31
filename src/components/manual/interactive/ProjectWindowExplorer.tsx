import { Component, useEffect, useState, type ReactNode } from "react";
// Global stylesheet once, then deep subpaths only — the interactive-island
// rules in UIExample/registry.tsx. Every subpath used here must be listed
// in astro.config.mjs optimizeDeps BEFORE the dev server starts.
import "@dilsonspickles/components/style.css";
import { ApplicationHeader } from "@dilsonspickles/components/ApplicationHeader";
import { ProjectToolbar } from "@dilsonspickles/components/ProjectToolbar";
import { TimelineRuler } from "@dilsonspickles/components/TimelineRuler";
import { TrackControlPanel } from "@dilsonspickles/components/TrackControlPanel";
import { TrackControlSidePanel } from "@dilsonspickles/components/TrackControlSidePanel";
import { Clip } from "@dilsonspickles/components/Clip";
import { MasterMeter } from "@dilsonspickles/components/MasterMeter";
import { TimeCode } from "@dilsonspickles/components/TimeCode";
import { SelectionToolbar } from "@dilsonspickles/components/SelectionToolbar";
import { VerticalRuler } from "@dilsonspickles/components/VerticalRuler";
import { PlayheadCursor } from "@dilsonspickles/components/PlayheadCursor";
import ManualToolbarDemo from "./ManualToolbarDemo";
import {
  CLIP_WAVEFORM_LEFT,
  CLIP_WAVEFORM_RIGHT,
  CLIP_WAVEFORM_MONO,
} from "../UIExample/waveformData";

/*
  The Reference front door: the Audacity 4 project window, recreated from
  the design system's real components — clickable by AREA, not by control.
  Each region links to the top of the page documenting it: landing halfway
  down an unfamiliar page is disorienting, so the fine-grained
  control-to-section jumps live on the subject pages themselves.

  The components underneath are render-only — a full-region anchor overlays
  each area (no interactive element nests inside another), with a hover
  ring and label chip, like the old manual's numbered window map made live.
*/

const MENUS = [
  "File",
  "Edit",
  "Select",
  "View",
  "Record",
  "Tracks",
  "Generate",
  "Effect",
  "Analyze",
  "Tools",
  "Help",
];

const M = "/manual/manual-index";
const noop = () => {};

class SpecimenBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** The overlay anchor a region (or zone of one) is clicked through. */
function AreaLink({
  href,
  label,
  style,
}: {
  href: string;
  label: string;
  style?: Record<string, string | number>;
}) {
  return (
    <a
      href={href}
      aria-label={`${label} — open its manual page`}
      style={style}
      className="group absolute z-10 transition hover:bg-accent/5 hover:ring-2 hover:ring-inset hover:ring-accent focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
    >
      <span className="absolute right-2 top-2 rounded bg-accent px-2 py-0.5 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
        {label} →
      </span>
    </a>
  );
}

/** One clickable region: the real component rendered inert underneath. */
function Region({
  href,
  label,
  className = "",
  children,
}: {
  href: string;
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`relative ${className}`}>
      <div className="pointer-events-none">{children}</div>
      <AreaLink href={href} label={label} style={{ inset: 0 }} />
    </div>
  );
}

export default function ProjectWindowExplorer() {
  // SSR and first client render must agree (hydration), so the header
  // starts as the Windows variant everywhere and switches after mount —
  // the same pattern Shortcut.jsx uses for OS detection.
  const [os, setOs] = useState<"windows" | "macos">("windows");
  useEffect(() => {
    if (document.documentElement.getAttribute("data-os") === "mac") {
      setOs("macos");
    }
  }, []);

  return (
    <SpecimenBoundary>
      <figure className="not-prose my-8">
        <div className="min-w-[980px] overflow-hidden rounded-xl border border-text-primary/20 bg-white shadow-lg">
          <Region href={`${M}/header`} label="Menus">
            <ApplicationHeader os={os} menuItems={MENUS} />
          </Region>

          {/* One row, three documented areas: the project tabs, the hotbar
              quick actions, and the workspace selector. Zoned overlays. */}
          <div className="relative">
            <div className="pointer-events-none">
              <ProjectToolbar
                activeItem="project"
                centerActions={[
                  { icon: "cog", label: "Audio setup", onClick: noop },
                  { icon: "cloud", label: "Share audio", onClick: noop },
                  { icon: "plugins", label: "Get effects", onClick: noop },
                ]}
                historyActions={{ onUndo: noop, onRedo: noop }}
                workspaceSelector={{
                  value: "modern",
                  // Empty label + narrower dropdown: at the specimen's 980px
                  // the full "Workspace" caption collides with the hotbar's
                  // "Get effects" label.
                  label: "",
                  width: "120px",
                  options: [
                    { value: "modern", label: "Modern" },
                    { value: "classic", label: "Classic" },
                    { value: "music", label: "Music" },
                  ],
                  onChange: noop,
                }}
              />
            </div>
            <AreaLink
              href={`${M}/project-management-menu`}
              label="Project tabs"
              style={{ top: 0, bottom: 0, left: 0, width: "24%" }}
            />
            <AreaLink
              href={`${M}/hotbar`}
              label="Hotbar"
              style={{ top: 0, bottom: 0, left: "24%", width: "38%" }}
            />
            <AreaLink
              href={`${M}/workspaces`}
              label="Workspaces"
              style={{ top: 0, bottom: 0, left: "62%", width: "38%" }}
            />
          </div>

          <Region href={`${M}/toolbar`} label="Toolbar">
            <div className="flex items-center gap-4 pr-3">
              <ManualToolbarDemo />
              <TimeCode value={0} />
              {/* MasterMeter scales differ from track meters: levels are dB
                  (−60..0) and volume is 0–1 — see the assembly guide §3. */}
              <MasterMeter levelLeft={-12} levelRight={-15} volume={0.8} />
            </div>
          </Region>

          <div className="flex border-t border-text-primary/10">
            <Region
              href={`${M}/track-control-panel`}
              label="Track panel"
              className="shrink-0 border-r border-text-primary/10"
            >
              <TrackControlSidePanel resizable={false}>
                <TrackControlPanel
                  trackName="Vocals"
                  trackType="stereo"
                  volume={75}
                  pan={0}
                  meterLevelLeft={62}
                  meterLevelRight={55}
                />
                <TrackControlPanel
                  trackName="Music"
                  trackType="mono"
                  volume={60}
                  pan={-20}
                  meterLevel={40}
                />
              </TrackControlSidePanel>
            </Region>

            <div className="min-w-0 flex-1">
              <Region href={`${M}/timeline`} label="Timeline">
                <TimelineRuler
                  pixelsPerSecond={24}
                  totalDuration={40}
                  width={720}
                />
              </Region>

              <div className="flex">
                {/* The clips canvas: dark ground, one clip per track lane,
                    the playhead running through both. */}
                <Region
                  href={`${M}/waveform`}
                  label="Clips"
                  className="min-w-0 flex-1"
                >
                  <div className="relative h-[280px] overflow-hidden bg-[#252838]">
                    <div className="absolute left-10 top-2">
                      <Clip
                        name="Vocals"
                        color="blue"
                        width={430}
                        height={126}
                        waveformLeft={CLIP_WAVEFORM_LEFT}
                        waveformRight={CLIP_WAVEFORM_RIGHT}
                      />
                    </div>
                    <div className="absolute left-40 top-[140px]">
                      <Clip
                        name="Music"
                        color="violet"
                        width={360}
                        height={126}
                        waveformData={CLIP_WAVEFORM_MONO}
                      />
                    </div>
                    <div className="pointer-events-none absolute bottom-0 left-0 top-0">
                      <PlayheadCursor position={1} pixelsPerSecond={24} />
                    </div>
                  </div>
                </Region>
                <Region
                  href={`${M}/vertical-rulers`}
                  label="Vertical ruler"
                  className="shrink-0 bg-[#252838]"
                >
                  <VerticalRuler height={280} />
                </Region>
              </div>
            </div>
          </div>

          <Region href={`${M}/time-toolbar`} label="Selection toolbar">
            <SelectionToolbar
              status="Stopped"
              instructionText="Click and drag to select audio"
            />
          </Region>
        </div>
        <figcaption className="mt-3 text-center text-sm text-text-primary/50">
          The Audacity 4 window, built from its real components. Click an area —
          the menus, a toolbar, the track panel, the timeline, the clips — to
          open the page that documents it.
        </figcaption>
      </figure>
    </SpecimenBoundary>
  );
}
