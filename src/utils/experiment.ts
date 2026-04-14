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

export function getVariant(experiment: Experiment, abId: number): string {
  const slot = hashToSlot(abId, experiment.name);
  let cumulative = 0;
  for (const v of experiment.variants) {
    cumulative += v.weight;
    if (slot < cumulative) return v.name;
  }
  return experiment.variants[experiment.variants.length - 1].name;
}

export function getAllAssignments(): Record<string, string> {
  const abId = getAbId();
  if (abId === null) return {};
  const result: Record<string, string> = {};
  for (const exp of experiments) {
    if (!exp.enabled) continue;
    result[exp.name] = getVariant(exp, abId);
  }
  return result;
}

export function formatAssignments(assignments: Record<string, string>): string {
  return Object.entries(assignments)
    .map(([name, variant]) => `${name}:${variant}`)
    .join("|");
}
