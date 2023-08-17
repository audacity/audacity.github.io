import React from "react";

function FeatureCard(props) {
  const { children, title, description } = props;

  return (
    <div class="col-span-3 p-6 border drop-shadow-lg bg-white rounded-lg h-96 flex flex-col gap-3">
      {children}
      <h3 class="text-2xl font-bold">{title}</h3>
      <p class="text-xl text-gray-600">{description}</p>
    </div>
  );
}

export default FeatureCard;
