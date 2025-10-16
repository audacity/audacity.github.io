import React from "react";

function CookieConsent() {
  return (
    <div
      id="consent-popup"
      className="bg-white sticky bottom-0 w-full border-t-2 hide"
    >
      <div className="flex flex-col  bg-white  hide max-w-screen-lg xl:max-w-screen-xl mx-auto">
        <p className="font-semibold text-xl">Your privacy matters</p>
        <div className="mt-2 flex flex-col md:flex-row md:justify-between">
          <p>
            We use cookies solely for analytics with Matomo. No third-party
            tracking. By clicking 'Accept', you allow us to track your visits.
            Choose 'Reject' if you'd prefer not to be tracked. 
            <a
              href="/cookie-policy"
              className="hyperlink ml-1"
              aria-label="Read cookie policy"
            >
              Read cookie policy
            </a>
          </p>
          <div className="flex w-full md:w-fit gap-2 mt-8 md:mt-0 md:ml-12">
            <a
              id="reject"
              className="flex h-12 w-full md:w-fit justify-center items-center border-2 border-gray-300 px-8 rounded-md text-text-primary hover:bg-gray-100"
              href="#"
              aria-label="reject"
            >
              Reject
            </a>
            <a
              id="accept"
              className="flex h-12 w-full md:w-fit justify-center items-center px-8 rounded-md bg-accent text-white hover:opacity-90 transition-opacity"
              href="#"
              aria-label="accept"
            >
              Accept
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CookieConsent;
