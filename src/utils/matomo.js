export function trackEvent(category, action, name) {
  // assign branch from Netlify
  const branch = import.meta.env.BRANCH || "unknown-branch";

  const matomoQueue = typeof window !== "undefined" ? window._paq : undefined;

  // check id global variable _paq has been injected by Maotomo tracking script
  if (matomoQueue && typeof matomoQueue.push === "function") {
    matomoQueue.push([
      "trackEvent",
      category,
      `${action} (branch: ${branch})`,
      name,
    ]);
  } else {
    console.log("_paq undefined, could not send Matomo event");
  }
}

function getCookieValue(name) {
  if (typeof document === "undefined") {
    return null;
  }
  const cookiePrefix = `${name}=`;
  const cookiePart = document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(cookiePrefix));

  if (!cookiePart) {
    return null;
  }

  return cookiePart.slice(cookiePrefix.length);
}

export function hasMatomoConsent() {
  return getCookieValue("audacity_consent") === "true";
}

export function trackEventIfConsented(category, action, name) {
  if (!hasMatomoConsent()) {
    return;
  }

  trackEvent(category, action, name);
}
