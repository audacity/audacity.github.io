import React from "react";

function IconLinkCard(props) {
  const { icon, title, description, targetURL, linkText } = props;
  return (
    <div className="flex flex-1 flex-col gap-12 border rounded-lg drop-shadow-lg bg-white p-8 justify-between">
      <div className="flex flex-col gap-2">
        <span className={`icon icon-large ${icon} text-blue-700`}></span>
        <h4 className="text-xl font-bold">{title}</h4>
        <p className="text-xl">{description}</p>
      </div>

      <a href={targetURL} className="text-blue-700 underline text-xl">
        {linkText} <span className="icon icon-share text-blue-700"></span>
      </a>
    </div>
  );
}

export default IconLinkCard;
