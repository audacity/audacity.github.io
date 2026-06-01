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

const promoData: Record<string, PromoData> = {
  ...firstPartyPromos,
  ...campaignBannerPromos,
  ...campaignVideoPromos,
};

export default promoData;
