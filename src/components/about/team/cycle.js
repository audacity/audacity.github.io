// Pure helper for advancing the active-speaker index. Kept separate so the
// wrapping math is unit-tested independently of the timer-driven hook.
export function nextIndex(current, length) {
  if (length <= 0) return 0;
  return (current + 1) % length;
}
