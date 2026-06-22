import { useEffect, useState } from "react";

/**
 * Returns true when the observed element is intersecting the viewport.
 * Default rootMargin pre-warms slightly before the element scrolls in so
 * the first animation frame isn't visibly the "first frame ever".
 *
 * On SSR or in environments without IntersectionObserver, defaults to
 * true so animations aren't permanently frozen.
 */
export function useInView(ref, { rootMargin = "200px", threshold = 0 } = {}) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const node = ref?.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin, threshold },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [ref, rootMargin, threshold]);
  return inView;
}
