import React from "react";

function FeatureCard(props) {
  const { children, title, description } = props;

  return (
    <div class="col-span-3 p-6 border drop-shadow-lg bg-white rounded-lg h-96 flex flex-col">
      {children}
      <h3 class="text-xl mt-3 font-bold">{title}</h3>
      <p class="mt-2 text-lg text-gray-600">{description}</p>
    </div>
  );
}

export default FeatureCard;
