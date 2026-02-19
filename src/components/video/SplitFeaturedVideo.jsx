import React, { useState } from "react";
import FeaturedVideo from "./FeaturedVideo";
import { selectWeightedItem } from "../../utils/selectWeightedItem";

/**
 * @param {{ promos?: import("../../assets/data/promotions").PromoData[], slot?: number | string }} props
 */
function SplitFeaturedVideo({ promos = [], slot }) {
  const normalizedSlot =
    slot === undefined ? undefined : Number.parseInt(String(slot), 10);

  const [selectedPromo] = useState(() => {
    const activePromos = promos.filter(
      (promo) =>
        promo?.isActive !== false &&
        promo?.video?.videoURL &&
        (normalizedSlot === undefined || promo?.slot === normalizedSlot),
    );

    if (activePromos.length === 0) return null;
    if (activePromos.length === 1) return activePromos[0];

    return selectWeightedItem(
      activePromos,
      (promo) =>
        typeof promo.priority === "number" ? Math.max(promo.priority, 0) : 0,
      { fallback: "random" },
    );
  });

  if (!selectedPromo) return null;

  return (
    <FeaturedVideo
      title={selectedPromo.tracking?.name ?? selectedPromo.message}
      label={selectedPromo.message}
      placeholderImage={selectedPromo.video?.placeholderImage ?? ""}
      imageAltText={selectedPromo.video?.imageAltText ?? ""}
      videoURL={selectedPromo.video?.videoURL ?? ""}
      CTA={Boolean(selectedPromo.cta)}
      ctaText={selectedPromo.cta?.text}
      ctaURL={selectedPromo.cta?.link}
      matomoEventName={selectedPromo.tracking?.name ?? selectedPromo.message}
    />
  );
}

export default SplitFeaturedVideo;
