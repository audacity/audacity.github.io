import promoData, {
  getFilteredPromos,
  type ExitPopupPolicy,
  type PromoData,
  type TrackingConfig,
} from "../../assets/data/promotions";
import { trackEventIfConsented } from "../../utils/matomo";
import { selectWeightedItem } from "../../utils/selectWeightedItem";
import { useEffect, useMemo, useRef, useState } from "react";

type ExitIntentPopupProps = {
  requestPath?: string;
};

const SESSION_IMPRESSION_KEY = "before_you_go_session_impressions";
const SUPPRESS_UNTIL_KEY = "before_you_go_suppress_until";

const DEFAULT_POLICY: Required<ExitPopupPolicy> = {
  sessionCap: 1,
  dismissCooldownDays: 14,
  minDwellMs: 10000,
};

type ExitPopupPromo = PromoData & {
  type: "exit-popup";
  cta: {
    text: string;
    link: string;
  };
  tracking: TrackingConfig;
  exitPopup: {
    routeAllowlist: string[];
    copy: {
      title: string;
      body: string;
      dismissText: string;
    };
    policy?: ExitPopupPolicy;
    impressionTracking?: TrackingConfig;
  };
};

const resolvePolicy = (policy: ExitPopupPolicy | undefined) => ({
  sessionCap: policy?.sessionCap ?? DEFAULT_POLICY.sessionCap,
  dismissCooldownDays:
    policy?.dismissCooldownDays ?? DEFAULT_POLICY.dismissCooldownDays,
  minDwellMs: policy?.minDwellMs ?? DEFAULT_POLICY.minDwellMs,
});

const isExitPopupPromo = (promo: PromoData): promo is ExitPopupPromo => {
  return (
    promo.type === "exit-popup" &&
    Boolean(promo.cta) &&
    Boolean(promo.tracking) &&
    Boolean(promo.exitPopup?.copy)
  );
};

const isDesktopCapableContext = () => {
  if (typeof window === "undefined") {
    return false;
  }

  const hasMinWidth = window.matchMedia("(min-width: 1024px)").matches;
  const hasPointer = window.matchMedia("(pointer: fine)").matches;
  const hasHover = window.matchMedia("(hover: hover)").matches;

  return hasMinWidth && hasPointer && hasHover;
};

const getNumberFromStorage = (storage: Storage, key: string): number => {
  const value = storage.getItem(key);
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const isSuppressedByCooldown = (nowMs: number) => {
  const suppressUntil = getNumberFromStorage(localStorage, SUPPRESS_UNTIL_KEY);
  return suppressUntil > nowMs;
};

const setSuppressCooldown = (days: number) => {
  const cooldownMs = days * 24 * 60 * 60 * 1000;
  localStorage.setItem(SUPPRESS_UNTIL_KEY, String(Date.now() + cooldownMs));
};

const incrementSessionImpressions = () => {
  const current = getNumberFromStorage(sessionStorage, SESSION_IMPRESSION_KEY);
  sessionStorage.setItem(SESSION_IMPRESSION_KEY, String(current + 1));
};

const hasReachedSessionCap = (sessionCap: number) => {
  const current = getNumberFromStorage(sessionStorage, SESSION_IMPRESSION_KEY);
  return current >= sessionCap;
};

const selectExitPopupPromo = (promos: ExitPopupPromo[]) =>
  selectWeightedItem(promos, (promo) => Math.max(promo.priority ?? 0, 0), {
    fallback: "random",
  });

const ExitIntentPopup: React.FC<ExitIntentPopupProps> = ({ requestPath }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDwellReady, setIsDwellReady] = useState(false);
  const [hasEngagement, setHasEngagement] = useState(false);
  const [hasExitIntent, setHasExitIntent] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<ExitPopupPromo | null>(
    null,
  );
  const hasShownRef = useRef(false);

  const resolvedPath = useMemo(() => {
    if (typeof window !== "undefined") {
      return window.location.pathname;
    }
    return requestPath ?? "";
  }, [requestPath]);

  const resolvedPolicy = useMemo(
    () => resolvePolicy(selectedPromo?.exitPopup?.policy),
    [selectedPromo],
  );

  const impressionTracking = selectedPromo?.exitPopup?.impressionTracking;
  const trackingForImpression = impressionTracking ?? selectedPromo?.tracking;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const eligiblePopups = getFilteredPromos(Object.values(promoData), {
      type: "exit-popup",
      path: resolvedPath,
    }).filter(isExitPopupPromo);

    setSelectedPromo(selectExitPopupPromo(eligiblePopups));
    setIsVisible(false);
    setIsDwellReady(false);
    setHasEngagement(false);
    setHasExitIntent(false);
    hasShownRef.current = false;
  }, [resolvedPath]);

  const isRouteEligible = Boolean(selectedPromo);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!isRouteEligible || !isDesktopCapableContext()) {
      return;
    }

    const nowMs = Date.now();

    if (isSuppressedByCooldown(nowMs)) {
      return;
    }

    if (hasReachedSessionCap(resolvedPolicy.sessionCap)) {
      return;
    }

    const dwellTimer = window.setTimeout(() => {
      setIsDwellReady(true);
    }, resolvedPolicy.minDwellMs);

    const markEngagement = () => {
      setHasEngagement(true);
    };

    const handleScroll = () => {
      if (window.scrollY > 120) {
        setHasEngagement(true);
      }
    };

    const handleMouseOut = (event: MouseEvent) => {
      if (event.relatedTarget !== null) {
        return;
      }

      if (event.clientY <= 0) {
        setHasExitIntent(true);
      }
    };

    const handleEscapeDismiss = (event: KeyboardEvent) => {
      if (!isVisible || event.key !== "Escape") {
        return;
      }

      setSuppressCooldown(resolvedPolicy.dismissCooldownDays);
      setIsVisible(false);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("click", markEngagement);
    window.addEventListener("keydown", markEngagement);
    document.addEventListener("mouseout", handleMouseOut);
    window.addEventListener("keydown", handleEscapeDismiss);

    return () => {
      window.clearTimeout(dwellTimer);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("click", markEngagement);
      window.removeEventListener("keydown", markEngagement);
      document.removeEventListener("mouseout", handleMouseOut);
      window.removeEventListener("keydown", handleEscapeDismiss);
    };
  }, [isRouteEligible, isVisible, resolvedPolicy]);

  useEffect(() => {
    if (
      !selectedPromo ||
      !isRouteEligible ||
      !isDwellReady ||
      !hasEngagement ||
      !hasExitIntent ||
      hasShownRef.current
    ) {
      return;
    }

    hasShownRef.current = true;
    incrementSessionImpressions();
    setIsVisible(true);

    if (trackingForImpression) {
      trackEventIfConsented(
        trackingForImpression.category,
        trackingForImpression.action,
        trackingForImpression.name,
      );
    }
  }, [
    hasEngagement,
    hasExitIntent,
    isDwellReady,
    isRouteEligible,
    selectedPromo,
    trackingForImpression,
  ]);

  const handleDismiss = () => {
    setSuppressCooldown(resolvedPolicy.dismissCooldownDays);
    setIsVisible(false);
  };

  const handleCtaClick = () => {
    if (!selectedPromo) {
      return;
    }

    setSuppressCooldown(resolvedPolicy.dismissCooldownDays);
    trackEventIfConsented(
      selectedPromo.tracking.category,
      selectedPromo.tracking.action,
      selectedPromo.tracking.name,
    );
  };

  if (!isVisible || !selectedPromo) {
    return null;
  }

  const { copy } = selectedPromo.exitPopup;

  return (
    <aside
      aria-live="polite"
      className="fixed bottom-4 right-4 z-40 w-[calc(100%-2rem)] max-w-md rounded-lg border border-gray-300 bg-white p-4 shadow-lg"
    >
      <p className="text-lg font-semibold text-gray-900">{copy.title}</p>
      <p className="mt-2 text-gray-700">{copy.body}</p>
      <div className="mt-4 flex gap-2">
        <a
          href={selectedPromo.cta.link}
          onClick={handleCtaClick}
          className="flex h-10 items-center justify-center rounded-md bg-blue-700 px-4 font-semibold text-white hover:bg-blue-600"
        >
          {selectedPromo.cta.text}
        </a>
        <button
          type="button"
          onClick={handleDismiss}
          className="flex h-10 items-center justify-center rounded-md border border-gray-300 px-4 font-semibold text-gray-700 hover:bg-gray-100"
        >
          {copy.dismissText}
        </button>
      </div>
    </aside>
  );
};

export default ExitIntentPopup;
