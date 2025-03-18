import React from "react";
import { trackEvent } from "../../utils/matomo";

function handleButtonClick(eventName) {
  if (typeof _paq !== "undefined") {
    trackEvent("CTA Button", "audio.com CTA", "audio.com block CTA")
  }
}

function JoinAudioDotComButton(props) {
  const { href, matomoEventName, large } = props;
  return (
    <a
      onClick={() => {
        handleButtonClick(matomoEventName);
      }}
      className={` ${
        large ? "py-4 px-6" : "py-2 px-4"
      } bg-blue-700 w-fit text-white rounded hover:bg-blue-600`}
    >
      Continue
    </a>
  );
}

export default JoinAudioDotComButton;
