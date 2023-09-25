import React from 'react'

function CookieConsent() {
  return (
    <div id="consent-popup" className="flex flex-col p-8 sticky bottom-0 w-full bg-white border border-top-1 hide">
    <h4>We value your piracy</h4>
    <div className="mt-2 flex justify-between">  
        <p>
            We use a privacy preserving first-party analytics service if you consent. Otherwise, only necessary cookies are used. <a href="/cookie-policy" class="hyperlink">Read cookie policy</a></p>
        <a id="accept" class="flex h-12 items-center border px-3 rounded-md bg-blue-700 text-white" href="#">Accept</a>
    </div>
</div>

  )
}

export default CookieConsent

