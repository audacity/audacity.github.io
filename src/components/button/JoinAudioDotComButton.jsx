import React from 'react'

function handleButtonClick() {
    if (typeof _paq !== "undefined") {
      _paq.push([
        "trackEvent",
        "CTA Button",
        "audio.com CTA",
        "audio.com block CTA",
      ]);
    }
  }

function JoinAudioDotComButton() {
  return (
    <a
            onClick={() => {
              handleButtonClick();
            }}
            href="https://audio.com/auth/sign-up?mtm_campaign=audacityteamorg&mtm_content=Block_button"
            className="px-4 py-2 bg-blue-700 w-fit text-white rounded hover:bg-blue-600"
          >
            Join for free
          </a>
  )
}

export default JoinAudioDotComButton