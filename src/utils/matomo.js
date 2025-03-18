export function trackEvent(category, action, name) {
  // assign branch from Netlify
  const branch = import.meta.env.BRANCH || "unknown-branch";

  // check id global variable _paq has been injected by Maotomo tracking script
  if (typeof _paq !== "undefined") {
    _paq.push(["trackEvent", category, `${action} (branch: ${branch})`, name]);
  } else {
    console.log("_paq undefined, could not send Matomo event")
  }
}
