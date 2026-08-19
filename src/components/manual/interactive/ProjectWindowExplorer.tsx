import { Component, useEffect, useState, type ReactNode } from "react";
// Global stylesheet once, then deep subpaths only — the interactive-island
// rules in UIExample/registry.tsx. Every subpath used here must be listed
// in astro.config.mjs optimizeDeps BEFORE the dev server starts.
import "@dilsonspickles/components/style.css";
import { ApplicationHeader } from "@dilsonspickles/components/ApplicationHeader";
import { ProjectToolbar } from "@dilsonspickles/components/ProjectToolbar";
import { TimelineRuler } from "@dilsonspickles/components/TimelineRuler";
import { TrackControlPanel } from "@dilsonspickles/components/TrackControlPanel";
import { Clip } from "@dilsonspickles/components/Clip";
import ManualToolbarDemo from "./ManualToolbarDemo";
import {
  CLIP_WAVEFORM_LEFT,
  CLIP_WAVEFORM_RIGHT,
} from "../UIExample/waveformData";

/*
  The Reference front door: the Audacity 4 project window, recreated from
  the design system's real components. Clicking any region opens the manual
  page (or section) documenting it — the interface is the table of contents.

  Every target here is a real page/anchor; the audit's dead-link check
  covers MDX but not this file, so treat the MAP below as load-bearing when
  pages move.
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

const go = (href: string) => {
  if (typeof window !== "undefined") window.location.href = href;
};

const M = "/manual/manual-index";

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
        <div className="rounded-xl border border-gray-300 shadow-lg overflow-hidden bg-white">
          <ApplicationHeader
            os={os}
            menuItems={MENUS}
            onMenuItemClick={(item) => go(`${M}/header/${item.toLowerCase()}`)}
          />
          <ProjectToolbar
            activeItem="project"
            onMenuItemClick={(item) =>
              go(
                item === "export"
                  ? `${M}/export-menu`
                  : `${M}/project-management-menu/${item}`,
              )
            }
            historyActions={{
              onUndo: () => go(`${M}/header/edit#undo`),
              onRedo: () => go(`${M}/header/edit#redo`),
            }}
            workspaceSelector={{
              value: "modern",
              label: "Workspace",
              options: [
                { value: "modern", label: "Modern" },
                { value: "classic", label: "Classic" },
                { value: "music", label: "Music" },
              ],
              onChange: (value) => go(`${M}/workspaces/${value}`),
            }}
          />
          <ManualToolbarDemo />
          <div className="flex border-t border-gray-200">
            <div
              className="shrink-0 border-r border-gray-200"
              aria-label="Track control panel — click a control to read about it"
            >
              <TrackControlPanel
                trackName="Vocals"
                trackType="stereo"
                volume={75}
                pan={0}
                meterLevelLeft={62}
                meterLevelRight={55}
                onMuteToggle={() =>
                  go(`${M}/track-control-panel/audio-track-item#mute`)
                }
                onSoloToggle={() =>
                  go(`${M}/track-control-panel/audio-track-item#solo`)
                }
                onVolumeChange={() =>
                  go(`${M}/track-control-panel/audio-track-item#volume`)
                }
                onPanChange={() =>
                  go(`${M}/track-control-panel/audio-track-item#panning`)
                }
                onEffectsClick={() =>
                  go(`${M}/track-control-panel/audio-track-item#effects`)
                }
                onMenuClick={() =>
                  go(`${M}/track-control-panel/audio-track-item#track-options`)
                }
                onClick={() => go(`${M}/track-control-panel/audio-track-item`)}
              />
            </div>
            <div className="min-w-0 flex-1 bg-gray-50">
              {/* role=link divs, not <button>s: the ruler and clip carry
                  their own internal buttons, and button-in-button is
                  invalid HTML that breaks hydration. */}
              <div
                role="link"
                tabIndex={0}
                className="block w-full cursor-pointer"
                aria-label="Timeline — open its manual page"
                onClick={() => go(`${M}/timeline`)}
                onKeyDown={(e) => e.key === "Enter" && go(`${M}/timeline`)}
              >
                <TimelineRuler
                  pixelsPerSecond={24}
                  totalDuration={40}
                  width={960}
                />
              </div>
              <div
                role="link"
                tabIndex={0}
                className="block cursor-pointer p-3"
                aria-label="Audio clip — open the clip commands"
                onClick={() => go(`${M}/header/edit#clip`)}
                onKeyDown={(e) =>
                  e.key === "Enter" && go(`${M}/header/edit#clip`)
                }
              >
                <Clip
                  name="Vocals"
                  width={430}
                  height={132}
                  waveformLeft={CLIP_WAVEFORM_LEFT}
                  waveformRight={CLIP_WAVEFORM_RIGHT}
                />
              </div>
            </div>
          </div>
        </div>
        <figcaption className="mt-3 text-center text-sm text-gray-500">
          The Audacity 4 window, built from its real components. Click any part
          of it — a menu, a toolbar button, a track control, the ruler, the clip
          — to open the page that documents it.
        </figcaption>
      </figure>
    </SpecimenBoundary>
  );
}
