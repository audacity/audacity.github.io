export interface FeatureEntry {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  icon: string;
}

export const features: FeatureEntry[] = [
  {
    slug: "cut",
    title: "Free Audio Cutter – Cut Audio Precisely | Audacity",
    shortTitle: "Cut Audio",
    description:
      "Cut unwanted sections from audio. Remove mistakes, trim silence, or rearrange clips with the Cut command.",
    icon: "icon-waveform",
  },
  {
    slug: "reverse",
    title: "Reverse Audio Effect – Play Sound Backwards | Audacity",
    shortTitle: "Reverse Audio",
    description:
      "Reverse audio in one click. Play selections backwards for drops, reverse reverb, backmasking, and sound design.",
    icon: "icon-cycle",
  },
  {
    slug: "trim",
    title: "Free Audio Trimmer – Trim Start and End of Audio | Audacity",
    shortTitle: "Trim Audio",
    description:
      "Trim audio to keep only the part you want. Crop intros, outros, and silence in one click with Ctrl+T.",
    icon: "icon-waveform",
  },
  {
    slug: "split",
    title: "Split Audio into Clips – Free Split Tool | Audacity",
    shortTitle: "Split Audio",
    description:
      "Split audio into separate clips at the cursor. Non-destructive — no audio removed, just new clip boundaries.",
    icon: "icon-waveform",
  },
  {
    slug: "reverb",
    title: "Free Reverb Effect – Add Room, Hall & Cathedral | Audacity",
    shortTitle: "Reverb",
    description:
      "Add natural reverb to vocals, instruments, and podcasts. Room, hall, and cathedral presets included.",
    icon: "icon-cycle",
  },
  {
    slug: "transcription",
    title: "Free AI Audio Transcription – Speech to Text | Audacity",
    shortTitle: "AI Transcription",
    description:
      "Transcribe speech to text locally with Whisper AI. No uploads, no minute limits, no subscription.",
    icon: "icon-waveform",
  },
  {
    slug: "delete",
    title: "Free Audio Delete Tool – Remove Sections Fast | Audacity",
    shortTitle: "Delete Audio",
    description:
      "Delete unwanted sections without touching your clipboard. Remove mistakes, strip intros, and clean recordings.",
    icon: "icon-waveform",
  },
  {
    slug: "distortion",
    title: "Free Distortion Effect – Fuzz, Overdrive, Grit | Audacity",
    shortTitle: "Distortion",
    description:
      "Add distortion, overdrive, fuzz and clipping to guitar, vocals and sound design. 11 distortion types.",
    icon: "icon-cycle",
  },
  {
    slug: "change-pitch",
    title: "Free Pitch Shifter – Change Audio Pitch Without Changing Speed",
    shortTitle: "Pitch Shifter",
    description:
      "Change pitch of audio without affecting speed. Transpose songs to any key, shift by semitones or percent.",
    icon: "icon-cycle",
  },
  {
    slug: "noise-reduction",
    title: "Free Noise Reduction Tool – Remove Background Noise | Audacity",
    shortTitle: "Noise Reduction",
    description:
      "Remove background noise from audio for free. Eliminate hiss, hum, fan noise, and buzzing from any recording.",
    icon: "icon-waveform",
  },
  {
    slug: "vocal-remover",
    title: "Free Vocal Remover – Remove Vocals from Any Song | Audacity",
    shortTitle: "Vocal Remover",
    description:
      "Remove vocals from any song for free. AI-powered stem separation for karaoke, remixes, and covers. No limits, no subscription.",
    icon: "icon-microphone",
  },
];
