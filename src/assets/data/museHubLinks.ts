/*
  MuseHub cross-links (Jira MUSH-1966 epic: MUSH-2266 Windows, MUSH-2267 Mac,
  MUSH-2269 /download, MUSH-2271 OpenVINO). Guillaume Mourier's rule: the
  date in utm_campaign (DDMMYY) is the day the links go live, so it lives in
  one place and is set on launch day.
*/
export const MUSEHUB_LINKS_LAUNCH_DAY = "241126";

/** A MuseHub page with the cross-link UTMs, tagged with where the click came from. */
export function museHubURL(path: string, content: string): string {
  return `https://www.musehub.com${path}?utm_source=AU&utm_medium=referral&utm_campaign=MH_WW_REF_AU_WEB_ALL_${MUSEHUB_LINKS_LAUNCH_DAY}_crosslink&utm_content=${content}`;
}

/** MuseHub's trending-plugins category, tagged with where the click came from. */
export function museHubTrendingPluginsURL(content: string): string {
  return museHubURL("/category/plugin/trending-plugins", content);
}
