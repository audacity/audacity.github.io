export interface FeatureEntry {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  icon: string;
  showInFooter?: boolean;
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
    slug: "compressor",
    title: "Free Audio Compressor – Control Dynamic Range | Audacity",
    shortTitle: "Compressor",
    description:
      "Compress audio to even out volume levels. Reduce peaks and boost quiet parts for a polished, consistent sound.",
    icon: "icon-waveform",
    showInFooter: true,
  },
  {
    slug: "speed-changer",
    title: "Free Audio Speed Changer – Change Speed and Pitch | Audacity",
    shortTitle: "Speed Changer",
    description:
      "Change the speed of audio while keeping pitch intact, or adjust both together. Simple controls, instant results.",
    icon: "icon-cycle",
    showInFooter: true,
  },
  {
    slug: "change-pitch",
    title: "Free Pitch Shifter – Change Audio Pitch Without Changing Speed",
    shortTitle: "Pitch Changer",
    description:
      "Change pitch of audio without affecting speed. Transpose songs to any key, shift by semitones or percent.",
    icon: "icon-cycle",
    showInFooter: true,
  },
  {
    slug: "noise-reduction",
    title: "Free Noise Reduction Tool – Remove Background Noise | Audacity",
    shortTitle: "Noise Reduction",
    description:
      "Remove background noise from audio for free. Eliminate hiss, hum, fan noise, and buzzing from any recording.",
    icon: "icon-waveform",
    showInFooter: true,
  },
  {
    slug: "vocal-remover",
    title: "Free Vocal Remover – Remove Vocals from Any Song | Audacity",
    shortTitle: "Vocal Remover",
    description:
      "Remove vocals from any song for free. AI-powered stem separation for karaoke, remixes, and covers. No limits, no subscription.",
    icon: "icon-microphone",
    showInFooter: true,
  },
];
