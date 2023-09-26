import React from "react";

function CookieConsent() {
  return (
    <div
      id="consent-popup"
      className="bg-white sticky bottom-0 w-full border-t-2 hide"
    >
      <div className="flex flex-col  bg-white  hide max-w-screen-lg xl:max-w-screen-xl mx-auto">
        <p class="privacy-banner-heading">We value your piracy</p>
        <div className="mt-2 flex flex-col md:flex-row md:justify-between">
          <p>
            We use a privacy preserving first-party analytics service if you
            consent. Otherwise, only necessary cookies are used.
            <a href="/cookie-policy" class="hyperlink" aria-label="Read cookie policy">Read cookie policy</a>
          </p>
          <div className="flex w-full md:w-fit gap-2 mt-8 md:mt-0">
            <a
              id="reject"
              class="flex h-12 w-full md:w-fit justify-center items-center border border-blue-700 px-3 rounded-md  text-blue-700"
              href="#"
              aria-label="reject"
            >
              Reject
            </a>
            <a
              id="accept"
              class="flex h-12 w-full md:w-fit justify-center items-center px-3 rounded-md bg-blue-700 text-white"
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
