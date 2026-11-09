/**
 * The MuseHub Black Friday & Year End sale promo, shown on the homepage in
 * one of four spots by the "promo-spot" experiment (see experiments.ts).
 *
 * Copy and dates follow the "Without countdown" frames of the Figma file
 * "Promotional not banners" (node 107-425 and siblings) — every string the
 * visitor reads lives here so a copy change is one file.
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
  /** Bars (A, B, C): "<lead> <offer>" then the button. */
  barLead: "MuseHub:",
  barOffer: "Get up to 50% off select plugins, apps and sample packs",
  barButton: "Shop the sale",
  /**
   * Below md the bars follow "Campaign bar / Mobile" in the MH Sales
   * Campaign file: one short line ("Black Friday: Up to 83% off" there),
   * since the full offer does not fit a 375px bar. The one-word button is
   * used only below xs (480px).
   */
  barOfferShort: "Up to 50% off",
  barButtonShort: "Shop",
  dismiss: "Close the MuseHub sale banner",

  /** Card (D), in place of the Top-5 trending plugins block. */
  cardHeading: "Explore plugins during the MuseHub sale",
  cardDates: "9 Nov – 4 Jan",
  cardTitle: "Holiday Sale",
  cardOfferLabel: "Up to 50% off select plugins, apps and sample packs",
  cardDiscount: "-50%",
  cardButton: "Shop the Holiday Sale",
};
