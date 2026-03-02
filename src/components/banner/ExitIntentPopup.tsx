import promoData, {
  getFilteredPromos,
  type ExitPopupPolicy,
  type PromoData,
  type TrackingConfig,
} from "../../assets/data/promotions";
import { trackEventIfConsented } from "../../utils/matomo";
import { selectWeightedItem } from "../../utils/selectWeightedItem";
import { getUiSemaphore } from "../../utils/uiSemaphore";
import { useEffect, useMemo, useRef, useState } from "react";

type ExitIntentPopupProps = {
  requestPath?: string;
};

const SESSION_IMPRESSION_KEY = "exit_intent_session_impressions";
const SUPPRESS_UNTIL_KEY = "exit_intent_suppress_until";
const ATTENTION_OVERLAY_CHANNEL = "attention-overlay";
const EXIT_INTENT_OVERLAY_OWNER = "exit-intent-popup";
const EXIT_INTENT_OVERLAY_PRIORITY = 100;

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
  popupOptions: {
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
};

type DismissReason = "button" | "backdrop" | "escape";

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
    Boolean(promo.popupOptions?.title) &&
    Boolean(promo.popupOptions?.dismissText)
  );
};

const isDesktopCapableContext = () => {
  if (typeof window === "undefined") {
    return false;
  }

  const hasPointer = window.matchMedia("(pointer: fine)").matches;
  const hasHover = window.matchMedia("(hover: hover)").matches;

  return hasPointer && hasHover;
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
  const [isAttentionOverlayLocked, setIsAttentionOverlayLocked] =
    useState(false);
  const [selectedPromo, setSelectedPromo] = useState<ExitPopupPromo | null>(
    null,
  );
  const hasShownRef = useRef(false);
  const hasOverlayLockRef = useRef(false);
  const isDebugMode = isExitIntentDebugEnabled();

  const resolvedPath = useMemo(() => {
    if (typeof window !== "undefined") {
      return window.location.pathname;
    }
    return requestPath ?? "";
  }, [requestPath]);

  const resolvedPolicy = useMemo(
    () => resolvePolicy(selectedPromo?.popupOptions?.policy),
    [selectedPromo],
  );

  const impressionTracking = selectedPromo?.popupOptions?.impressionTracking;
  const trackingForImpression = impressionTracking ?? selectedPromo?.tracking;

  const releaseOverlayLock = () => {
    const semaphore = getUiSemaphore();
    if (!semaphore || !hasOverlayLockRef.current) {
      return;
    }

    semaphore.release(ATTENTION_OVERLAY_CHANNEL, EXIT_INTENT_OVERLAY_OWNER);
    hasOverlayLockRef.current = false;
  };

  useEffect(() => {
    const semaphore = getUiSemaphore();
    if (!semaphore) {
      return;
    }

    const syncOverlayLock = () => {
      const lock = semaphore.getLock(ATTENTION_OVERLAY_CHANNEL);
      setIsAttentionOverlayLocked(
        Boolean(lock) && lock?.owner !== EXIT_INTENT_OVERLAY_OWNER,
      );
    };

    syncOverlayLock();
    const unsubscribe = semaphore.subscribe((channel) => {
      if (channel !== ATTENTION_OVERLAY_CHANNEL) {
        return;
      }
      syncOverlayLock();
    });

    return () => {
      unsubscribe();
      releaseOverlayLock();
    };
  }, []);

  useEffect(() => {
    if (isAttentionOverlayLocked && isVisible) {
      releaseOverlayLock();
      setIsVisible(false);
    }
  }, [isAttentionOverlayLocked, isVisible]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const eligiblePopups = getFilteredPromos(Object.values(promoData), {
      type: "exit-popup",
      path: resolvedPath,
    }).filter(isExitPopupPromo);

    releaseOverlayLock();
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

    if (isAttentionOverlayLocked) {
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

      const dismissTracking = selectedPromo?.popupOptions?.dismissTracking;
      if (dismissTracking) {
        trackEventIfConsented(
          dismissTracking.category,
          dismissTracking.action,
          `${dismissTracking.name} (escape)`,
        );
      }

      setSuppressCooldown(resolvedPolicy.dismissCooldownDays);
      releaseOverlayLock();
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
  }, [
    isAttentionOverlayLocked,
    isDebugMode,
    isRouteEligible,
    isVisible,
    resolvedPolicy,
    selectedPromo,
  ]);

  useEffect(() => {
    if (
      !selectedPromo ||
      !isRouteEligible ||
      !isDwellReady ||
      !hasEngagement ||
      !hasExitIntent ||
      isAttentionOverlayLocked ||
      hasShownRef.current
    ) {
      return;
    }

    const semaphore = getUiSemaphore();
    if (
      semaphore &&
      !semaphore.acquire(ATTENTION_OVERLAY_CHANNEL, EXIT_INTENT_OVERLAY_OWNER, {
        priority: EXIT_INTENT_OVERLAY_PRIORITY,
        preempt: true,
      })
    ) {
      return;
    }

    hasShownRef.current = true;
    hasOverlayLockRef.current = true;
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
    isAttentionOverlayLocked,
    isRouteEligible,
    selectedPromo,
    trackingForImpression,
  ]);

  const handleDismiss = (reason: DismissReason) => {
    const dismissTracking = selectedPromo?.popupOptions?.dismissTracking;
    if (dismissTracking) {
      trackEventIfConsented(
        dismissTracking.category,
        dismissTracking.action,
        `${dismissTracking.name} (${reason})`,
      );
    }

    setSuppressCooldown(resolvedPolicy.dismissCooldownDays);
    releaseOverlayLock();
    setIsVisible(false);
  };

  const handleCtaClick = () => {
    if (!selectedPromo) {
      return;
    }

    setSuppressCooldown(resolvedPolicy.dismissCooldownDays);
    releaseOverlayLock();
    trackEventIfConsented(
      selectedPromo.tracking.category,
      selectedPromo.tracking.action,
      selectedPromo.tracking.name,
    );
  };

  if (!isVisible || !selectedPromo) {
    return null;
  }

  const {
    title,
    body: popupBody,
    dismissText,
    displayMode = "toast",
    promoImageSrc,
    promoImageAlt,
  } = selectedPromo.popupOptions;
  const body = popupBody ?? selectedPromo.message;
  const promoImageClassName =
    displayMode === "toast"
      ? "mb-3 h-[5rem] w-full rounded-md object-cover object-center"
      : "mb-3 h-auto w-full rounded-md";

  const content = (
    <div className="w-[calc(100%-2rem)] max-w-md rounded-lg border border-gray-300 bg-white p-4 shadow-lg">
      {promoImageSrc && (
        <img
          src={promoImageSrc}
          alt={promoImageAlt ?? ""}
          className={promoImageClassName}
        />
      )}
      <p className="text-lg font-semibold text-gray-900">{title}</p>
      <p className="mt-2 text-gray-700">{body}</p>
      <div className="mt-4 flex gap-2 justify-end">
        <button
          type="button"
          onClick={() => handleDismiss("button")}
          className="flex h-10 items-center justify-center rounded-md border border-gray-300 px-4 font-semibold text-gray-700 hover:bg-gray-100"
        >
          {dismissText}
        </button>
        <a
          href={selectedPromo.cta.link}
          onClick={handleCtaClick}
          className="flex h-10 items-center justify-center rounded-md bg-blue-700 px-4 font-semibold text-white hover:bg-blue-600"
        >
          {selectedPromo.cta.text}
        </a>
      </div>
    </div>
  );

  if (displayMode === "modal") {
    return (
      <div
        className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4"
        onClick={() => handleDismiss("backdrop")}
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
