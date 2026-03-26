export interface FeatureEntry {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  icon: string;
}

export const features: FeatureEntry[] = [
  {
    slug: "change-pitch",
    title: "Free Pitch Shifter – Change Audio Pitch Without Changing Speed",
    shortTitle: "Pitch Shifter",
    description:
      "Change pitch of audio without affecting speed. Transpose songs to any key, shift by semitones or percent.",
    icon: "icon-cycle",
  },
];
