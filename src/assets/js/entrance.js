/*
  Reveals elements marked with data-entrance, and the direct children of
  containers marked data-entrance-group, as they scroll into view. The hidden
  state itself lives in CSS (see input.css) so it applies from first paint;
  this only adds the .is-in class that releases it.

  data-entrance-group takes an optional stagger in milliseconds:
    <div data-entrance-group="90"> — 0ms, 90ms, 180ms, ...

  Wrapped in an IIFE with no exports: nothing imports this, it just runs, and
  the form makes that obvious. Astro inlines it into the page rather than
  emitting a separate bundle, so it costs no extra request.
*/
(function () {
  const DEFAULT_STAGGER_MS = 90;
  const ROOT_MARGIN = "-40px";

  function collect() {
    const singles = Array.from(document.querySelectorAll("[data-entrance]"));
    const grouped = [];
    document.querySelectorAll("[data-entrance-group]").forEach((group) => {
      const step = Number(group.dataset.entranceGroup) || DEFAULT_STAGGER_MS;
      Array.from(group.children).forEach((child, i) => {
        // Stagger is set here rather than in the markup so adding or removing
        // a card doesn't mean renumbering delays by hand.
        child.style.setProperty("--entrance-delay", i * step + "ms");
        grouped.push(child);
      });
    });
    return singles.concat(grouped);
  }

  function reveal(el) {
    el.classList.add("is-in");
  }

  const els = collect();
  if (!els.length) return;

  // No IntersectionObserver means no way to know when something scrolls in,
  // so show everything rather than leave it hidden.
  if (typeof IntersectionObserver === "undefined") {
    els.forEach(reveal);
    return;
  }

  const io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        reveal(entry.target);
        io.unobserve(entry.target); // one-shot: never replay on scroll back
      });
    },
    { rootMargin: ROOT_MARGIN },
  );

  els.forEach(function (el) {
    io.observe(el);
  });
})();
