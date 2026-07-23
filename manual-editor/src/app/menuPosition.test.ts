import { expect, test } from "bun:test";
import { computeMenuPosition } from "./menuPosition";

const VIEWPORT = { width: 1200, height: 800 };
const MENU = { width: 280, height: 320 };

test("opens below the caret when there is room below", () => {
  // Caret near the top: plenty of space below.
  const { top, left } = computeMenuPosition(
    { left: 100, top: 100, bottom: 120 },
    MENU,
    VIEWPORT,
  );
  expect(top).toBe(120); // rect.bottom
  expect(left).toBe(100); // rect.left
});

test("flips above the caret when there is not enough room below", () => {
  // Caret near the bottom (bottom at 760 of an 800px viewport): only 40px
  // below, far less than the 320px menu → must flip above.
  const { top } = computeMenuPosition(
    { left: 100, top: 740, bottom: 760 },
    MENU,
    VIEWPORT,
  );
  // Placed above: caret.top - menu.height = 740 - 320 = 420.
  expect(top).toBe(420);
});

test("flipped-above menu never renders above the top edge", () => {
  // Caret low, but menu taller than the space above the caret too. The
  // roomier side (below has 40, above has 740) is above; clamp keeps it on
  // screen.
  const tallMenu = { width: 280, height: 900 };
  const { top } = computeMenuPosition(
    { left: 100, top: 760, bottom: 780 },
    tallMenu,
    VIEWPORT,
  );
  expect(top).toBe(8); // clamped to top margin
});

test("clamps the left edge so the menu never overflows the right side", () => {
  // Caret far right: left at 1100, menu 280 wide → 1100+280 = 1380 > 1200.
  const { left } = computeMenuPosition(
    { left: 1100, top: 100, bottom: 120 },
    MENU,
    VIEWPORT,
  );
  // Clamped to viewport.width - menu.width - margin = 1200 - 280 - 8 = 912.
  expect(left).toBe(912);
});

test("keeps the left edge off the left margin for a caret at x=0", () => {
  const { left } = computeMenuPosition(
    { left: 0, top: 100, bottom: 120 },
    MENU,
    VIEWPORT,
  );
  expect(left).toBe(8); // clamped up to the left margin
});

test("when neither side fits, chooses the side with more room", () => {
  const tallMenu = { width: 280, height: 500 };
  // Caret slightly below centre: below has 800-420-8=372, above has 400-8=392.
  // Above is roomier → flip above (then clamp).
  const belowCentre = computeMenuPosition(
    { left: 100, top: 400, bottom: 420 },
    tallMenu,
    VIEWPORT,
  );
  // caret.top - height = 400 - 500 = -100 → clamped to margin 8.
  expect(belowCentre.top).toBe(8);

  // Caret slightly above centre: below has 800-380-8=412, above has 360-8=352.
  // Below is roomier → open below (at rect.bottom=380), but a 500px menu would
  // overflow the bottom, so it's clamped up to 800-500-8=292.
  const aboveCentre = computeMenuPosition(
    { left: 100, top: 360, bottom: 380 },
    tallMenu,
    VIEWPORT,
  );
  expect(aboveCentre.top).toBe(292);
});
