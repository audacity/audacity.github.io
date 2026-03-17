import type { PromoData } from "./types";

export const videoPromos: Record<string, PromoData> = {
  audacity4Video: {
    type: "video",
    isActive: true,
    priority: 50,
    slot: 1,
    message: "How we're building Audacity 4",
    tracking: {
      category: "Video embed",
      action: "Watch release video",
      name: "How we're building Audacity 4",
    },
    video: {
      placeholderImage: "https://i.ytimg.com/vi/QYM3TWf_G38/maxresdefault.jpg",
      imageAltText: "Video thumbnail: How we're building Audacity 4",
      videoURL: "https://www.youtube-nocookie.com/embed/QYM3TWf_G38?autoplay=1",
    },
  },
  playgrndFxVideo: {
    type: "video",
    isActive: false,
    priority: 50,
    slot: 2,
    message:
      "Install once. Access tons of powerful plugins. Blend for infinite creativity.",
    cta: {
      text: "Get it on MuseHub",
      link: "https://www.musehub.com/plugin/playgrnd-fx?utm_source=au-web&utm_medium=mh-web-cta&utm_campaign=au-web-mh-web-playgrnd-fx",
    },
    tracking: {
      category: "Video embed",
      action: "Watch release video",
      name: "PLAYGRND FX",
    },
    video: {
      placeholderImage: "https://i.ytimg.com/vi/UGiJCTu67Ak/maxresdefault.jpg",
      imageAltText: "Video thumbnail: PLAYGRND FX",
      videoURL: "https://www.youtube-nocookie.com/embed/UGiJCTu67Ak?autoplay=1",
    },
  },
  landrFxVoiceVideo: {
    type: "video",
    isActive: false,
    priority: 50,
    slot: 2,
    message: "One knob for polished studio quality vocals",
    cta: {
      text: "Get it on MuseHub",
      link: "https://www.musehub.com/plugin/landr-fx-voice?utm_source=au-web&utm_medium=au-web-video&utm_campaign=au-web-mh-web-landr-fx-voice",
    },
    tracking: {
      category: "Video embed",
      action: "Watch release video",
      name: "LANDR FX Voice",
    },
    video: {
      placeholderImage: "https://i.ytimg.com/vi/JKAvMrLpIRI/maxresdefault.jpg",
      imageAltText: "Video thumbnail: LANDR FX Voice",
      videoURL: "https://www.youtube-nocookie.com/embed/JKAvMrLpIRI?autoplay=1",
    },
  },
  overtuneVideo: {
    type: "video",
    isActive: true,
    priority: 50,
    slot: 2,
    message:
      "Record your vocals on top of premium beats! Polish, personalize and share with ease",
    cta: {
      text: "Get it on MuseHub",
      link: "https://www.musehub.com/app/overtune-studio?utm_source=au-web&utm_medium=au-web-video&utm_campaign=au-web-mh-web-overtune-2",
    },
    tracking: {
      category: "Video embed",
      action: "Watch release video",
      name: "Overtune",
    },
    video: {
      placeholderImage: "https://i.ytimg.com/vi/A4jPvCdbrKA/hqdefault.jpg",
      imageAltText: "Video thumbnail: Overtune",
      videoURL: "https://www.youtube-nocookie.com/embed/A4jPvCdbrKA?autoplay=1",
    },
  },
};
