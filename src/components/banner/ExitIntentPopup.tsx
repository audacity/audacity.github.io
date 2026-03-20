import promoData, {
  getFilteredPromos,
  type ExitPopupPolicy,
  type PromoData,
  type TrackingConfig,
} from "../../assets/data/promotions";
import { trackEventIfConsented } from "../../utils/matomo";
import { selectWeightedItem } from "../../utils/selectWeightedItem";
import { getUiSemaphore } from "../../utils/uiSemaphore";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  const [selectedPromo, setSelectedPromo] = useState<ExitPopupPromo | null>(
    null,
  );
  const hasShownRef = useRef(false);
  const hasOverlayLockRef = useRef(false);
  const dialogRef = useRef<HTMLElement | null>(null);
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
    return () => releaseOverlayLock();
  }, []);

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

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("click", markEngagement);
    window.addEventListener("keydown", markEngagement);
    document.addEventListener("mouseout", handleMouseOut);

    return () => {
      window.clearTimeout(dwellTimer);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("click", markEngagement);
      window.removeEventListener("keydown", markEngagement);
      document.removeEventListener("mouseout", handleMouseOut);
    };
  }, [isDebugMode, isRouteEligible, resolvedPolicy, selectedPromo]);

  useEffect(() => {
    if (!isVisible || !selectedPromo) {
      return;
    }

    const handleEscapeDismiss = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      const dismissTracking = selectedPromo.popupOptions?.dismissTracking;
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

    window.addEventListener("keydown", handleEscapeDismiss);

    return () => {
      window.removeEventListener("keydown", handleEscapeDismiss);
    };
  }, [isVisible, selectedPromo, resolvedPolicy]);

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

  const focusTrapRef = useCallback((node: HTMLElement | null) => {
    dialogRef.current = node;
    if (!node) return;

    const focusable = node.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    first?.focus();

    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    node.addEventListener("keydown", trap);
  }, []);

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
      ? "h-[5rem] w-full rounded-md object-cover object-center"
      : "h-auto w-full rounded-md";

  const content = (
    <div className="relative flex w-[calc(100%-2rem)] max-w-[30rem] flex-col gap-4 rounded-lg border border-gray-300 bg-white px-8 py-9 shadow-lg">
      <button
        type="button"
        aria-label={dismissText || "Close"}
        onClick={() => handleDismiss("button")}
        className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 focus:outline-none"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
          className="h-5 w-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
      {promoImageSrc && (
        <img
          src={promoImageSrc}
          alt={promoImageAlt ?? ""}
          className={promoImageClassName}
        />
      )}
      <div className="flex flex-col gap-2">
        <p
          id="exit-intent-title"
          className="text-lg font-semibold text-gray-900"
        >
          {title}
        </p>
        <p className="text-gray-700">{body}</p>
      </div>
      <div className="mt-5 flex justify-end gap-2">
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
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-intent-title"
        onClick={() => handleDismiss("backdrop")}
      >
        <aside ref={focusTrapRef} onClick={(event) => event.stopPropagation()}>
          {content}
        </aside>
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
