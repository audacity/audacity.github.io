import { injectClarity } from "./clarityTracking.js";

const cookieStorage = {
  getItem: (key) => {
    const cookies = document.cookie
      .split(";")
      .map((cookie) => cookie.split("="))
      .reduce((acc, [key, value]) => ({ ...acc, [key.trim()]: value }), {});
    return cookies[key];
  },
  setItem: (key, value) => {
    document.cookie = `${key}=${value}; expires=${new Date(
      new Date().getTime() + 1000 * 60 * 60 * 24 * 365,
    ).toGMTString()}; path=/ `;
  },
};

const storageType = cookieStorage;
const consentPropertyName = "audacity_consent";
const ATTENTION_OVERLAY_CHANNEL = "attention-overlay";
const COOKIE_CONSENT_OWNER = "cookie-consent";
const COOKIE_CONSENT_PRIORITY = 10;

const getUiSemaphore = () => {
  if (typeof window === "undefined") {
    return null;
  }

  if (window.__audacityUiSemaphore) {
    return window.__audacityUiSemaphore;
  }

  const state = window.__audacityUiSemaphoreState || {
    locks: new Map(),
    listeners: new Set(),
  };

  window.__audacityUiSemaphoreState = state;

  const notify = (channel) => {
    const lock = state.locks.get(channel) || null;
    state.listeners.forEach((listener) => listener(channel, lock));
  };

  const semaphore = {
    acquire(channel, owner, options) {
      const requestedPriority = options?.priority || 0;
      const shouldPreempt = options?.preempt || false;
      const currentLock = state.locks.get(channel);

      if (currentLock && currentLock.owner !== owner) {
        if (!(shouldPreempt && requestedPriority > currentLock.priority)) {
          return false;
        }
      }

      if (
        currentLock &&
        currentLock.owner === owner &&
        currentLock.priority === requestedPriority
      ) {
        return true;
      }

      state.locks.set(channel, {
        owner,
        priority: requestedPriority,
      });
      notify(channel);
      return true;
    },
    release(channel, owner) {
      const currentLock = state.locks.get(channel);
      if (!currentLock || currentLock.owner !== owner) {
        return false;
      }

      state.locks.delete(channel);
      notify(channel);
    },
    isLocked(channel) {
      return state.locks.has(channel);
    },
    getLock(channel) {
      return state.locks.get(channel) || null;
    },
    subscribe(listener) {
      state.listeners.add(listener);
      return () => {
        state.listeners.delete(listener);
      };
    },
  };

  window.__audacityUiSemaphore = semaphore;
  return semaphore;
};

const showShowPopup = () => !storageType.getItem(consentPropertyName);
const saveAcceptToStorage = () =>
  storageType.setItem(consentPropertyName, true);
const saveRejectToStorage = () =>
  storageType.setItem(consentPropertyName, false);

window.addEventListener("load", function () {
  const consentPopup = document.getElementById("consent-popup");
  const acceptBtn = document.getElementById("accept");
  const rejectBtn = document.getElementById("reject");
  const semaphore = getUiSemaphore();
  let popupRetryTimeoutId = null;
  let shouldAttemptPopup = true;
  let tryShowPopup = () => {};

  const releaseOverlayLock = () => {
    if (!semaphore) {
      return;
    }

    semaphore.release(ATTENTION_OVERLAY_CHANNEL, COOKIE_CONSENT_OWNER);
  };

  const stopPopupAttempts = () => {
    shouldAttemptPopup = false;
    if (popupRetryTimeoutId !== null) {
      window.clearTimeout(popupRetryTimeoutId);
      popupRetryTimeoutId = null;
    }
  };

  const queuePopupRetry = () => {
    if (!shouldAttemptPopup || !showShowPopup(storageType)) {
      return;
    }

    if (popupRetryTimeoutId !== null) {
      window.clearTimeout(popupRetryTimeoutId);
    }

    popupRetryTimeoutId = window.setTimeout(tryShowPopup, 300);
  };

  const acceptCookie = (event) => {
    event.preventDefault();

    saveAcceptToStorage(storageType);
    stopPopupAttempts();
    consentPopup.classList.add("hide");
    releaseOverlayLock();
    if (typeof _paq !== "undefined") {
      _paq.push(["setCookieConsentGiven"]);
    }
    injectClarity();
  };

  const rejectCookie = (event) => {
    event.preventDefault();

    saveRejectToStorage(storageType);
    stopPopupAttempts();
    consentPopup.classList.add("hide");
    releaseOverlayLock();
  };

  acceptBtn.addEventListener("click", acceptCookie);
  rejectBtn.addEventListener("click", rejectCookie);

  if (semaphore) {
    semaphore.subscribe((channel, lock) => {
      if (channel !== ATTENTION_OVERLAY_CHANNEL || !consentPopup) {
        return;
      }

      const ownedByCookie = lock?.owner === COOKIE_CONSENT_OWNER;
      if (!ownedByCookie && !consentPopup.classList.contains("hide")) {
        consentPopup.classList.add("hide");
      }

      if (!lock && shouldAttemptPopup && showShowPopup(storageType)) {
        queuePopupRetry();
      }
    });
  }

  if (showShowPopup(storageType)) {
    tryShowPopup = () => {
      if (!shouldAttemptPopup || !showShowPopup(storageType)) {
        return;
      }

      if (!semaphore) {
        consentPopup.classList.remove("hide");
        return;
      }

      const acquired = semaphore.acquire(
        ATTENTION_OVERLAY_CHANNEL,
        COOKIE_CONSENT_OWNER,
        {
          priority: COOKIE_CONSENT_PRIORITY,
          preempt: false,
        },
      );

      if (!acquired) {
        queuePopupRetry();
        return;
      }

      consentPopup.classList.remove("hide");
    };

    setTimeout(tryShowPopup, 2000);
  }
});
