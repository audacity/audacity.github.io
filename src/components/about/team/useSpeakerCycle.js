// src/components/about/team/useSpeakerCycle.js
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { nextIndex } from "./cycle.js";

// useLayoutEffect runs before the browser paints, which is what stops the
// random opening speaker from being visible as a swap. React warns if it's
// called during server rendering, where there's no layout to measure, so fall
// back to useEffect there — the effect body never runs on the server anyway.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const STEP_MS = 5000; // time each speaker holds the spotlight
const RESUME_MS = 8000; // idle time before auto-cycle resumes after takeover

function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Drives the active-speaker index. Auto-advances while `inView` is true and
// the user hasn't taken over. `selectSpeaker` pins a chosen index and pauses
// the rotation, which resumes after RESUME_MS of no further interaction.
// Honours prefers-reduced-motion by never auto-advancing.
export function useSpeakerCycle({ length, inView }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const resumeTimer = useRef(null);
  const randomised = useRef(false);

  // Open on a random member so the call doesn't always start on the same face.
  // Deliberately not in the useState initialiser: the page is built statically,
  // so a random value picked while rendering would be baked into the HTML —
  // identical for every visitor — and would differ from the client's pick,
  // tripping a hydration mismatch. Both passes therefore start at index 0 and
  // the shuffle happens on the client.
  //
  // It runs in a layout effect rather than a plain one so React commits the
  // new index before the browser paints. With useEffect the first painted
  // frame showed index 0 and visibly swapped a moment later.
  useIsomorphicLayoutEffect(() => {
    if (randomised.current || length <= 0) return;
    randomised.current = true;
    setActiveIndex(Math.floor(Math.random() * length));
  }, [length]);

  // Auto-advance loop.
  useEffect(() => {
    if (!inView || paused || length <= 0) return;
    if (prefersReducedMotion()) return;
    const t = setInterval(() => {
      setActiveIndex((i) => nextIndex(i, length));
    }, STEP_MS);
    return () => clearInterval(t);
  }, [inView, paused, length]);

  // Clean up the resume timer on unmount.
  useEffect(() => {
    return () => {
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    };
  }, []);

  const selectSpeaker = (index) => {
    setActiveIndex(index);
    setPaused(true);
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setPaused(false), RESUME_MS);
  };

  return { activeIndex, selectSpeaker };
}
