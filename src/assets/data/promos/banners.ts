import type { PromoData } from "./types";

export const bannerPromos: Record<string, PromoData> = {
  audacity4Alpha: {
    type: "banner",
    isActive: false,
    priority: 50,
    suppressOnPaths: ["/next", "/download"],
    message: "Want a peek at our next big release?",
    cta: {
      text: "Try the Audacity 4 Alpha",
      link: "/next",
    },
    tracking: {
      category: "Promo CTA",
      action: "Promo CTA button",
      name: "Audacity 4 Alpha",
    },
    styles: {
      container: "bg-[#0f004d]",
      message: "text-gray-100",
      button: "bg-[#ff3254] hover:bg-[#ff1a3c] text-white",
    },
  },
  voiceByAuribus: {
    type: "banner",
    isActive: false,
    priority: 50,
    osTargets: ["Windows", "OS X"],
    message:
      "AI powered professional vocals. Transform any track with Voice by Auribus!",
    styles: {
      container: "bg-yellow-300",
      message: "text-gray-900",
      button: "bg-gray-100 hover:bg-white",
    },
    tracking: {
      category: "Promo CTA",
      action: "Promo CTA button",
      name: "Voice by Auribus MuseHub",
    },
    cta: {
      text: "Get it on MuseHub",
      link: "https://www.musehub.com/plugin/auribus?utm_source=au-web&utm_medium=au-banner&utm_campaign=au-web-mh-web-auribus",
    },
  },
  soapVoiceCleaner: {
    type: "banner",
    isActive: false,
    priority: 50,
    osTargets: ["Windows", "OS X"],
    message:
      "Soap Voice Cleaner: Professional spoken voice in 3 simple clicks!",
    styles: {
      container: "bg-yellow-300",
      message: "text-gray-900 font-bold",
      button:
        "font-bold border-2 border-gray-900 bg-gray-900 text-white hover:bg-yellow-300 hover:text-gray-900 hover:border-gray-900",
    },
    tracking: {
      category: "Promo CTA",
      action: "Promo CTA button",
      name: "Soap MuseHub",
    },
    cta: {
      text: "Get it on MuseHub",
      link: "https://www.musehub.com/plugin/soap-voice-cleaner?utm_source=au-web-banner-mh-web&utm_medium=soap-voice-cleaner&utm_campaign=au-web-banner-mh-web-soap-voice-cleaner&utm_id=au-web-banner",
    },
  },
  aceStudio2: {
    type: "banner",
    isActive: false,
    priority: 50,
    osTargets: ["Windows"],
    message:
      "ACE Studio 2.0 is here! The all-in-one workstation for AI voices, instruments and generative tools",
    styles: {
      container: "bg-yellow-300",
      message: "text-gray-900 font-bold",
      button:
        "font-bold border-2 border-gray-900 bg-gray-900 text-white hover:bg-yellow-300 hover:text-gray-900 hover:border-gray-900",
    },
    tracking: {
      category: "Promo CTA",
      action: "Promo CTA button",
      name: "ACE Studio 2.0 MuseHub",
    },
    cta: {
      text: "Get it on MuseHub",
      link: "https://www.musehub.com/app/ace-studio?utm_source=au-web-banner-mh-web&utm_medium=ace-studio-2&utm_campaign=au-web-banner-mh-web-ace-studio-2&utm_id=au-web-banner",
    },
  },
  soapTranscriber: {
    type: "banner",
    isActive: false,
    priority: 50,
    osTargets: ["Windows", "OS X"],
    message:
      "SOAP Transcriber: One click voice to text. Clean and instant transcripts. Made for Audacity.",
    styles: {
      container: "bg-yellow-300",
      message: "text-gray-900 font-bold",
      button:
        "font-bold border-2 border-gray-900 bg-gray-900 text-white hover:bg-yellow-300 hover:text-gray-900 hover:border-gray-900",
    },
    tracking: {
      category: "Promo CTA",
      action: "Promo CTA button",
      name: "SOAP Transcriber MuseHub",
    },
    cta: {
      text: "Get it on MuseHub",
      link: "https://www.musehub.com/plugin/soap-transcriber?utm_source=au-web-banner-mh-web&utm_medium=soap-transcriber&utm_campaign=au-web-banner-mh-web-soap-transcriber&utm_id=au-web-banner",
    },
  },
  overtuneBanner: {
    type: "banner",
    isActive: false,
    priority: 50,
    osTargets: ["Windows", "OS X"],
    message:
      "Overtune: The beat maker for rappers and singers. Sing, polish, and share.",
    styles: {
      container: "bg-yellow-300",
      message: "text-gray-900 font-bold",
      button:
        "font-bold border-2 border-gray-900 bg-gray-900 text-white hover:bg-yellow-300 hover:text-gray-900 hover:border-gray-900",
    },
    tracking: {
      category: "Promo CTA",
      action: "Promo CTA button",
      name: "Overtune MuseHub",
    },
    cta: {
      text: "Get it on MuseHub",
      link: "https://www.musehub.com/app/overtune-studio?utm_source=au-web-banner-mh-web&utm_medium=overtune-2&utm_campaign=au-web-banner-mh-web-overtune-2r&utm_id=au-web-banner",
    },
  },
  ampknob: {
    type: "banner",
    isActive: false,
    priority: 50,
    osTargets: ["Windows", "OS X"],
    message: "Heavy guitar tone in seconds. One knob, no distractions.",
    styles: {
      container: "bg-yellow-300",
      message: "text-gray-900 font-bold",
      button:
        "font-bold border-2 border-gray-900 bg-gray-900 text-white hover:bg-yellow-300 hover:text-gray-900 hover:border-gray-900",
    },
    tracking: {
      category: "Promo CTA",
      action: "Promo CTA button",
      name: "Ampknob Revc MuseHub",
    },
    cta: {
      text: "Try for free",
      link: "https://www.musehub.com/plugin/ampknob-revc?utm_source=audacity&utm_medium=web&utm_campaign=auampknob-revc",
    },
  },
  trinityEQ: {
    type: "banner",
    isActive: false,
    priority: 50,
    osTargets: ["Windows", "OS X"],
    message:
      "Trinity EQ: The precision EQ for mixing and mastering. Shape, warm, and refine your sound.",
    styles: {
      container: "bg-yellow-300",
      message: "text-gray-900 font-bold",
      button:
        "font-bold border-2 border-gray-900 bg-gray-900 text-white hover:bg-yellow-300 hover:text-gray-900 hover:border-gray-900",
    },
    tracking: {
      category: "Promo CTA",
      action: "Promo CTA button",
      name: "Trinity EQ MuseHub",
    },
    cta: {
      text: "Get it on MuseHub",
      link: "https://www.musehub.com/plugin/trinity-eq?utm_source=au-web-banner-mh-web&utm_medium=trinity-eq&utm_campaign=au-web-banner-mh-web-trinity-eq&utm_id=au-web-banner",
    },
  },
  audacityExplained: {
    type: "banner",
    isActive: true,
    startDate: "2026-04-29",
    endDate: "2026-05-13",
    priority: 50,
    osTargets: ["Windows", "OS X"],
    message:
      "Audacity Explained®: The complete guide to Audacity. Record, edit, and produce audio with ease.",
    styles: {
      container: "bg-yellow-300",
      message: "text-gray-900 font-bold",
      button:
        "font-bold border-2 border-gray-900 bg-gray-900 text-white hover:bg-yellow-300 hover:text-gray-900 hover:border-gray-900",
    },
    tracking: {
      category: "Promo CTA",
      action: "Promo CTA button",
      name: "Audacity Explained MuseHub",
    },
    cta: {
      text: "Learn more",
      link: "https://www.musehub.com/course/audacity-explained?utm_source=au-web-banner&utm_medium=audacity-explained",
    },
  },
  speakerDiarizationPro: {
    type: "banner",
    isActive: true,
    startDate: "2026-04-14",
    endDate: "2026-04-28",
    priority: 50,
    osTargets: ["Windows", "OS X"],
    message:
      "Speaker Diarization Pro: The AI tool for splitting multi-speaker audio. Detect, separate, and export voices instantly.",
    styles: {
      container: "bg-yellow-300",
      message: "text-gray-900 font-bold",
      button:
        "font-bold border-2 border-gray-900 bg-gray-900 text-white hover:bg-yellow-300 hover:text-gray-900 hover:border-gray-900",
    },
    tracking: {
      category: "Promo CTA",
      action: "Promo CTA button",
      name: "Speaker Diarization Pro MuseHub",
    },
    cta: {
      text: "Get it on MuseHub",
      link: "https://www.musehub.com/plugin/speaker-diarization-pro?utm_source=au-web-banner-mh-web&utm_medium=speaker-diarization-pro&utm_campaign=au-web-banner-mh-web-speaker-diarization-pro&utm_id=au-web-banner",
    },
  },
  survey: {
    type: "banner",
    isActive: false,
    priority: 50,
    message: "3 minute survey:\nHelp us understand what features you want next",
    styles: {
      container: "bg-yellow-300",
      message: "text-lg text-gray-900",
      button:
        "h-10 bg-gray-100 hover:bg-white border border-gray-900 text-gray-900",
    },
    tracking: {
      category: "Promo CTA",
      action: "Survey CTA button",
      name: "Go to Survey",
    },
    cta: {
      text: "Take the survey",
      link: "https://docs.google.com/forms/d/e/1FAIpQLScxH_f64JPCWt5nwqa8MTPXfmi453mqYwy1xZFPF_mx9mYkNw/viewform",
    },
  },
};
