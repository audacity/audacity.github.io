import React from "react";

function AudioDotComCard(props) {
  const { title, icon, body, img } = props;
  return (
    <div
      className="p-4 rounded-lg flex flex-col text-left justify-between border"
    >
      <span className={`icon icon-medium ${icon} text-accent`}></span>
      <div>
        <small>{title}</small>
        <p>{body}</p>
      </div>
    </div>
  );
}

export default AudioDotComCard;
