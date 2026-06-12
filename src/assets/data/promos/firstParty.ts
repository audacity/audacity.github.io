import type { PromoData } from "./types";
import audioComPromoImage from "../../img/promo/audacity-audiocom-promo.png";

/**
 * First-party, site-owned promos.
 *
 * These are NOT partner promos and do not live on the Confluence promo
 * calendar, so they are maintained here by hand. Everything that DOES appear
 * on Confluence is generated into ./campaigns.ts by `bun run pull-campaigns` — do
 * not duplicate campaign promos here.
 */

const AUDIO_COM_EXIT_POPUP_IMAGE_SRC =
  typeof audioComPromoImage === "string"
    ? audioComPromoImage
    : audioComPromoImage.src;

export const firstPartyPromos: Record<string, PromoData> = {
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
  audioComExitPopup: {
    type: "exit-popup",
    isActive: true,
    priority: 50,
    message:
      "Use Audio.com to back up your projects, and share them from anywhere!",
    cta: {
      text: "Join Audio.com",
      link: "https://audio.com/audacity/auth/sign-in?mtm_campaign=audacityteamorg&mtm_content=exit-intent-popup",
    },
    popupOptions: {
      title: "Leave before setting up cloud storage?",
      // Scoped to the 3 routes that account for ~96% of impressions (Matomo,
      // Jun 2026): the download funnel, the post-download page, and the
      // homepage. The long tail (features/blog/faq/legal/next) had <4% combined
      // and was cut. Empty array = every page, so keep this list populated.
      routeAllowlist: ["/", "/download", "/post-download"],
      displayMode: "modal",
      promoImageSrc: AUDIO_COM_EXIT_POPUP_IMAGE_SRC,
      promoImageAlt: "Audio.com promotion",
      dismissText: "Leave site",
      policy: {
        minDwellMs: 3000,
      },
      impressionTracking: {
        category: "Exit Intent",
        action: "exit_intent_impression",
        name: "audio.com Exit Intent Popup",
      },
      dismissTracking: {
        category: "Exit Intent",
        action: "exit_intent_dismiss",
        name: "audio.com Exit Intent Popup",
      },
    },
    tracking: {
      category: "Exit Intent",
      action: "exit_intent_cta_click",
      name: "audio.com Exit Intent Popup",
    },
  },
};
