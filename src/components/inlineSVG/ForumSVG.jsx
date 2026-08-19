/*
  The forum has no brand mark of its own, unlike Discord and GitHub, so this is
  a generic speech bubble. Drawn as a filled shape rather than a stroked outline
  so it sits at the same visual weight as the two logos beside it.
*/
const ForumSVG = ({ className = "h-6 fill-accent" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={className}
  >
    <path d="M12 2C6.48 2 2 5.92 2 10.75c0 2.7 1.4 5.11 3.6 6.71-.16 1.36-.72 2.62-1.6 3.62 1.9-.28 3.62-1.02 5.03-2.06.94.22 1.93.34 2.97.34 5.52 0 10-3.92 10-8.61S17.52 2 12 2m-4 10a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5m4 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5m4 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5" />
  </svg>
);

export default ForumSVG;
