// Team roster for the video-call section. `photo` is null until real
// webcam-style headshots land — the UI falls back to an initials avatar.
// Swapping photos in is a data-only change: set `photo` to a path under
// /public (e.g. "/team/alex.jpg").
//
// Names are first-name only and `initials` is the single first-name letter,
// so nothing in this section exposes a surname (the initials avatar shows
// for members without a photo).
export const TEAM_ROSTER = [
  {
    id: "alex",
    name: "Alex",
    role: "Product Designer",
    initials: "A",
    avatarColor: "#7c5cff",
    photo: "/videos/team/Alex.jpg",
    video: "/videos/team/Alex.mp4",
  },
  {
    id: "anton",
    name: "Anton",
    role: "QA Manual Engineer",
    initials: "A",
    avatarColor: "#cc6655",
    photo: "/videos/team/Anton.jpg",
    video: "/videos/team/Anton.mp4",
  },
  {
    id: "dmitry",
    name: "Dmitry",
    role: "C++ Developer",
    initials: "D",
    avatarColor: "#55aa88",
    photo: "/videos/team/Dmitry.jpg",
    video: "/videos/team/Dmitry.mp4",
  },
  {
    id: "gabriel",
    name: "Gabriel",
    role: "C++ Developer",
    initials: "G",
    avatarColor: "#6688bb",
    photo: "/videos/team/Gabriel.jpg",
    video: "/videos/team/Gabriel.mp4",
  },
  {
    id: "grzegorz",
    name: "Grzegorz",
    role: "C++ Developer",
    initials: "G",
    avatarColor: "#aa6677",
    photo: "/videos/team/Grzegorz.jpg",
    video: "/videos/team/Grzegorz.mp4",
  },
  {
    id: "johan",
    name: "Johan",
    role: "Audacity Product Design",
    initials: "J",
    avatarColor: "#5599aa",
    photo: null,
  },
  {
    id: "matthieu",
    name: "Matthieu",
    role: "Senior Audio Developer",
    initials: "M",
    avatarColor: "#bb8855",
    photo: "/videos/team/Matthieu.jpg",
    video: "/videos/team/Matthieu.mp4",
  },
  {
    id: "paul",
    name: "Paul",
    role: "Audio Developer",
    initials: "P",
    avatarColor: "#66aa99",
    photo: "/videos/team/Paul.jpg",
    video: "/videos/team/Paul.mp4",
  },
  {
    id: "sergey",
    name: "Sergey",
    role: "QA Manual Engineer",
    initials: "S",
    avatarColor: "#9966bb",
    photo: null,
  },
  {
    id: "yana",
    name: "Yana",
    role: "Project Manager",
    initials: "Y",
    avatarColor: "#cc7788",
    photo: "/videos/team/Yana.jpg",
    video: "/videos/team/Yana.mp4",
  },
];
