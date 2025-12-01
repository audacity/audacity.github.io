export type PromoData = {
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
};

const promoData: Record<string, PromoData> = {
  audacity4Alpha: {
    isActive: true,
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
};

export default promoData;
