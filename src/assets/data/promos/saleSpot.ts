/**
 * The MuseHub Black Friday & Year End sale promo, shown on the homepage in
 * one of four spots by the "promo-spot" experiment (see experiments.ts).
 *
 * Copy, numbers and dates are placeholders from the Figma mockups until
 * MuseHub signs off the final copy — every string the visitor reads lives
 * here so that swap is one file.
 */

export type SaleSpotArm = "a" | "b" | "c" | "d";

export const SALE_SPOT_EXPERIMENT = "promo-spot";

/** Tags analytics events and the dismissal/view-count storage keys. */
export const SALE_SPOT_CAMPAIGN = "mh-bf-2026";

/**
 * The promo hides itself from this moment on, even if the experiment is
 * still enabled, so a missed cleanup deploy can't advertise a finished sale.
 * End of 4 Jan 2027, Central European Time.
 */
export const SALE_SPOT_ENDS_AT = "2027-01-05T00:00:00+01:00";

/** What the countdowns count down to. */
export const SALE_SPOT_COUNTDOWN_TO = SALE_SPOT_ENDS_AT;

const SALE_URL =
  "https://www.musehub.com/category/on-sale?utm_medium=Referral&utm_source=AU&utm_campaign=MH_WW_REF_AU_WEB_ALL_091126_crosslink";

/** utm_content per spot, as agreed with MuseHub on the Confluence page. */
const UTM_CONTENT: Record<SaleSpotArm, string> = {
  a: "au-site-banner-top",
  b: "au-site-banner-underhero",
  c: "au-site-banner-sticky",
  d: "au-site-banner-mhspot",
};

export const saleSpotHref = (arm: SaleSpotArm): string =>
  `${SALE_URL}&utm_content=${UTM_CONTENT[arm]}`;

export const saleSpotCopy = {
  /** Bars (A, B, C): "<lead> <offer>" then the countdown and button. */
  barLead: "MuseHub Black Friday:",
  barOffer: "Up to 88% off",
  barButton: "Shop deals",
  dismiss: "Close the MuseHub sale banner",

  /** Card (D), in place of the Top-5 trending plugins block. */
  cardHeading: "MuseHub Sale",
  cardDates: "24 Nov – 1 Dec",
  cardTitle: "Black Friday",
  cardOfferLabel: "Up to 83% off apps, plug-ins, sounds and courses",
  cardDiscount: "-83%",
  cardButton: "Shop Black Friday deals",
  units: { d: "Days", h: "Hours", m: "Min", s: "Sec" },
};
