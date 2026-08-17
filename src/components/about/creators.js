import { getImage } from "astro:assets";
import music from "../../assets/img/creators/music.webp";
import restoring from "../../assets/img/creators/restoring.webp";
import podcast from "../../assets/img/creators/podcast.webp";
import video from "../../assets/img/creators/video.webp";

/*
  Source of truth for the "Inspired by you" photography.

  These live in src/assets rather than public/ so Astro's image pipeline can
  resize and re-encode them. CreatorWorkflows is a client island, and <Image />
  only works in .astro files, so the .astro caller runs optimiseCreators() and
  passes the finished `src` strings down as a prop — the same shape
  Audiodotcom.astro uses for FeaturedVideo.

  Server-side only: this module imports astro:assets, so never import it from a
  component that ships to the browser.
*/
const CREATORS = [
  {
    id: "music",
    image: music,
    label: "Recording and editing music",
    source: true,
    /*
      Portrait 2046x3074 shown as a 24/9 letterbox band, so object-cover keeps
      only about a quarter of the height. Centred, that band lands on the window
      and treetops; the desk, monitor and player sit in the lower half. Pulling
      the focal point down to 67% frames the screen and the person instead.
    */
    position: "50% 67%",
  },
  { id: "podcast", image: podcast, label: "Podcasts and spoken-word" },
  {
    id: "restoring",
    image: restoring,
    label: "Cleaning up and restoring audio",
  },
  { id: "video", image: video, label: "Editing audio for video" },
];

/*
  Widths are sized for the fullbleed variant used on /about: the source image
  is an edge-to-edge 24/9 band, so it needs to cover the viewport, while the
  three supporting tiles each occupy a third of it. The other variants (dev
  page only) render smaller than this, so these sizes cover them too.
*/
const WIDTH = { source: 2000, supporting: 900 };

export async function optimiseCreators() {
  return Promise.all(
    CREATORS.map(async ({ id, image, label, source, position }) => ({
      id,
      label,
      source,
      position,
      src: (
        await getImage({
          src: image,
          format: "webp",
          width: source ? WIDTH.source : WIDTH.supporting,
          quality: 70,
        })
      ).src,
    })),
  );
}
