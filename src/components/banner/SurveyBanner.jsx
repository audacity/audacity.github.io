import React from "react";
import "../../styles/icons.css";
import { trackEvent } from "../../utils/matomo";

function SurveyBanner(url) {
  //no survey going on at the moment
  //return null;

  function handleButtonClick() {
    trackEvent("Survey CTA", "Survey CTA button", "Go to Survey");
  }

  return (
    <div
      id="survey-banner"
      className="flex items-center justify-center min-h-24 bg-yellow-300 gap-4 flex-wrap"
    >
      <div className="flex gap-2 flex-wrap my-4 mx-2">
        <p className="text-lg font-bold text-gray-900">3 minute survey:</p>
        <p className="text-lg text-gray-900">
          Help us understand what features you want in Audacity and Audio.com next
        </p>
      </div>
      <a
        href="https://docs.google.com/forms/d/e/1FAIpQLScxH_f64JPCWt5nwqa8MTPXfmi453mqYwy1xZFPF_mx9mYkNw/viewform"
        id="survey-button"
        onClick={() => {
          handleButtonClick();
        }}
        className="flex text-lg h-12 my-4 justify-center items-center px-4 border-2 border-gray-900 rounded-md hover:bg-gray-900 hover:text-white"
      >
        Take the survey
      </a>
    </div>
  );
}

export default SurveyBanner;
