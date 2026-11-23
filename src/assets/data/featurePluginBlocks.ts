import { museHubURL } from "./museHubLinks";

/*
  MUSH-2270: the "Do more with plugins" block on the feature pages, keyed by the
  page's slug under /features/. Each page promotes the MuseHub category that
  fits it. Pages with no entry (cut, trim, split, ...) get no block. The
  targets are Guillaume Mourier's "use now" column; the per-effect categories
  (reverbs, delays, compressors...) aren't live on MuseHub yet, so those pages
  point at the full catalogue and their copy promises no more than that.
*/
export type FeaturePluginBlock = {
  /** MuseHub path, e.g. "/category/plugin/voice-and-podcasting". */
  path: string;
  /** utm_content for the click. */
  content: string;
  /** The line under "Do more with plugins". */
  subline: string;
};

const CATALOGUE = "/category/plugin";
const VOICE = "/category/plugin/voice-and-podcasting";
const AI = "/category/plugin/ai-powered-plugins";

const EFFECTS = "Find effects for Audacity on MuseHub";
const VOICE_LINE = "Find voice and podcast plugins for Audacity on MuseHub";

export const featurePluginBlocks: Record<string, FeaturePluginBlock> = {
  "noise-reduction": {
    path: VOICE,
    content: "features-noise-reduction",
    subline: VOICE_LINE,
  },
  "vocal-remover": {
    path: AI,
    content: "features-vocal-remover",
    subline: "Find AI-powered plugins for Audacity on MuseHub",
  },
  transcription: {
    path: VOICE,
    content: "features-transcription",
    subline: VOICE_LINE,
  },
  reverb: { path: CATALOGUE, content: "features-reverb", subline: EFFECTS },
  distortion: {
    path: CATALOGUE,
    content: "features-distortion",
    subline: EFFECTS,
  },
  compressor: {
    path: CATALOGUE,
    content: "features-compressor",
    subline: EFFECTS,
  },
  delay: { path: CATALOGUE, content: "features-delay", subline: EFFECTS },
  echo: { path: CATALOGUE, content: "features-echo", subline: EFFECTS },
};

/** The block for a /features/<slug>/ page, or null when the page has none. */
export function getFeaturePluginBlock(
  slug: string,
): (FeaturePluginBlock & { href: string }) | null {
  const block = featurePluginBlocks[slug];
  if (!block) return null;
  return { ...block, href: museHubURL(block.path, block.content) };
}
