import { Component, useRef, useState, type ReactNode } from "react";
// The package's global stylesheet (theme custom properties + icon font),
// then the one component this island needs — deep subpath, same discipline
// as UIExample/registry.tsx, so the bundle carries only this component.
import "@dilsonspickles/components/style.css";
import { TrackControlPanel } from "@dilsonspickles/components/TrackControlPanel";
import { scrollToSection } from "./scrollToSection";

/*
  A live track control panel from the design system, wired to the page that
  documents it: using any control scrolls to the section describing that
  control. The specimen is the navigation.

  The heading ids are the page's own anchors — if a heading on
  audio-track-item.mdx is renamed, the matching id here must follow.
*/

const SCROLL_COOLDOWN_MS = 1500;

/*
  If the design-system component ever throws at runtime, the specimen
  quietly disappears and the page's prose carries on — a reference page
  must never be taken down by its illustration.
*/
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

export default function TrackPanelExplorer() {
  const [trackName, setTrackName] = useState("Vocals");
  const [volume, setVolume] = useState(75);
  const [pan, setPan] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSolo, setIsSolo] = useState(false);
  const lastScroll = useRef({ id: "", at: 0 });

  function goTo(id: string) {
    const now = Date.now();
    // Continuous controls (volume, pan) fire per pixel of drag; scroll once
    // per gesture, not once per event.
    if (
      lastScroll.current.id === id &&
      now - lastScroll.current.at < SCROLL_COOLDOWN_MS
    ) {
      lastScroll.current.at = now;
      return;
    }
    lastScroll.current = { id, at: now };
    scrollToSection(id);
  }

  const meter = isMuted ? 0 : Math.round(volume * 0.85);

  return (
    <SpecimenBoundary>
      <figure className="not-prose my-8 rounded-lg border border-text-primary/10 bg-background-light p-4">
        <div className="flex justify-center">
          <TrackControlPanel
            trackName={trackName}
            trackType="stereo"
            volume={volume}
            pan={pan}
            isMuted={isMuted}
            isSolo={isSolo}
            meterLevelLeft={meter}
            meterLevelRight={Math.max(0, meter - 6)}
            onVolumeChange={(v) => {
              setVolume(v);
              goTo("volume");
            }}
            onPanChange={(p) => {
              setPan(p);
              goTo("panning");
            }}
            onMuteToggle={() => {
              setIsMuted((m) => !m);
              goTo("mute");
            }}
            onSoloToggle={() => {
              setIsSolo((s) => !s);
              goTo("solo");
            }}
            onEffectsClick={() => goTo("effects")}
            onMenuClick={() => goTo("track-options")}
            onRename={(name) => {
              setTrackName(name || "Vocals");
              goTo("rename-duplicate-and-delete");
            }}
          />
        </div>
        <figcaption className="mt-3 text-center text-sm text-text-primary/50">
          This panel is real — the same component, live. Use a control and the
          page scrolls to the section describing it.
        </figcaption>
      </figure>
    </SpecimenBoundary>
  );
}
