export function trackEvent(category, action, name) {
  // assign branch from Netlify
  const branch = import.meta.env.BRANCH || "unknown-branch";

  console.log("Clicked");

  // check id global variable _paq has been injected by Maotomo tracking script
  if (typeof _paq !== "undefined") {
    console.log([
      "trackEvent",
      category,
      `${action} (branch: ${branch})`,
      name,
    ]);
  } else {
    console.log("Failed");
  }
  //_paq.push(["trackEvent", category, action, name, value]);
}
