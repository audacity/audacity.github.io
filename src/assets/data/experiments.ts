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
    enabled: true,
  },
];

export function getExperiment(name: string): Experiment | undefined {
  return experiments.find((e) => e.name === name);
}
