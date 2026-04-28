import type {
  PromoType,
  ExitPopupPolicy,
  ExitPopupOptions,
  TrackingConfig,
  PromoData,
  FilterOptions,
} from "./promos/types";

import { getFilteredPromos, isPromoDateActive } from "./promos/types";
import { bannerPromos } from "./promos/banners";
import { videoPromos } from "./promos/videos";
import { popupPromos } from "./promos/popups";

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
  ...bannerPromos,
  ...videoPromos,
  ...popupPromos,
};

export default promoData;
