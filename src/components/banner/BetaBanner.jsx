import React from "react";
import "../../styles/icons.css";

function BetaBanner() {
  return (
    <div
      id="beta-banner"
      className="hidden items-center justify-center min-h-24 bg-orange-400 gap-4 flex-wrap"
    >
      <div className="flex gap-2 flex-wrap my-4 mx-2">
        <p className="text-xl font-bold text-gray-900">Get early access to new features!</p>
        <p className="text-xl text-gray-900">Help us test our ‘Save to cloud’ feature</p>
      </div>
      <a href="/beta" id="join-button" className="flex text-xl h-12 my-4 justify-center items-center px-4 border-2 border-gray-900 rounded-md hover:bg-gray-900 hover:text-white">Join the beta</a>
      <a
        className="flex justify-center items-center h-10 w-10 hover:bg-orange-600 rounded-md"
        id="close-button"
      >
        <span className="icon icon-times"></span>
      </a>
    </div>
  );
}

export default BetaBanner;
