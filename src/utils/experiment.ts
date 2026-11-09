import { experiments, type Experiment } from "../assets/data/experiments";

const COOKIE_NAME = "aud_ab_id";

export function getAbId(): number | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));
  if (!match) return null;
  const val = parseInt(match.split("=")[1], 10);
  return Number.isFinite(val) ? val : null;
}

/**
 * Slots per experiment. Weights are percentages, so 10000 slots (basis points)
 * lets a weight carry two decimals — e.g. a 10% control plus four 22.5% arms.
 */
export const SLOTS = 10000;

/** Deterministic hash (djb2) of abId + experiment name → 0‑9999 */
export function hashToSlot(abId: number, experimentName: string): number {
  const input = `${abId}:${experimentName}`;
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % SLOTS;
}

/** sessionStorage key the BaseLayout bootstrap remembers a ?ab= force under. */
export const FORCE_KEY = "audacity-ab";

/**
 * The raw force string ("name:variant|name2:variant2"), from the URL when the
 * page was opened with ?ab=, otherwise the one the bootstrap remembered for
 * this tab. The bootstrap strips the query string before paint, so by the time
 * module scripts run the stored copy is usually the one that applies.
 * ?ab=off (or an empty ?ab=) means "no force".
 */
export function getForceString(): string | null {
  if (typeof window === "undefined") return null;
  const raw = new URLSearchParams(window.location.search).get("ab");
  if (raw !== null) return raw && raw !== "off" ? raw : null;
  try {
    return sessionStorage.getItem(FORCE_KEY);
  } catch {
    return null;
  }
}

export function getForcedVariant(experimentName: string): string | null {
  const raw = getForceString();
  if (!raw) return null;
  for (const segment of raw.split("|")) {
    const [name, variant] = segment.split(":");
    if (name === experimentName && variant) return variant;
  }
  return null;
}

export function getVariant(experiment: Experiment, abId: number): string {
  const forced = getForcedVariant(experiment.name);
  if (forced !== null && experiment.variants.some((v) => v.name === forced)) {
    return forced;
  }
  const slot = hashToSlot(abId, experiment.name);
  let cumulative = 0;
  for (const v of experiment.variants) {
    cumulative += v.weight;
    if (slot < Math.round((cumulative * SLOTS) / 100)) return v.name;
  }
  return experiment.variants[experiment.variants.length - 1].name;
}

/**
 * Resolve the active variant for an experiment:
 *  - a valid forced variant (?ab=name:variant, remembered for the tab by the
 *    bootstrap) always wins — this previews any experiment, enabled or not,
 *    with or without a cohort cookie;
 *  - otherwise only enabled experiments auto-assign a cohort by hashing the
 *    aud_ab_id cookie;
 *  - returns null when nothing applies.
 *
 * Keep this in sync with the inline bootstrap in BaseLayout.astro, which has to
 * re-implement the same rule in vanilla JS to set data-exp-* before paint.
 */
export function resolveVariant(experiment: Experiment): string | null {
  const forced = getForcedVariant(experiment.name);
  if (forced !== null && experiment.variants.some((v) => v.name === forced)) {
    return forced;
  }
  if (!experiment.enabled) return null;
  if (isExcludedOs(experiment)) return null;
  const abId = getAbId();
  if (abId === null) return null;
  return getVariant(experiment, abId);
}

/**
 * The visitor's OS as the BaseLayout bootstrap wrote it to <html data-os>
 * before paint ("win", "mac", "linux"), or null outside a document.
 */
export function getOs(): string | null {
  if (typeof document === "undefined") return null;
  return document.documentElement?.getAttribute?.("data-os") ?? null;
}

export function isExcludedOs(experiment: Experiment): boolean {
  const os = getOs();
  return os !== null && (experiment.excludeOs ?? []).includes(os);
}

export function getAllAssignments(): Record<string, string> {
  const result: Record<string, string> = {};
  for (const exp of experiments) {
    const variant = resolveVariant(exp);
    if (variant !== null) result[exp.name] = variant;
  }
  return result;
}

export function formatAssignments(assignments: Record<string, string>): string {
  return Object.entries(assignments)
    .map(([name, variant]) => `${name}:${variant}`)
    .join("|");
}
