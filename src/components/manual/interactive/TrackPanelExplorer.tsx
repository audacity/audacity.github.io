import { useRef, useState } from "react";
// The package's global stylesheet (theme custom properties + icon font),
// then the one component this island needs — deep subpath, same discipline
// as UIExample/registry.tsx, so the bundle carries only this component.
import "@dilsonspickles/components/style.css";
import { TrackControlPanel } from "@dilsonspickles/components/TrackControlPanel";

/*
  A live track control panel from the design system, wired to the page that
  documents it: using any control scrolls to the section describing that
  control. The specimen is the navigation.

  The heading ids are the page's own anchors — if a heading on
  audio-track-item.mdx is renamed, the matching id here must follow.
*/

const SCROLL_COOLDOWN_MS = 1500;

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
    const el = document.getElementById(id);
    if (!el) return;
    lastScroll.current = { id, at: now };

    /*
      Hand-rolled tween, tuned for hostile schedulers. Native smooth
      scrollIntoView is silently a no-op in some embedded browser panes,
      requestAnimationFrame can be suspended entirely, and timers may be
      throttled to arbitrary delays. So: the first movement happens
      synchronously in the event handler, each timeout-chained tick
      re-asserts the position (out-competing any focus scroll), and the
      final tick lands exactly on the target however late it runs.
    */
    const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
    const target = window.scrollY + el.getBoundingClientRect().top - margin;
    const from = window.scrollY;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced || from === target) {
      window.scrollTo(0, target);
    } else {
      const start = performance.now();
      const DURATION_MS = 450;
      const tick = () => {
        const p = Math.min(1, (performance.now() - start) / DURATION_MS);
        const eased = 1 - (1 - p) ** 3;
        window.scrollTo(0, from + (target - from) * eased);
        if (p < 1) window.setTimeout(tick, 16);
      };
      tick();
    }
    el.animate(
      [
        { backgroundColor: "rgba(29, 78, 216, 0.14)" },
        { backgroundColor: "transparent" },
      ],
      { duration: 1600, easing: "ease-out" },
    );
  }

  const meter = isMuted ? 0 : Math.round(volume * 0.85);

  return (
    <figure className="not-prose my-8 rounded-lg border border-gray-200 bg-gray-50 p-4">
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
      <figcaption className="mt-3 text-center text-sm text-gray-500">
        This panel is real — the same component, live. Use a control and the
        page scrolls to the section describing it.
      </figcaption>
    </figure>
  );
}
