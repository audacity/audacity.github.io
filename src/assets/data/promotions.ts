import type {
  PromoType,
  ExitPopupPolicy,
  ExitPopupOptions,
  TrackingConfig,
  PromoData,
  FilterOptions,
} from "./promos/types";

import { getFilteredPromos, isPromoDateActive } from "./promos/types";
import { firstPartyPromos } from "./promos/firstParty";
import { campaignBannerPromos, campaignVideoPromos } from "./promos/campaigns";

export type {
  PromoType,
  ExitPopupPolicy,
  ExitPopupOptions,
  TrackingConfig,
  PromoData,
  FilterOptions,
};

export { getFilteredPromos, isPromoDateActive };

/**
 * Site-wide switch for the promo banner. Signed off 2026-08-27.
 *
 * Deliberately a flag rather than a deletion. The campaign promos in
 * ./promos/campaigns.ts are generated from the Confluence calendar and carry
 * their own `isActive` and date windows — switching them off here would be
 * undone by the next `bun run pull-campaigns`, and editing that file is
 * explicitly out of bounds. Turning the banner off at the point of use leaves
 * the calendar as the source of truth and keeps it updating in the background,
 * so bringing the banner back is this one flag plus a redeploy.
 *
 * Scope is the banner only: the exit-intent popup and the video promos are
 * separate surfaces and are unaffected.
 */
export const PROMO_BANNER_ENABLED = false;

const promoData: Record<string, PromoData> = {
  ...firstPartyPromos,
  ...campaignBannerPromos,
  ...campaignVideoPromos,
};

export default promoData;
