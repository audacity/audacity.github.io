// src/components/about/team/useSpeakerCycle.js
import { useEffect, useRef, useState } from "react";
import { nextIndex } from "./cycle.js";

const STEP_MS = 3500; // time each speaker holds the spotlight
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
