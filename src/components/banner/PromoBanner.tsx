import cx from "classnames";
import promoData from "../../assets/data/promotions";
import type { PromoData } from "../../assets/data/promotions";
import useBrowserOS from "../../hooks/useDetectOS";
import "../../styles/icons.css";
import { trackEvent } from "../../utils/matomo";
import { useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_PROMO_STYLES: NonNullable<PromoData["styles"]> = {
  container: "bg-yellow-300",
  message: "text-gray-900",
  button: "bg-gray-100 hover:bg-white",
};

const BASE_CONTAINER_CLASSNAME =
  "flex flex-col lg:flex-row justify-center items-center align-start py-4 gap-3 lg:gap-6 transition-colors duration-200";
const BASE_MESSAGE_CLASSNAME = "text-lg font-semibold";
const BASE_BUTTON_CLASSNAME =
  "flex h-8 justify-center items-center px-4 rounded-md font-semibold";

const PLACEHOLDER_CONTAINER_CLASSNAME =
  "flex flex-col lg:flex-row justify-center items-center align-start py-4 gap-3 lg:gap-6 transition-colors duration-200 opacity-0 pointer-events-none";

type PromoBannerProps = {
  requestPath?: string;
};

const STATIC_PROMOS: PromoData[] = Object.values(promoData).filter(
  (promo) => promo.type === "banner"
);

const isPromoActive = (promo: PromoData | null | undefined) =>
  promo?.isActive ?? true;

const isSuppressedOnPath = (promo: PromoData, path: string | null) => {
  if (!path) {
    return false;
  }
  const suppressedPaths = promo.suppressOnPaths ?? [];
  return suppressedPaths.includes(path);
};

const getHighestPriorityPromo = (promos: PromoData[]) =>
  promos.reduce<PromoData | null>((selected, current) => {
    if (!current) {
      return selected;
    }
    if (!selected) {
      return current;
    }
    const currentPriority = current.priority ?? 0;
    const selectedPriority = selected.priority ?? 0;
    return currentPriority > selectedPriority ? current : selected;
  }, null);

const getEligiblePromos = (promos: PromoData[], os: string | null) =>
  promos.filter((promo) => {
    if (!isPromoActive(promo)) {
      return false;
    }
    if (!promo.osTargets || promo.osTargets.length === 0) {
      return true;
    }
    if (!os) {
      return false;
    }
    return promo.osTargets.includes(os);
  });

const selectWeightedPromo = (promos: PromoData[]) => {
  if (promos.length === 0) {
    return null;
  }

  const weights = promos.map((promo) => Math.max(promo.priority ?? 1, 0));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

  if (totalWeight <= 0) {
    return getHighestPriorityPromo(promos);
  }

  let threshold = Math.random() * totalWeight;

  for (let index = 0; index < promos.length; index += 1) {
    threshold -= weights[index];

    if (threshold <= 0) {
      return promos[index];
    }
  }

  return promos[promos.length - 1] ?? null;
};

const buildPromoList = (path: string | null): PromoData[] =>
  STATIC_PROMOS.filter((promo) => !isSuppressedOnPath(promo, path));

const PromoBanner: React.FC<PromoBannerProps> = ({ requestPath }) => {
  const browserOS = useBrowserOS();
  const [selectedPromo, setSelectedPromo] = useState<PromoData | null>(null);
  const [isReady, setIsReady] = useState(false);
  const hasSelected = useRef(false);
  const [shouldReserveSpace, setShouldReserveSpace] = useState<boolean>(() => {
    const pathForEval =
      typeof window !== "undefined"
        ? window.location.pathname
        : requestPath ?? null;
    const promos = buildPromoList(pathForEval);
    return promos.some((promo) => isPromoActive(promo) && Boolean(promo.cta));
  });

  const initialPath = useMemo(() => {
    if (typeof window !== "undefined") {
      return window.location.pathname;
    }
    return requestPath ?? null;
  }, [requestPath]);

  useEffect(() => {
    if (hasSelected.current) {
      return;
    }

    const pathName =
      typeof window !== "undefined" ? window.location.pathname : initialPath;

    if (typeof window !== "undefined" && browserOS === null) {
      return;
    }

    const promos = buildPromoList(pathName);

    if (promos.length === 0) {
      hasSelected.current = true;
      setSelectedPromo(null);
      setIsReady(true);
      setShouldReserveSpace(false);
      return;
    }

    const eligiblePromos = getEligiblePromos(promos, browserOS);
    const fallbackPromos = promos.filter((promo) => isPromoActive(promo));
    const selectionPool =
      eligiblePromos.length > 0 ? eligiblePromos : fallbackPromos;

    if (selectionPool.length === 0) {
      hasSelected.current = true;
      setSelectedPromo(null);
      setIsReady(true);
      setShouldReserveSpace(false);
      return;
    }

    const promo = selectWeightedPromo(selectionPool);
    hasSelected.current = true;
    setSelectedPromo(promo && promo.cta ? promo : null);
    setIsReady(true);
    setShouldReserveSpace(true);
  }, [browserOS, initialPath]);

  if (!isReady && shouldReserveSpace) {
    return (
      <div className={PLACEHOLDER_CONTAINER_CLASSNAME} aria-hidden="true">
        <div className="lg:flex text-center gap-4 flex-wrap justify-center">
          <p className={BASE_MESSAGE_CLASSNAME}>&nbsp;</p>
        </div>
        <span className={BASE_BUTTON_CLASSNAME}>&nbsp;</span>
      </div>
    );
  }

  if (!isReady) {
    return null;
  }

  if (!selectedPromo || !selectedPromo.cta) {
    return null;
  }

  const { tracking, cta, message, styles } = selectedPromo;
  const containerClassName = cx(
    BASE_CONTAINER_CLASSNAME,
    styles?.container ?? DEFAULT_PROMO_STYLES.container
  );
  const messageClassName = cx(
    BASE_MESSAGE_CLASSNAME,
    styles?.message ?? DEFAULT_PROMO_STYLES.message
  );
  const buttonClassName = cx(
    BASE_BUTTON_CLASSNAME,
    styles?.button ?? DEFAULT_PROMO_STYLES.button
  );
  const trimmedMessage = message.trim();

  function handleButtonClick() {
    if (!tracking) return;
    trackEvent(tracking.category, tracking.action, tracking.name);
  }

  return (
    <>
      {
        <div id="promo-banner" className={containerClassName}>
          <div className="lg:flex text-center gap-4 flex-wrap justify-center">
            <p className={messageClassName}>{trimmedMessage}</p>
          </div>

          <a
            href={cta.link}
            id="promo-button"
            onClick={handleButtonClick}
            className={buttonClassName}
          >
            {cta.text}
          </a>
        </div>
      }
    </>
  );
};

export default PromoBanner;
