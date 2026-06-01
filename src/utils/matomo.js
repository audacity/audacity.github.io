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

function getFileNameFromUrl(url) {
  try {
    const parts = new URL(url).pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || "unknown-file";
  } catch {
    return "unknown-file";
  }
}

function getDownloadChannel(url) {
  try {
    const { hostname } = new URL(url);
    if (hostname === "muse-cdn.com") return "musehub";
    if (hostname === "github.com") return "audacity";
    return hostname;
  } catch {
    return "unknown";
  }
}

function getCurrentExperimentVariant(experimentName) {
  if (typeof document === "undefined") return "unknown";
  return (
    document.documentElement.getAttribute(`data-exp-${experimentName}`) ||
    "unknown"
  );
}

export function trackBinaryDownloadChoice({
  experimentName = "musehub-badge",
  variant,
  os,
  releaseName,
  url,
  source,
}) {
  const activeVariant = variant || getCurrentExperimentVariant(experimentName);
  const fileName = getFileNameFromUrl(url);
  const channel = getDownloadChannel(url);
  const action =
    channel === "musehub"
      ? "Download MuseHub"
      : channel === "audacity"
        ? "Download Audacity"
        : `Download ${channel}`;

  trackEvent(
    "Download Binary",
    action,
    [
      `${experimentName}:${activeVariant}`,
      os,
      releaseName || fileName,
      fileName,
      source,
    ]
      .filter(Boolean)
      .join("|"),
  );
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
