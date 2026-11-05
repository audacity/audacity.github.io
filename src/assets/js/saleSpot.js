/*
  Runtime for the homepage sale promo (components/promo/SaleSpot.astro):
  countdowns, dismissal, and the promo_impression / promo_click /
  promo_dismiss events the "promo-spot" experiment is read from.

  Event name is "<arm>|<campaign>|<first|repeat>". "first" marks the
  visitor's first ever promo impression (and clicks on that page view), so
  spots can be compared before anyone has closed the A or C banner.
*/
import {
  SALE_SPOT_CAMPAIGN,
  SALE_SPOT_COUNTDOWN_TO,
  SALE_SPOT_EXPERIMENT,
} from "../data/promos/saleSpot";
import { trackEvent } from "../../utils/matomo";

const CATEGORY = "Promo Spot";
const VIEWS_KEY = `promo-views:${SALE_SPOT_CAMPAIGN}`;
const DISMISSED_KEY = `promo-dismissed:${SALE_SPOT_CAMPAIGN}`;

const root = document.documentElement;
const arm = root.getAttribute(`data-exp-${SALE_SPOT_EXPERIMENT}`);
const spot = document.querySelector(`.promo-spot[data-promo-arm="${arm}"]`);

const isShowing = () =>
  spot !== null &&
  !root.hasAttribute("data-promo-expired") &&
  !(root.hasAttribute("data-promo-dismissed") && (arm === "a" || arm === "c"));

const storage = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {}
  },
};

let viewKind = null;
const track = (action) =>
  trackEvent(
    CATEGORY,
    action,
    `${arm}|${SALE_SPOT_CAMPAIGN}|${viewKind ?? "first"}`,
  );

function startCountdown() {
  const target = Date.parse(SALE_SPOT_COUNTDOWN_TO);
  const fields = spot.querySelectorAll("[data-unit]");
  const pad = (n) => String(n).padStart(2, "0");
  const tick = () => {
    const left = Math.max(0, Math.floor((target - Date.now()) / 1000));
    const values = {
      d: Math.floor(left / 86400),
      h: Math.floor(left / 3600) % 24,
      m: Math.floor(left / 60) % 60,
      s: left % 60,
    };
    fields.forEach((el) => (el.textContent = pad(values[el.dataset.unit])));
  };
  tick();
  setInterval(tick, 1000);
}

function watchImpression() {
  const record = () => {
    const views = Number(storage.get(VIEWS_KEY)) || 0;
    viewKind = views === 0 ? "first" : "repeat";
    storage.set(VIEWS_KEY, String(views + 1));
    track("promo_impression");
  };
  if (!("IntersectionObserver" in window)) {
    record();
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        record();
      }
    },
    { threshold: 0.5 },
  );
  io.observe(arm === "c" ? spot.firstElementChild : spot);
}

/*
  The cookie consent bar is fixed to the bottom of the viewport on top of
  everything. While it's up, lift the sticky pill above it rather than
  letting the pill sit hidden behind it — a covered pill would still log an
  impression. Keyed off the bar's .hide class, not its position: it slides
  in and out over 0.5s, and the pill slides along with it (SaleSpot.astro).
*/
function clearConsentBar() {
  const consent = document.getElementById("consent-popup");
  if (!consent) return;
  const update = () => {
    const showing = !consent.classList.contains("hide");
    root.style.setProperty(
      "--promo-sticky-offset",
      showing ? `${consent.offsetHeight}px` : "0px",
    );
  };
  update();
  new MutationObserver(update).observe(consent, {
    attributes: true,
    attributeFilter: ["class"],
  });
  window.addEventListener("resize", update);
}

if (arm && isShowing()) {
  startCountdown();
  watchImpression();
  if (arm === "c") clearConsentBar();

  spot
    .querySelectorAll("[data-promo-link]")
    .forEach((link) =>
      link.addEventListener("click", () => track("promo_click")),
    );
  spot.querySelector("[data-promo-dismiss]")?.addEventListener("click", () => {
    storage.set(DISMISSED_KEY, "1");
    root.setAttribute("data-promo-dismissed", "");
    track("promo_dismiss");
  });
}
