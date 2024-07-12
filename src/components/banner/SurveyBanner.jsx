import React from "react";
import "../../styles/icons.css";

function SurveyBanner(url) {
  //no survey going on at the moment
  return null;

  function handleButtonClick() {
    if (typeof _paq !== "undefined") {
      _paq.push([
        "trackEvent",
        "Survey CTA",
        "Survey CTA button",
        "Go to Survey",
      ]);
    }
  }

  return (
    <div
      id="survey-banner"
      className="flex items-center justify-center min-h-24 bg-orange-400 gap-4 flex-wrap"
    >
      <div className="flex gap-2 flex-wrap my-4 mx-2">
        <p className="text-lg font-bold text-gray-900">
          1-2 minute survey:
        </p>
        <p className="text-lg text-gray-900">
          Help us understand why and how people are using AI tools for audio editing, VO and production work.
        </p>
      </div>
      <a
        href="https://xo9ucdlwlod.typeform.com/to/LPNgta5L"
        id="survey-button"
        onClick={() => {handleButtonClick();}}
        className="flex text-lg h-12 my-4 justify-center items-center px-4 border-2 border-gray-900 rounded-md hover:bg-gray-900 hover:text-white"
      >
        Take the survey
      </a>
    </div>
  );
}

export default SurveyBanner;
