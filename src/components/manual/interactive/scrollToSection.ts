/*
  Shared scroll-to-anchor for the interactive manual specimens.

  Hand-rolled tween, tuned for hostile schedulers: native smooth
  scrollIntoView is silently a no-op in some embedded browser panes,
  requestAnimationFrame can be suspended entirely, and timers may be
  throttled to arbitrary delays. So the first movement happens synchronously
  in the caller's event handler, each timeout-chained tick re-asserts the
  position (out-competing any focus scroll), and the final tick lands exactly
  on the target however late it runs.
*/

const DURATION_MS = 450;

export function scrollToSection(id: string): boolean {
  const el = document.getElementById(id);
  if (!el) return false;

  const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
  const target = window.scrollY + el.getBoundingClientRect().top - margin;
  const from = window.scrollY;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduced || from === target) {
    window.scrollTo(0, target);
  } else {
    const start = performance.now();
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
  return true;
}
