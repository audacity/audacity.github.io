import React from "react";

function DownloadsPaginationButton(props) {
  const { children, destinationURL } = props;
  return (
    <a href={destinationURL} class="flex w-full flex-col border rounded p-4">
      <p>Download for</p>
      <div class="flex items-center text-xl lg:text-2xl font-bold gap-x-2">
        {children}
      </div>
    </a>
  );
}

export default DownloadsPaginationButton;
