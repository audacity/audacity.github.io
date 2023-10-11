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
      new Date().getTime() + 1000 * 60 * 60 * 24 * 365
    ).toGMTString()}; path=/ `;
  },
};

const storageType = cookieStorage;
const consentPropertyName = "audacity_consent";

const showShowPopup = () => !storageType.getItem(consentPropertyName);
const saveAcceptToStorage = () =>
  storageType.setItem(consentPropertyName, true);
const saveRejectToStorage = () =>
  storageType.setItem(consentPropertyName, false);
const applyMatomoTrackingCode = () => {
  console.log(
    "audacity-consent cookie created, running Matomo tracking code..."
  );
  var _paq = (window._paq = window._paq || []);
  /* tracker methods like "setCustomDimension" should be called before "trackPageView" */
  _paq.push(["trackPageView"]);
  _paq.push(["enableLinkTracking"]);
  (function () {
    var u = "https://matomo.audacityteam.org/";
    _paq.push(["setTrackerUrl", u + "matomo.php"]);
    _paq.push(["setSiteId", "19"]);
    var d = document,
      g = d.createElement("script"),
      s = d.getElementsByTagName("script")[0];
    g.async = true;
    g.src = u + "matomo.js";
    s.parentNode.insertBefore(g, s);
  })();
};

window.onload = () => {
  const consentPopup = document.getElementById("consent-popup");
  const acceptBtn = document.getElementById("accept");
  const rejectBtn = document.getElementById("reject");

  const acceptCookie = (event) => {
    event.preventDefault();

    saveAcceptToStorage(storageType);
    consentPopup.classList.add("hide");
    applyMatomoTrackingCode();
  };

  const rejectCookie = (event) => {
    event.preventDefault();

    saveRejectToStorage(storageType);
    consentPopup.classList.add("hide");
  };

  acceptBtn.addEventListener("click", acceptCookie);
  rejectBtn.addEventListener("click", rejectCookie);

  if (showShowPopup(storageType)) {
    setTimeout(() => {
      consentPopup.classList.remove("hide");
    }, 2000);
  }
};
