import { getImage } from "astro:assets";
import audioCom from "../../assets/img/audiocom/Audio_com.webp";
import projectPage from "../../assets/img/audiocom/Project_page.webp";
import museHubEffects from "../../assets/img/musehub/MuseHub_effects.webp";
import museHubPlugin from "../../assets/img/musehub/MuseHub_plugin.webp";

/*
  UI screenshots for the AudioCom and MuseHub panels on /about, keyed by the
  panel id each component uses.

  Same arrangement as creators.js: both components are client islands and
  <Image /> is .astro-only, so the .astro caller awaits the optimiser and
  passes the finished srcs down. Sources live in src/assets as lossless WebP
  — pixel-identical to the PNGs they replace but 37% smaller in the repo, and
  lossless so the pipeline's own encode is the only lossy step.

  Server-side only: imports astro:assets, so never import from browser code.
*/
const PANEL_IMAGES = {
  audiocom: audioCom,
  "project-page": projectPage,
  effects: museHubEffects,
  plugin: museHubPlugin,
};

/*
  Rendered w-full in a half-width card, so ~700 CSS px at the page's widest.
  1512 is the native width and keeps them crisp on 2x displays.
*/
export async function optimisePanelImages() {
  const entries = await Promise.all(
    Object.entries(PANEL_IMAGES).map(async ([id, image]) => [
      id,
      (await getImage({ src: image, format: "webp", width: 1512, quality: 78 }))
        .src,
    ]),
  );
  return Object.fromEntries(entries);
}
