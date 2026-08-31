import { useState } from "react";

/**
 * @typedef {Object} Hotspot
 * @property {number} n - Display number.
 * @property {string} label - Human-readable name.
 * @property {number} x - Left position as a percentage (0-100).
 * @property {number} y - Top position as a percentage (0-100).
 * @property {number} w - Width as a percentage (0-100).
 * @property {number} h - Height as a percentage (0-100).
 * @property {string} href - Destination URL when clicked.
 */

/**
 * @param {{
 *   src: string | { src: string },
 *   alt: string,
 *   hotspots?: Hotspot[]
 * }} props
 */
export default function UIMap({ src, alt, hotspots = [] }) {
  const [activeId, setActiveId] = useState(null);

  return (
    <figure className="not-prose my-8 border border-text-primary/10 rounded-lg overflow-hidden bg-background-light">
      <ol className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-1 px-4 py-3 text-sm bg-white border-b border-text-primary/10 list-none">
        {hotspots.map((h) => (
          <li key={h.n}>
            <a
              href={h.href}
              onMouseEnter={() => setActiveId(h.n)}
              onMouseLeave={() => setActiveId(null)}
              onFocus={() => setActiveId(h.n)}
              onBlur={() => setActiveId(null)}
              className={`flex items-baseline gap-2 rounded px-1 -mx-1 transition-colors ${
                activeId === h.n
                  ? "bg-accent/10 text-accent"
                  : "text-text-primary/80 hover:text-accent"
              }`}
            >
              <span className="font-mono text-accent font-semibold">{h.n}</span>
              <span>{h.label}</span>
            </a>
          </li>
        ))}
      </ol>

      <div className="relative">
        <img
          src={typeof src === "string" ? src : src.src}
          alt={alt}
          className="block w-full"
        />
        {hotspots.map((h) => {
          const isActive = activeId === h.n;
          return (
            <a
              key={h.n}
              href={h.href}
              title={h.label}
              onMouseEnter={() => setActiveId(h.n)}
              onMouseLeave={() => setActiveId(null)}
              onFocus={() => setActiveId(h.n)}
              onBlur={() => setActiveId(null)}
              className={`absolute flex items-start justify-start p-1 rounded transition-all ${
                isActive
                  ? "ring-2 ring-accent bg-accent/20"
                  : "ring-1 ring-transparent hover:ring-accent hover:bg-accent/10"
              }`}
              style={{
                left: `${h.x}%`,
                top: `${h.y}%`,
                width: `${h.w}%`,
                height: `${h.h}%`,
              }}
            >
              <span
                className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-mono font-semibold transition-all ${
                  isActive
                    ? "bg-accent text-white"
                    : "bg-white/90 text-accent ring-1 ring-accent"
                }`}
              >
                {h.n}
              </span>
            </a>
          );
        })}
      </div>

      {alt && (
        <figcaption className="px-4 py-2 text-xs text-text-primary/60 bg-white border-t border-text-primary/10">
          {alt}. Hover or click a number for more.
        </figcaption>
      )}
    </figure>
  );
}
