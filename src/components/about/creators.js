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
    /*
      Portrait 2046x3074 in a supporting tile. Centred, the crop favours
      the window and treetops; 67% pulls the focal point down to the
      desk, monitor and person.
    */
    position: "50% 67%",
  },
  { id: "podcast", image: podcast, label: "Podcasts and spoken-word" },
  /*
    Band choice is a trade: restoring is portrait 2046 wide, so the 24/9
    band upscales ~1.2x on retina, but its centre crop (headphones in
    profile, spectrogram filling the monitor) tells the story better
    than the sharper alternatives — video's screen composite looks
    pasted on, and the colourful spectrogram masks the softness.
  */
  {
    id: "restoring",
    image: restoring,
    label: "Cleaning up and restoring audio",
    source: true,
  },
  { id: "video", image: video, label: "Editing audio for video" },
];

/*
  Widths are sized for the fullbleed variant used on /about: the source image
  is an edge-to-edge 24/9 band, so it needs to cover the viewport, while the
  three supporting tiles each occupy a third of it. The other variants (dev
  page only) render smaller than this, so these sizes cover them too.
*/
/*
  The source band spans the viewport below xl and a contained
  max-w-screen-xl card above it. The restoring photo is 2046 wide
  natively, so serve every pixel at a higher quality — encoding
  artifacts would compound the retina upscale.
*/
const WIDTH = { source: 2046, supporting: 900 };
const QUALITY = { source: 80, supporting: 70 };

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
          quality: source ? QUALITY.source : QUALITY.supporting,
        })
      ).src,
    })),
  );
}
