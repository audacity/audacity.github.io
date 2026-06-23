import { useEffect, useState } from "react";

/**
 * True when the primary pointer can hover (desktop / trackpad), false on
 * touch-first devices. Used to pick between hover-to-play and
 * tap-to-toggle interaction patterns.
 *
 * Defaults to true so that during SSR / first render we ship the "hover"
 * markup, which doesn't paint anything extra; the real value applies
 * after hydration.
 */
export function useHoverCapable() {
  const [canHover, setCanHover] = useState(true);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(hover: hover)");
    setCanHover(mq.matches);
    const handler = (e) => setCanHover(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return canHover;
}
