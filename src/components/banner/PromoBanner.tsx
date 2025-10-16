import cx from "classnames";
import promoData from "../../assets/data/promotions";
import type { PromoData } from "../../assets/data/promotions";
import useBrowserOS from "../../hooks/useDetectOS";
import "../../styles/icons.css";
import { trackEvent } from "../../utils/matomo";

const DEFAULT_PROMO_STYLES: NonNullable<PromoData["styles"]> = {
  container: "bg-yellow-300",
  message: "text-gray-900",
  button: "bg-gray-100 hover:bg-white",
};

const BASE_CONTAINER_CLASSNAME =
  "flex flex-col lg:flex-row justify-center items-center align-start py-4 gap-3 lg:gap-6";
const BASE_MESSAGE_CLASSNAME = "text-lg font-semibold";
const BASE_BUTTON_CLASSNAME =
  "flex h-8 justify-center items-center px-4 rounded-md font-semibold";

const STATIC_PROMOS: PromoData[] = Object.values(promoData);

const isPromoActive = (promo: PromoData | null | undefined) =>
  promo?.isActive ?? true;

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

const buildPromoList = (): PromoData[] => STATIC_PROMOS;

const PromoBanner: React.FC = () => {
  const browserOS = useBrowserOS();
  const promos = buildPromoList();
  const eligiblePromos = getEligiblePromos(promos, browserOS);
  const fallbackPromos = promos.filter((promo) => isPromoActive(promo));
  const selectionPool =
    eligiblePromos.length > 0 ? eligiblePromos : fallbackPromos;
  const selectedPromo = selectWeightedPromo(selectionPool);

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
