export type PromoType = "banner" | "video";

export type PromoData = {
  type?: PromoType;
  isActive?: boolean;
  priority?: number;
  slot?: number;
  osTargets?: string[];
  suppressOnPaths?: string[];
  message: string;
  styles?: {
    container?: string;
    message?: string;
    button?: string;
  };
  tracking?: {
    category: string;
    action: string;
    name: string;
  };
  cta?: {
    text: string;
    link: string;
  };
  // Video-specific properties
  video?: {
    placeholderImage: string;
    imageAltText: string;
    videoURL: string;
  };
};

type FilterOptions = {
  type?: PromoType;
  os?: string | null;
  path?: string | null;
};

/** Get all promos matching the filter criteria */
export const getFilteredPromos = (
  promos: PromoData[],
  options: FilterOptions = {},
): PromoData[] => {
  const { type, os, path } = options;

  return promos.filter((promo) => {
    // Check if active
    if (promo.isActive === false) return false;

    // Check type match
    if (type && promo.type !== type) return false;

    // Check path suppression
    if (path && promo.suppressOnPaths?.includes(path)) return false;

    // Check OS targeting
    if (promo.osTargets && promo.osTargets.length > 0) {
      if (!os || !promo.osTargets.includes(os)) return false;
    }

    return true;
  });
};

const promoData: Record<string, PromoData> = {
  // === BANNER PROMOS ===
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
      name: "Voice by Auribus Muse Hub",
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
      name: "Soap Muse Hub",
    },
    cta: {
      text: "Get it on MuseHub",
      link: "https://www.musehub.com/plugin/soap-voice-cleaner?utm_source=au-web-banner-mh-web&utm_medium=soap-voice-cleaner&utm_campaign=au-web-banner-mh-web-soap-voice-cleaner&utm_id=au-web-banner",
    },
  },
  aceStudio2: {
    type: "banner",
    isActive: true,
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
      name: "ACE Studio 2.0 Muse Hub",
    },
    cta: {
      text: "Get it on MuseHub",
      link: "https://www.musehub.com/app/ace-studio?utm_source=au-web-banner-mh-web&utm_medium=ace-studio-2&utm_campaign=au-web-banner-mh-web-ace-studio-2&utm_id=au-web-banner",
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
      name: "Ampknob Revc Muse Hub",
    },
    cta: {
      text: "Try for free",
      link: "https://www.musehub.com/plugin/ampknob-revc?utm_source=audacity&utm_medium=web&utm_campaign=auampknob-revc",
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

  // === VIDEO PROMOS ===
  audacity4Video: {
    type: "video",
    isActive: true,
    priority: 50,
    slot: 1,
    message: "How we're building Audacity 4",
    tracking: {
      category: "Video embed",
      action: "Watch release video",
      name: "How we're building Audacity 4",
    },
    video: {
      placeholderImage: "https://i.ytimg.com/vi/QYM3TWf_G38/maxresdefault.jpg",
      imageAltText: "Video thumbnail: How we're building Audacity 4",
      videoURL: "https://www.youtube-nocookie.com/embed/QYM3TWf_G38?autoplay=1",
    },
  },
  playgrndFxVideo: {
    type: "video",
    isActive: false,
    priority: 50,
    slot: 2,
    message:
      "Install once. Access tons of powerful plugins. Blend for infinite creativity.",
    cta: {
      text: "Get it on MuseHub",
      link: "https://www.musehub.com/plugin/playgrnd-fx?utm_source=au-web&utm_medium=mh-web-cta&utm_campaign=au-web-mh-web-playgrnd-fx",
    },
    tracking: {
      category: "Video embed",
      action: "Watch release video",
      name: "PLAYGRND FX",
    },
    video: {
      placeholderImage: "https://i.ytimg.com/vi/UGiJCTu67Ak/maxresdefault.jpg",
      imageAltText: "Video thumbnail: PLAYGRND FX",
      videoURL: "https://www.youtube-nocookie.com/embed/UGiJCTu67Ak?autoplay=1",
    },
  },
  landrFxVoiceVideo: {
    type: "video",
    isActive: false,
    priority: 50,
    slot: 2,
    message: "One knob for polished studio quality vocals",
    cta: {
      text: "Get it on MuseHub",
      link: "https://www.musehub.com/plugin/landr-fx-voice?utm_source=au-web&utm_medium=au-web-video&utm_campaign=au-web-mh-web-landr-fx-voice",
    },
    tracking: {
      category: "Video embed",
      action: "Watch release video",
      name: "LANDR FX Voice",
    },
    video: {
      placeholderImage: "https://i.ytimg.com/vi/JKAvMrLpIRI/maxresdefault.jpg",
      imageAltText: "Video thumbnail: LANDR FX Voice",
      videoURL: "https://www.youtube-nocookie.com/embed/JKAvMrLpIRI?autoplay=1",
    },
  },
  overtuneVideo: {
    type: "video",
    isActive: true,
    priority: 50,
    slot: 2,
    message:
      "Record your vocals on top of premium beats! Polish, personalize and share with ease",
    cta: {
      text: "Get it on MuseHub",
      link: "https://www.musehub.com/app/overtune-studio?utm_source=au-web&utm_medium=au-web-video&utm_campaign=au-web-mh-web-overtune-2",
    },
    tracking: {
      category: "Video embed",
      action: "Watch release video",
      name: "Overtune",
    },
    video: {
      placeholderImage: "https://i.ytimg.com/vi/A4jPvCdbrKA/hqdefault.jpg",
      imageAltText: "Video thumbnail: Overtune",
      videoURL: "https://www.youtube-nocookie.com/embed/A4jPvCdbrKA?autoplay=1",
    },
  },
};

export default promoData;
