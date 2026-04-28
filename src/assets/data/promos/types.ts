export type PromoType = "banner" | "video" | "exit-popup";

export type ExitPopupPolicy = {
  sessionCap?: number;
  dismissCooldownDays?: number;
  minDwellMs?: number;
};

export type ExitPopupOptions = {
  routeAllowlist: string[];
  displayMode?: "toast" | "modal";
  promoImageSrc?: string;
  promoImageAlt?: string;
  title: string;
  body?: string;
  dismissText: string;
  policy?: ExitPopupPolicy;
  impressionTracking?: TrackingConfig;
  dismissTracking?: TrackingConfig;
};

export type TrackingConfig = {
  category: string;
  action: string;
  name: string;
};

export type PromoData = {
  type: PromoType;
  isActive?: boolean;
  /** ISO date string (YYYY-MM-DD). Promo is inactive before this date. */
  startDate?: string;
  /** ISO date string (YYYY-MM-DD). Promo is inactive after this date (inclusive). */
  endDate?: string;
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
  tracking?: TrackingConfig;
  cta?: {
    text: string;
    link: string;
  };
  popupOptions?: ExitPopupOptions;
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

const routeMatchesAllowlist = (path: string, allowlist: string[]) =>
  allowlist.some((route) => path === route || path.startsWith(`${route}/`));

/** Returns false if today is outside the promo's startDate/endDate window. */
export const isPromoDateActive = (promo: PromoData): boolean => {
  const today = new Date().toISOString().slice(0, 10);
  if (promo.startDate && today < promo.startDate) return false;
  if (promo.endDate && today > promo.endDate) return false;
  return true;
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

    if (path && promo.type === "exit-popup") {
      const allowlist = promo.popupOptions?.routeAllowlist ?? [];
      if (allowlist.length > 0 && !routeMatchesAllowlist(path, allowlist))
        return false;
    }

    // Check path suppression
    if (path && promo.suppressOnPaths?.includes(path)) return false;

    // Check OS targeting
    if (promo.osTargets && promo.osTargets.length > 0) {
      if (!os || !promo.osTargets.includes(os)) return false;
    }

    return true;
  });
};
