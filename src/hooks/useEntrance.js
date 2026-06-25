import { useEffect, useRef, useState } from "react";
import { useInView } from "./useInView.js";

/**
 * Subscribes to `prefers-reduced-motion`. Defaults to `false` on SSR
 * and the first client render (so server output matches the "no
 * motion preference" case), then updates from `matchMedia` once mounted
 * and tracks live changes.
 */
function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mql) return;
    setReduced(mql.matches);
    const onChange = (e) => setReduced(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/**
 * Subtle one-shot scroll-in entrance — fade + small slide-up + tiny
 * scale settle. Returns a ref to attach to the element and the inline
 * style to spread on it.
 *
 * The animation latches: once the element has scrolled into view, it
 * stays in its "entered" state forever, so scrolling back past it
 * never replays the effect.
 *
 * Honours `prefers-reduced-motion: reduce` — when on, returns an
 * empty style (no opacity/transform/transition) so the element
 * renders in its natural state with no entrance animation at all.
 *
 *   const entrance = useEntrance();
 *   <div ref={entrance.ref} style={{ ...entrance.style, ...myStyle }}>
 *
 * Tweak `offsetY` / `scaleFrom` for a stronger/lighter feel, or pass
 * `rootMargin` to change when the trigger fires (negative values delay
 * it; positive values pre-warm it earlier).
 */
export function useEntrance({
  rootMargin = "-80px",
  offsetY = 28,
  scaleFrom = 0.985,
  durationMs = 900,
  fadeMs = 700,
  delayMs = 0,
  easing = "cubic-bezier(0.4, 0, 0.2, 1)",
} = {}) {
  const ref = useRef(null);
  const reducedMotion = useReducedMotion();
  const inView = useInView(ref, { rootMargin });
  const [hasEntered, setHasEntered] = useState(false);
  useEffect(() => {
    if (inView) setHasEntered(true);
  }, [inView]);

  // When reduced motion is requested, drop the entrance entirely. The
  // empty style means the element renders at its natural state, with
  // no transition applied — so even the change from "pre-mount false"
  // to "post-mount reduced" snaps instantly rather than animating.
  const style = reducedMotion
    ? {}
    : {
        opacity: hasEntered ? 1 : 0,
        transform: hasEntered
          ? "translateY(0) scale(1)"
          : `translateY(${offsetY}px) scale(${scaleFrom})`,
        transition: `opacity ${fadeMs}ms ${easing}, transform ${durationMs}ms ${easing}`,
        transitionDelay: hasEntered ? `${delayMs}ms` : "0ms",
        willChange: hasEntered ? "auto" : "opacity, transform",
      };

  return { ref, style, hasEntered: reducedMotion || hasEntered };
}
