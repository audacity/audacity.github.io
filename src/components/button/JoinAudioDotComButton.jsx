import { trackEvent } from "../../utils/matomo";

function handleButtonClick() {
  if (typeof _paq !== "undefined") {
    trackEvent("CTA Button", "audio.com CTA", "audio.com block CTA")
  }
}

function JoinAudioDotComButton(props) {
  const { href, large } = props;
  return (
    <a
      onClick={() => {
        handleButtonClick();
      }}
      className={` ${
        large ? "py-4 px-6" : "py-2 px-4"
      } bg-blue-700 w-fit text-white rounded hover:bg-blue-600`}
      href={href}
    >
      Continue
    </a>
  );
}

export default JoinAudioDotComButton;
