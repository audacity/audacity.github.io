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

const SESSION_IMPRESSION_KEY = "exit_intent_session_impressions";
const SUPPRESS_UNTIL_KEY = "exit_intent_suppress_until";

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
    displayMode?: "toast" | "modal";
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

const isExitIntentDebugEnabled = () => {
  if (typeof window === "undefined" || !import.meta.env.DEV) {
    return false;
  }

  const queryEnabled =
    new URLSearchParams(window.location.search).get("exitIntentDebug") === "1";
  const storageEnabled =
    window.localStorage.getItem("exit_intent_debug") === "1";

  return queryEnabled || storageEnabled;
};

const ExitIntentPopup: React.FC<ExitIntentPopupProps> = ({ requestPath }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDwellReady, setIsDwellReady] = useState(false);
  const [hasEngagement, setHasEngagement] = useState(false);
  const [hasExitIntent, setHasExitIntent] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<ExitPopupPromo | null>(
    null,
  );
  const hasShownRef = useRef(false);
  const isDebugMode = isExitIntentDebugEnabled();

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

    if (isDebugMode) {
      setIsDwellReady(true);
      setHasEngagement(true);
      setHasExitIntent(true);
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
  }, [isDebugMode, isRouteEligible, isVisible, resolvedPolicy]);

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

  const { copy, displayMode = "toast" } = selectedPromo.exitPopup;

  const content = (
    <div className="w-[calc(100%-2rem)] max-w-md rounded-lg border border-gray-300 bg-white p-4 shadow-lg">
      <svg
        width="153"
        height="32"
        viewBox="0 0 153 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M27.4853 30.2857H27.5714L19.3 0.571621L8.27143 0.571411L27.4853 30.2857Z"
          fill="currentcolor"
        ></path>
        <path
          d="M8.96071 30.2857C13.9096 30.2857 17.9214 26.2637 17.9214 21.3023C17.9214 16.3409 13.9096 12.3189 8.96071 12.3189C4.01185 12.3189 0 16.3409 0 21.3023C0 26.2637 4.01185 30.2857 8.96071 30.2857Z"
          fill="currentcolor"
        ></path>
        <path
          d="M46.378 25.2521C45.1313 25.2521 44.1317 24.8518 43.3789 24.0514C42.6498 23.2274 42.2852 22.015 42.2852 20.4142V17.7304C42.2852 16.2002 42.6968 15.0466 43.5201 14.2697C44.3434 13.4928 45.3901 13.1044 46.6603 13.1044H46.8014C47.4836 13.1044 48.0951 13.2339 48.6362 13.4928C49.2007 13.7518 49.6123 14.1049 49.8711 14.5522V10.809C49.8711 9.39652 49.3301 8.69026 48.248 8.69026H48.1069C47.5659 8.69026 47.1543 8.8786 46.872 9.25527C46.6132 9.63194 46.4839 10.1499 46.4839 10.809V11.6566H42.4969V10.2087C42.4969 8.74912 42.9673 7.57202 43.9082 6.67742C44.8726 5.75928 46.2369 5.30021 48.0011 5.30021H48.3539C50.2592 5.30021 51.6588 5.73574 52.5526 6.60679C53.4464 7.45431 53.8934 8.73734 53.8934 10.4559V25.0755H50.0828V23.3098C49.2124 24.6047 48.0481 25.2521 46.5897 25.2521H46.378ZM46.1663 19.9551C46.1663 20.5907 46.3192 21.1087 46.625 21.5089C46.9308 21.8856 47.366 22.0739 47.9305 22.0739H48.1069C48.6714 22.0739 49.1066 21.8856 49.4124 21.5089C49.7182 21.1087 49.8711 20.5907 49.8711 19.9551V18.1895C49.8711 17.5538 49.7182 17.0477 49.4124 16.671C49.1066 16.2708 48.6714 16.0707 48.1069 16.0707H47.9305C47.3424 16.0707 46.8955 16.259 46.5897 16.6357C46.3075 17.0124 46.1663 17.5303 46.1663 18.1895V19.9551Z"
          fill="currentcolor"
        ></path>
        <path
          d="M61.0978 25.4286C59.1219 25.4286 57.6635 24.9342 56.7227 23.9455C55.7818 22.9567 55.3113 21.4618 55.3113 19.4607V5.65334H59.3336V19.602C59.3336 20.3082 59.4865 20.8732 59.7923 21.297C60.0981 21.6972 60.545 21.8973 61.1331 21.8973H61.3448C61.9328 21.8973 62.3797 21.6972 62.6855 21.297C62.9913 20.8732 63.1442 20.3082 63.1442 19.602V5.65334H67.1665V19.4607C67.1665 21.4618 66.6961 22.9567 65.7552 23.9455C64.8143 24.9342 63.3559 25.4286 61.3801 25.4286H61.0978Z"
          fill="currentcolor"
        ></path>
        <path
          d="M72.9522 25.4286C71.6114 25.4286 70.5294 24.9931 69.7061 24.122C68.9063 23.2274 68.5065 21.8973 68.5065 20.1317V10.5972C68.5065 8.83151 68.9063 7.51316 69.7061 6.64211C70.5294 5.74751 71.6114 5.30021 72.9522 5.30021H73.1286C73.8578 5.30021 74.5046 5.48855 75.0692 5.86522C75.6337 6.21835 76.0571 6.68919 76.3394 7.27774V1.06265H80.3617V25.0755H76.4099V23.5924C76.0336 24.1574 75.5631 24.6047 74.9986 24.9342C74.4576 25.2638 73.8342 25.4286 73.1286 25.4286H72.9522ZM72.5288 19.602C72.5288 20.3082 72.6816 20.8732 72.9874 21.297C73.2932 21.6972 73.7401 21.8973 74.3282 21.8973H74.5046C75.0927 21.8973 75.5396 21.6972 75.8454 21.297C76.1512 20.8732 76.3041 20.3082 76.3041 19.602V11.1269C76.3041 10.4206 76.1512 9.86736 75.8454 9.46715C75.5396 9.04339 75.0927 8.83151 74.5046 8.83151H74.3282C73.7401 8.83151 73.2932 9.04339 72.9874 9.46715C72.6816 9.86736 72.5288 10.4206 72.5288 11.1269V19.602Z"
          fill="currentcolor"
        ></path>
        <path
          d="M81.9839 5.65334H86.0062V25.0755H81.9839V5.65334ZM81.6663 2.61642C81.6663 1.93371 81.878 1.38047 82.3014 0.956713C82.7483 0.509415 83.3129 0.285767 83.995 0.285767C84.6772 0.285767 85.2299 0.509415 85.6533 0.956713C86.1002 1.38047 86.3237 1.93371 86.3237 2.61642C86.3237 3.29914 86.1002 3.86415 85.6533 4.31145C85.2299 4.7352 84.6772 4.94708 83.995 4.94708C83.3129 4.94708 82.7483 4.7352 82.3014 4.31145C81.878 3.86415 81.6663 3.29914 81.6663 2.61642Z"
          fill="currentcolor"
        ></path>
        <path
          d="M93.3489 25.4286C89.4443 25.4286 87.4919 23.4746 87.4919 19.5667V11.1622C87.4919 7.2542 89.4325 5.30021 93.3137 5.30021H93.5959C97.4771 5.30021 99.4177 7.2542 99.4177 11.1622V19.5667C99.4177 23.4746 97.4653 25.4286 93.5606 25.4286H93.3489ZM91.5142 19.602C91.5142 20.3082 91.6789 20.8732 92.0082 21.297C92.3375 21.6972 92.7962 21.8973 93.3842 21.8973H93.5254C94.1134 21.8973 94.5721 21.6972 94.9014 21.297C95.2307 20.8732 95.3954 20.3082 95.3954 19.602V11.1269C95.3954 10.4206 95.2307 9.86736 94.9014 9.46715C94.5721 9.04339 94.1134 8.83151 93.5254 8.83151H93.3842C92.7962 8.83151 92.3375 9.04339 92.0082 9.46715C91.6789 9.86736 91.5142 10.4206 91.5142 11.1269V19.602Z"
          fill="currentcolor"
        ></path>
        <path
          d="M102.949 25.1814C102.22 25.1814 101.597 24.9225 101.079 24.4045C100.562 23.8866 100.303 23.2628 100.303 22.533C100.303 21.7796 100.562 21.1558 101.079 20.6614C101.597 20.1434 102.22 19.8845 102.949 19.8845C103.702 19.8845 104.325 20.1434 104.819 20.6614C105.337 21.1558 105.596 21.7796 105.596 22.533C105.596 23.2628 105.337 23.8866 104.819 24.4045C104.325 24.9225 103.702 25.1814 102.949 25.1814Z"
          fill="currentcolor"
        ></path>
        <path
          d="M112.265 25.4286C110.337 25.4286 108.878 24.9225 107.89 23.9102C106.902 22.8979 106.408 21.45 106.408 19.5667V11.1622C106.408 9.27881 106.902 7.83098 107.89 6.81867C108.878 5.80637 110.337 5.30021 112.265 5.30021H112.512C116.205 5.30021 118.052 7.2542 118.052 11.1622V11.9744H114.136V11.1269C114.136 10.3971 113.983 9.83205 113.677 9.43183C113.395 9.03162 112.959 8.83151 112.371 8.83151H112.23C111.642 8.83151 111.195 9.04339 110.889 9.46715C110.584 9.86736 110.431 10.4206 110.431 11.1269V19.602C110.431 20.3082 110.584 20.8732 110.889 21.297C111.195 21.6972 111.642 21.8973 112.23 21.8973H112.371C112.959 21.8973 113.395 21.6972 113.677 21.297C113.983 20.8732 114.136 20.3082 114.136 19.602V18.7898H118.052V19.5667C118.052 23.4746 116.205 25.4286 112.512 25.4286H112.265Z"
          fill="currentcolor"
        ></path>
        <path
          d="M125.187 25.4286C121.282 25.4286 119.33 23.4746 119.33 19.5667V11.1622C119.33 7.2542 121.27 5.30021 125.151 5.30021H125.434C129.315 5.30021 131.255 7.2542 131.255 11.1622V19.5667C131.255 23.4746 129.303 25.4286 125.398 25.4286H125.187ZM123.352 19.602C123.352 20.3082 123.517 20.8732 123.846 21.297C124.175 21.6972 124.634 21.8973 125.222 21.8973H125.363C125.951 21.8973 126.41 21.6972 126.739 21.297C127.068 20.8732 127.233 20.3082 127.233 19.602V11.1269C127.233 10.4206 127.068 9.86736 126.739 9.46715C126.41 9.04339 125.951 8.83151 125.363 8.83151H125.222C124.634 8.83151 124.175 9.04339 123.846 9.46715C123.517 9.86736 123.352 10.4206 123.352 11.1269V19.602Z"
          fill="currentcolor"
        ></path>
        <path
          d="M132.736 5.65334H136.618V7.31305C136.994 6.7245 137.488 6.24189 138.1 5.86522C138.735 5.48855 139.417 5.30021 140.146 5.30021H140.322C142.039 5.30021 143.239 6.06533 143.921 7.59556C144.274 6.95992 144.792 6.41846 145.474 5.97116C146.179 5.52386 146.967 5.30021 147.838 5.30021H148.014C149.331 5.30021 150.343 5.74751 151.048 6.64211C151.778 7.5367 152.142 8.86683 152.142 10.6325V25.0755H148.12V11.1269C148.12 10.4206 147.967 9.86736 147.661 9.46715C147.379 9.04339 146.944 8.83151 146.356 8.83151H146.215C145.627 8.83151 145.18 9.04339 144.874 9.46715C144.592 9.86736 144.451 10.4206 144.451 11.1269V25.0755H140.428V11.1269C140.428 10.4206 140.275 9.86736 139.97 9.46715C139.687 9.04339 139.252 8.83151 138.664 8.83151H138.523C137.935 8.83151 137.488 9.04339 137.182 9.46715C136.9 9.86736 136.759 10.4206 136.759 11.1269V25.0755H132.736V5.65334Z"
          fill="currentcolor"
        ></path>
      </svg>
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
    </div>
  );

  if (displayMode === "modal") {
    return (
      <div
        className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4"
        onClick={handleDismiss}
        aria-live="polite"
      >
        <aside onClick={(event) => event.stopPropagation()}>{content}</aside>
      </div>
    );
  }

  return (
    <aside aria-live="polite" className="fixed bottom-4 right-4 z-40">
      {content}
    </aside>
  );
};

export default ExitIntentPopup;
