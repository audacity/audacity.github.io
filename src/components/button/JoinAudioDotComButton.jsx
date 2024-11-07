import React from "react";

function handleButtonClick(eventName) {
  if (typeof _paq !== "undefined") {
    _paq.push(["trackEvent", "CTA Button", "audio.com CTA", `${eventName}`]);
  }
}

function JoinAudioDotComButton(props) {
  const { href, matomoEventName, large } = props;
  return (
    <a
      onClick={() => {
        handleButtonClick(matomoEventName);
      }}
      href={href}
      className={` ${
        large ? "py-4 px-6" : "py-2 px-4"
      } bg-blue-700 w-fit text-white rounded hover:bg-blue-600`}
    >
      Continue
    </a>
  );
}

export default JoinAudioDotComButton;
