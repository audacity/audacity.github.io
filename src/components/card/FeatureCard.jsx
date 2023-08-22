import React from "react";
import '../../styles/icons.css'

function FeatureCard(props) {
  const { icon, title, description } = props;

  return (
    <div className="h-full col-span-12 sm:col-span-6 xl:col-span-3 p-4 md:p-6 border drop-shadow-sm md:drop-shadow-lg bg-white rounded-lg flex flex-col">
      <span className={`icon icon-medium text-blue-700 ${icon}`}></span>
      <h3 className="text-lg md:text-xl mt-3 font-bold">{title}</h3>
      <p className="mt-2 text-base md:text-lg text-gray-600">{description}</p>
    </div>
  );
}

export default FeatureCard;
