import React from "react";
import "../../styles/icons.css";

function BetaBanner() {
  return (
    <div
      id="beta-banner"
      className="hidden items-center justify-center h-24 bg-orange-400 gap-4"
    >
      <div className="flex gap-2">
        <p className="text-xl font-bold text-gray-900">Beta testers needed!</p>
        <p className="text-xl text-gray-900">Help us test our ‘Save to cloud’ feature</p>
      </div>
      <a className="flex text-xl h-12 justify-center items-center px-4 border-2 border-gray-900 rounded-md hover:bg-gray-900 hover:text-white">Join the beta</a>
      <a
        className="absolute right-8 flex justify-center items-center h-10 w-10 hover:bg-orange-600 rounded-md"
        id="close"
      >
        <span className="icon icon-times"></span>
      </a>
    </div>
  );
}

export default BetaBanner;
