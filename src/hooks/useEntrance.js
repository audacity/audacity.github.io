import { useEffect, useRef, useState } from "react";
import { useInView } from "./useInView.js";

/**
 * Subtle one-shot scroll-in entrance — fade + small slide-up + tiny
 * scale settle. Returns a ref to attach to the element and the inline
 * style to spread on it.
 *
 * The animation latches: once the element has scrolled into view, it
 * stays in its "entered" state forever, so scrolling back past it
 * never replays the effect.
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
  const inView = useInView(ref, { rootMargin });
  const [hasEntered, setHasEntered] = useState(false);
  useEffect(() => {
    if (inView) setHasEntered(true);
  }, [inView]);

  const style = {
    opacity: hasEntered ? 1 : 0,
    transform: hasEntered
      ? "translateY(0) scale(1)"
      : `translateY(${offsetY}px) scale(${scaleFrom})`,
    transition: `opacity ${fadeMs}ms ${easing}, transform ${durationMs}ms ${easing}`,
    transitionDelay: hasEntered ? `${delayMs}ms` : "0ms",
    willChange: hasEntered ? "auto" : "opacity, transform",
  };

  return { ref, style, hasEntered };
}
