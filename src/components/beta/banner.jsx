import React, { useState, useEffect } from "react";

function banner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem("bannerDismissed")) {
      setIsVisible(true);
    }
  }, []);

  function onDismissBanner() {
    sessionStorage.setItem("bannerDismissed", "true");
    setIsVisible(false);
  }

  if (!isVisible) return null;

  return (
    <div
      role="banner"
      className="flex bg-orange-400 text-center text-gray-900 text-xl h-24 justify-center items-center gap-4"
    >
      <div className="flex gap-3 items-center">
        <strong>Beta testers needed!</strong>Help us test our ‘Save to cloud’
        feature<a href="/beta"></a>
      </div>
      <a className="border-2 border-gray-900 rounded-md py-0.5 px-2 text-gray-900 font-semibold hover:bg-gray-900 hover:text-white">
        Join beta
      </a>
      <a
        onClick={() => onDismissBanner()}
        className="absolute right-8 flex h-10 w-10 items-center justify-center border-gray-900 hover:border-2 rounded-md"
      >
        <span className="icon icon-times"></span>
      </a>
    </div>
  );
}

export default banner;
