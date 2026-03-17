import type { PromoData } from "./types";
import audioComPromoImage from "../../img/promo/audacity-audiocom-promo.png";

const AUDIO_COM_EXIT_POPUP_IMAGE_SRC =
  typeof audioComPromoImage === "string"
    ? audioComPromoImage
    : audioComPromoImage.src;

export const popupPromos: Record<string, PromoData> = {
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
      routeAllowlist: [],
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
