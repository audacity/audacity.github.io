import React, { useEffect, useMemo, useState } from "react";
import { WORKSPACE_CONFIGS } from "./workspaces/workspaceConfigs.js";
import WorkspaceCanvas from "./workspaces/WorkspaceCanvas.jsx";

const WORKSPACE_KEYS = ["classic", "music", "modern", "custom"];
const FADE_MS = 180;

function summariseConfig(cfg) {
  const features = [];
  const tb = cfg.toolbar || {};
  if (tb.showCutCopyPaste)
    features.push({ icon: "✂", label: "Cut, copy, paste" });
  if (tb.showBPM) features.push({ icon: "♩", label: "BPM" });
  if (tb.showTimeSignature)
    features.push({ icon: "⏱", label: "Time signature" });
  if (tb.rulerFormat === "beats-measures")
    features.push({ icon: "▦", label: "Bars and beats ruler" });
  if (tb.showTrimSilence !== false)
    features.push({ icon: "⌫", label: "Trim silence" });
  if (cfg.envelopeMode)
    features.push({ icon: "∿", label: "Envelopes on canvas" });
  return features;
}

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
  const features = useMemo(() => summariseConfig(active), [active]);
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
    <section className="bg-background-dark px-6 lg:px-10 py-24 lg:py-32">
      <div className="max-w-screen-xl mx-auto">
        <header className="max-w-3xl">
          <h2 className="font-harmony text-text-contrast text-5xl md:text-6xl lg:text-7xl leading-[1.05]">
            Workspaces
          </h2>
          <p className="mt-6 text-text-contrast/70 text-base md:text-lg">
            Pick a workspace to see how Audacity adapts. Tools, panels, and
            shortcuts reshape around the way you actually work.
          </p>
        </header>

        <div
          role="tablist"
          aria-label="Workspaces"
          className="mt-10 lg:mt-12 flex flex-wrap gap-3"
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
                  "px-5 py-2.5 rounded-md border font-muse-sans text-base transition-colors " +
                  (isActive
                    ? "bg-text-contrast text-background-dark border-text-contrast"
                    : "bg-background-dark text-text-contrast border-white/15 hover:border-white/30")
                }
              >
                {cfg.label}
              </button>
            );
          })}
        </div>

        <div className="mt-8 lg:mt-10 grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          <div
            className="lg:col-span-3 rounded-2xl border border-white/15 p-3 lg:p-4 bg-black/40 overflow-hidden"
            role="tabpanel"
            aria-label={`${labelActive.label} workspace preview`}
            style={{
              opacity,
              transition: `opacity ${FADE_MS}ms ease`,
            }}
          >
            <div className="aspect-[16/9] rounded-lg overflow-hidden bg-black">
              <WorkspaceCanvas config={previewConfig} compact />
            </div>
          </div>

          <aside
            className="lg:col-span-2 rounded-2xl border border-white/15 p-6 lg:p-7 flex flex-col"
            style={{
              opacity,
              transition: `opacity ${FADE_MS}ms ease`,
            }}
          >
            <div
              className="font-mono text-xs tracking-[0.2em] uppercase text-text-contrast/40"
              aria-hidden
            >
              Inside {active.label}
            </div>
            <ul className="mt-4 lg:mt-5 flex flex-col gap-2.5">
              {features.map((f, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 text-text-contrast/85 text-sm lg:text-base"
                >
                  <span
                    className="inline-flex items-center justify-center w-6 h-6 rounded text-text-contrast/70"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      fontSize: 13,
                    }}
                    aria-hidden
                  >
                    {f.icon}
                  </span>
                  <span>{f.label}</span>
                </li>
              ))}
            </ul>
            <p className="mt-auto pt-6 text-text-contrast/60 text-sm leading-relaxed">
              {active.blurb}
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}

export default Workspaces;
