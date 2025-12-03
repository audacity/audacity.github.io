export type PromoType = "banner" | "video";

export type PromoData = {
  type?: PromoType;
  isActive?: boolean;
  priority?: number;
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

export type FilterOptions = {
  type?: PromoType;
  os?: string | null;
  path?: string | null;
};

/** Get all promos matching the filter criteria, sorted by priority (highest first) */
export const getFilteredPromos = (
  promos: PromoData[],
  options: FilterOptions = {}
): PromoData[] => {
  const { type, os, path } = options;

  return promos
    .filter((promo) => {
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
    })
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
};

/** Get the top N promos matching the filter criteria */
export const getTopPromos = (
  promos: PromoData[],
  count: number,
  options: FilterOptions = {}
): PromoData[] => {
  return getFilteredPromos(promos, options).slice(0, count);
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
    isActive: true,
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
  ampknob: {
    type: "banner",
    isActive: false,
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
    priority: 100,
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
    isActive: true,
    priority: 90,
    message: "Install once. Access tons of powerful plugins. Blend for infinite creativity.",
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
};

export default promoData;
