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

/** Deterministic hash (djb2) of abId + experiment name → 0‑99 */
export function hashToSlot(abId: number, experimentName: string): number {
  const input = `${abId}:${experimentName}`;
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 100;
}

export function getForcedVariant(experimentName: string): string | null {
  if (typeof window === "undefined") return null;
  const raw = new URLSearchParams(window.location.search).get("ab");
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
    if (slot < cumulative) return v.name;
  }
  return experiment.variants[experiment.variants.length - 1].name;
}

/**
 * Resolve the active variant for an experiment:
 *  - a valid forced variant (?ab=name:variant) always wins — this previews any
 *    experiment, enabled or not, with or without a cohort cookie;
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
  const abId = getAbId();
  if (abId === null) return null;
  return getVariant(experiment, abId);
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
