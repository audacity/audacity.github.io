/**
 * Shared caret-relative positioning for the floating suggestion popups (the
 * `/` slash menu and the `@` page-mention menu). Both render a `fixed`-position
 * card anchored to the caret's `clientRect`; this computes where to place it so
 * it stays fully on screen.
 *
 * The core behaviour writers care about: the menu prefers to open *below* the
 * caret, but flips *above* it when there isn't enough room below (e.g. the
 * caret is near the bottom of the viewport) — otherwise the menu would spill
 * off the bottom edge and its lower items would be unreachable. Both axes are
 * additionally clamped to the viewport so the card never renders partly
 * off-screen.
 */

/** The caret anchor rect (a subset of `DOMRect`; only these fields are read). */
export interface CaretRect {
  left: number;
  top: number;
  bottom: number;
}

/** The popup's rendered size (`offsetWidth`/`offsetHeight`). */
export interface MenuSize {
  width: number;
  height: number;
}

/** The available viewport (`window.innerWidth`/`innerHeight`). */
export interface Viewport {
  width: number;
  height: number;
}

export interface MenuPosition {
  left: number;
  top: number;
}

/** Gap kept between the menu and both the caret and the viewport edges. */
const MARGIN = 8;

/**
 * Returns the `{ left, top }` (in `fixed`/viewport coordinates) to place a
 * popup of size `menu` anchored to `caret`, kept within `viewport`.
 *
 * Vertical: open below the caret when the menu fits there; otherwise flip
 * above when it fits above; otherwise fall back to whichever side has more
 * room. The result is then clamped so the menu's top and bottom stay within
 * the viewport (the menu's own `max-height`/`overflow-y` handles the rare case
 * where it's taller than the whole viewport).
 *
 * Horizontal: align the menu's left edge to the caret, clamped so its right
 * edge doesn't run past the viewport.
 */
export function computeMenuPosition(
  caret: CaretRect,
  menu: MenuSize,
  viewport: Viewport,
): MenuPosition {
  const spaceBelow = viewport.height - caret.bottom - MARGIN;
  const spaceAbove = caret.top - MARGIN;

  let top: number;
  if (menu.height <= spaceBelow) {
    top = caret.bottom;
  } else if (menu.height <= spaceAbove) {
    top = caret.top - menu.height;
  } else {
    // Doesn't fully fit either side — use the roomier one and let the clamp
    // (plus the menu's internal scroll) keep it usable.
    top = spaceBelow >= spaceAbove ? caret.bottom : caret.top - menu.height;
  }
  top = Math.max(MARGIN, Math.min(top, viewport.height - menu.height - MARGIN));

  const left = Math.max(
    MARGIN,
    Math.min(caret.left, viewport.width - menu.width - MARGIN),
  );

  return { left, top };
}
