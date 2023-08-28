import React from "react";

function IconLinkCard(props) {
  const { icon, title, description, targetURL, linkText } = props;
  return (
    <div className="col-span-12 sm:col-span-6 flex flex-1 flex-col gap-12 border rounded-lg drop-shadow-lg bg-white p-6 justify-between">
      <div className="flex flex-col gap-2">
        <span className={`icon icon-medium ${icon} text-blue-600`}></span>
        <h4>{title}</h4>
        <p>{description}</p>
      </div>

      <a href={targetURL} className="hyperlink">
        {linkText}
      </a>
    </div>
  );
}

export default IconLinkCard;
