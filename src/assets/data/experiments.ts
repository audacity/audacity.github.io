export type Variant = {
  name: string;
  weight: number;
};

export type Experiment = {
  name: string;
  variants: Variant[];
  enabled: boolean;
};

/**
 * Register experiments here. Each experiment needs a unique name, two or more
 * weighted variants, and an `enabled` flag.
 *
 * Example 50/50 test:
 *
 *   {
 *     name: "hero-cta",
 *     variants: [
 *       { name: "control", weight: 50 },
 *       { name: "variant-b", weight: 50 },
 *     ],
 *     enabled: true,
 *   },
 */
export const experiments: Experiment[] = [
  {
    name: "nav-logo",
    variants: [
      { name: "control", weight: 50 },
      { name: "text-only", weight: 50 },
    ],
    enabled: false,
  },
  {
    name: "musehub-download",
    variants: [
      { name: "control", weight: 50 },
      { name: "direct-download", weight: 50 },
    ],
    enabled: false,
  },
  {
    name: "musehub-badge",
    variants: [
      { name: "control", weight: 34 },
      { name: "badge-musehub", weight: 33 },
      { name: "badge-download", weight: 33 },
    ],
    enabled: false,
  },
  // Iteration 3 (homepage hero only): copy/messaging test after the badge arms
  // lost in the iteration 2 badge test. Arm names match the Confluence/Figma
  // A/B/C/D labels. Treatment arms (b/c/d) add a descriptive line and drop the
  // "Download without MuseHub" secondary link.
  //   a — original hero, untouched (holdout / "A")
  //   b — header "Audacity", "Download Audacity <ver>" button (text effect alone)
  //   c — header "Audacity", "download on musehub" badge
  //   d — header "Download Audacity", "download on musehub" badge
  // Disabled after the June 2026 run. Re-enable only for a new, separately
  // reported experiment (requires a redeploy since the enabled set is baked
  // into the BaseLayout bootstrap script).
  {
    name: "musehub-copy",
    variants: [
      { name: "a", weight: 25 },
      { name: "b", weight: 25 },
      { name: "c", weight: 25 },
      { name: "d", weight: 25 },
    ],
    enabled: false,
  },
];

export function getExperiment(name: string): Experiment | undefined {
  return experiments.find((e) => e.name === name);
}
