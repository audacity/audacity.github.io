/**
 * Per-page record of the last successfully saved MDX source (browser
 * localStorage) — the client half of the stale-read protection in the
 * save-safety spec.
 *
 * GitHub's read API lags its writes by a few seconds: reloading right
 * after a save can serve the pre-save content, which looks like data loss
 * and — if the writer keeps editing the stale copy — causes it. The editor
 * records what each save committed; at page load, a record that is FRESH
 * (within the window) and DIFFERENT from the server response means the
 * server is provably behind, and the local copy is what it will serve once
 * its cache catches up.
 *
 * Every storage access is try/caught: quota/disabled storage degrades to
 * feature-off, never an editor error.
 */

const KEY_PREFIX = "manual-editor:lastSave:";
/** How long a record may outvote the server. GitHub's lag is seconds; 120s covers retries with margin. */
const FRESHNESS_WINDOW_MS = 120_000;

interface LastSaveRecord {
  source: string;
  at: number;
}

function keyFor(path: string): string {
  return KEY_PREFIX + path;
}

/** Records `source` as the last content saved for `path`, timestamped now. */
export function recordLastSave(path: string, source: string): void {
  try {
    localStorage.setItem(
      keyFor(path),
      JSON.stringify({ source, at: Date.now() } satisfies LastSaveRecord),
    );
  } catch {
    // Storage unavailable/full — protection silently off.
  }
}

/**
 * Returns the recorded source when it should outvote `serverSource`
 * (recorded within the freshness window AND different), else null.
 * Expired/malformed records are pruned as a side effect.
 */
export function takeFresherLocalCopy(
  path: string,
  serverSource: string,
): string | null {
  try {
    const raw = localStorage.getItem(keyFor(path));
    if (raw === null) return null;
    let record: LastSaveRecord;
    try {
      record = JSON.parse(raw) as LastSaveRecord;
    } catch {
      localStorage.removeItem(keyFor(path));
      return null;
    }
    if (
      typeof record?.source !== "string" ||
      !Number.isFinite(record?.at) ||
      Date.now() - record.at > FRESHNESS_WINDOW_MS
    ) {
      localStorage.removeItem(keyFor(path));
      return null;
    }
    return record.source !== serverSource ? record.source : null;
  } catch {
    return null;
  }
}

/** Drops the record — reset/delete must never be shadowed by a stale local copy. */
export function clearLastSave(path: string): void {
  try {
    localStorage.removeItem(keyFor(path));
  } catch {
    // Same degradation as above.
  }
}
