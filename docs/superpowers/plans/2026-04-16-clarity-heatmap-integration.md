# Microsoft Clarity Heatmap Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate Microsoft Clarity heatmap tracking, gated behind the existing cookie consent flow (bundled with Matomo).

**Architecture:** Clarity's script is injected dynamically only after the user accepts cookies. A shared utility (`injectClarity`) is called from both `cookieConsent.js` (on accept) and `matomoTracking.js` (on page load for returning consented users). The cookie policy page is updated to disclose Clarity's cookies.

**Tech Stack:** Vanilla JS, Astro, Markdown

**Clarity Project ID:** `wccf621mrt`

---

### Task 1: Create Clarity injection utility

**Files:**
- Create: `src/assets/js/clarityTracking.js`

- [ ] **Step 1: Create the Clarity injection script**

```js
// src/assets/js/clarityTracking.js

let clarityInjected = false;

export function injectClarity() {
  if (clarityInjected) return;
  clarityInjected = true;

  (function (c, l, a, r, i, t, y) {
    c[a] =
      c[a] ||
      function () {
        (c[a].q = c[a].q || []).push(arguments);
      };
    t = l.createElement(r);
    t.async = 1;
    t.src = "https://www.clarity.ms/tag/" + i;
    y = l.getElementsByTagName(r)[0];
    y.parentNode.insertBefore(t, y);
  })(window, document, "clarity", "script", "wccf621mrt");
}
```

- [ ] **Step 2: Commit**

```bash
git add src/assets/js/clarityTracking.js
git commit -m "feat: add Clarity injection utility"
```

---

### Task 2: Gate Clarity behind cookie consent (returning visitors)

**Files:**
- Modify: `src/assets/js/matomoTracking.js:1,34-36`

On page load, if the user has already accepted cookies, inject Clarity alongside Matomo consent.

- [ ] **Step 1: Import and call injectClarity in matomoTracking.js**

Add import at the top of `src/assets/js/matomoTracking.js`:

```js
import { injectClarity } from "./clarityTracking.js";
```

Then modify the existing consent check block (lines 34-36) from:

```js
if (getCookie("audacity_consent") === "true") {
  _paq.push(["setCookieConsentGiven"]);
}
```

to:

```js
if (getCookie("audacity_consent") === "true") {
  _paq.push(["setCookieConsentGiven"]);
  injectClarity();
}
```

- [ ] **Step 2: Commit**

```bash
git add src/assets/js/matomoTracking.js
git commit -m "feat: inject Clarity on page load for consented users"
```

---

### Task 3: Gate Clarity behind cookie consent (new visitors accepting)

**Files:**
- Modify: `src/assets/js/cookieConsent.js:1,140-149`

When a new visitor clicks "Accept", inject Clarity immediately alongside Matomo consent.

- [ ] **Step 1: Import injectClarity in cookieConsent.js**

Add import at the top of `src/assets/js/cookieConsent.js`:

```js
import { injectClarity } from "./clarityTracking.js";
```

- [ ] **Step 2: Call injectClarity in the acceptCookie handler**

Modify the `acceptCookie` function (lines 140-149) from:

```js
  const acceptCookie = (event) => {
    event.preventDefault();

    saveAcceptToStorage(storageType);
    stopPopupAttempts();
    consentPopup.classList.add("hide");
    releaseOverlayLock();
    if (typeof _paq !== "undefined") {
      _paq.push(["setCookieConsentGiven"]);
    }
  };
```

to:

```js
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
```

- [ ] **Step 3: Commit**

```bash
git add src/assets/js/cookieConsent.js
git commit -m "feat: inject Clarity when user accepts cookie consent"
```

---

### Task 4: Update cookie policy page

**Files:**
- Modify: `src/pages/legal/cookie-policy.md`

- [ ] **Step 1: Update the "last updated" date**

Change:

```
Last updated: 13. October 2023
```

to:

```
Last updated: 16. April 2026
```

- [ ] **Step 2: Update the third-party cookies statement**

Change:

```
Please note that our Website does not use any third party cookies.
```

to:

```
Please note that our Website uses third party cookies from Microsoft Clarity for heatmap and session recording analytics.
```

- [ ] **Step 3: Update the "How do we use cookies?" section**

Change:

```
On our Website we use only first party cookies, which means that all your cookie data will be stored on our side in accordance with the rules applicable to the protection of privacy in the electronic communications sector.
```

to:

```
On our Website we use first party cookies and limited third party cookies (Microsoft Clarity). First party cookie data is stored on our side in accordance with the rules applicable to the protection of privacy in the electronic communications sector. Third party cookies are governed by Microsoft's privacy policy.
```

- [ ] **Step 4: Add Clarity cookies to the cookie table**

After the existing Matomo row in the cookie table:

```
|Cookies starting with:<br>`_pk...`, `mtm...`|Varies|Matomo cookies. [Details...](https://matomo.org/faq/general/faq_146/)|Analytics|
```

Add:

```
|`_clck`|1 year|Microsoft Clarity user ID cookie. [Details...](https://learn.microsoft.com/en-us/clarity/setup-and-installation/cookie-consent)|Analytics|
|`_clsk`|1 day|Microsoft Clarity session cookie. [Details...](https://learn.microsoft.com/en-us/clarity/setup-and-installation/cookie-consent)|Analytics|
|`CLID`|1 year|Microsoft Clarity tracking identifier|Analytics|
|`ANONCHK`|10 min|Microsoft Clarity check cookie|Analytics|
|`MR`|7 days|Microsoft cookie used with Clarity|Analytics|
|`MUID`|1 year|Microsoft user identifier|Analytics|
|`SM`|Session|Microsoft cookie used with Clarity|Analytics|
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/legal/cookie-policy.md
git commit -m "docs: update cookie policy with Microsoft Clarity cookies"
```

---

### Task 5: Manual verification

- [ ] **Step 1: Run the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify consent-gated behavior**

1. Open the site in an incognito window
2. Open DevTools > Network tab
3. Confirm NO requests to `clarity.ms` before accepting cookies
4. Click "Accept" on the cookie banner
5. Confirm a request to `clarity.ms/tag/wccf621mrt` appears in the Network tab

- [ ] **Step 3: Verify returning visitor behavior**

1. Refresh the page (consent cookie is now set)
2. Confirm `clarity.ms` loads automatically on page load

- [ ] **Step 4: Verify reject behavior**

1. Clear cookies, reload
2. Click "Reject" on the cookie banner
3. Confirm NO requests to `clarity.ms`

- [ ] **Step 5: Review cookie policy page**

1. Navigate to `/cookie-policy`
2. Confirm Clarity cookies are listed in the table
3. Confirm the updated date and third-party cookie language
