import { useEffect, useState } from "react";

const KEY_LABELS = {
  cmd: { mac: "⌘", other: "Ctrl" },
  ctrl: { mac: "⌃", other: "Ctrl" },
  alt: { mac: "⌥", other: "Alt" },
  shift: { mac: "⇧", other: "Shift" },
  enter: { mac: "⏎", other: "Enter" },
  esc: { mac: "Esc", other: "Esc" },
};

function detectMac() {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
}

export default function Shortcut({ keys }) {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(detectMac());
  }, []);

  const parts = keys.split("+").map((k) => k.trim().toLowerCase());

  return (
    <kbd className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-text-primary/20 bg-background-light text-xs font-mono text-text-primary/80 align-baseline">
      {parts.map((part, i) => {
        const label = KEY_LABELS[part];
        const display = label
          ? isMac
            ? label.mac
            : label.other
          : part.toUpperCase();
        return (
          <span key={i} className="contents">
            {i > 0 && <span className="text-text-primary/40">+</span>}
            <span>{display}</span>
          </span>
        );
      })}
    </kbd>
  );
}
