const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
};

const branch = import.meta.env.BRANCH || "unknown-branch";

var _paq = (window._paq = window._paq || []);
/* tracker methods like "setCustomDimension" should be called before "trackPageView" */
_paq.push(['setCustomDimension', 1, branch]); // ab-branch
_paq.push(["trackPageView"]);
_paq.push(["enableLinkTracking"]);

// Tell Matomo to wait for cookie consent
_paq.push(['requireCookieConsent']);
(function () {
  var u = "https://matomo.audacityteam.org/";
  _paq.push(["setTrackerUrl", u + "matomo.php"]);
  _paq.push(["setSiteId", "2"]);
  var d = document,
    g = d.createElement("script"),
    s = d.getElementsByTagName("script")[0];
  g.async = true;
  g.src = u + "matomo.js";
  s.parentNode.insertBefore(g, s);
})();

if (getCookie("audacity_consent") === "true") {
  _paq.push(["setCookieConsentGiven"]);
} 

