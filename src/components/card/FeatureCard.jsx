import React from "react";
import '../../styles/icons.css'

function FeatureCard(props) {
  const { icon, title, description } = props;

  return (
    <div className="h-full col-span-12 sm:col-span-6 xl:col-span-3 p-4 md:p-6 border drop-shadow-sm md:drop-shadow-lg bg-white rounded-lg flex flex-col md:gap-2">
      <span className={`icon icon-medium text-blue-700 ${icon}`}></span>
      <h4>{title}</h4>
      <p className="">{description}</p>
    </div>
  );
}

export default FeatureCard;
