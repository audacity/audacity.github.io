import React from "react";

function DownloadsPaginationButton(props) {
  const { children, targetUrl } = props;
  return (
    <a href={targetUrl} class="flex flex-1 flex-col border rounded p-4 hover:bg-gray-50">
      <p>Download for</p>
      <div className="flex items-center text-lg lg:text-xl font-bold gap-x-2 text-gray-800 fill-gray-500">
        {children}
      </div>
    </a>
  );
}

export default DownloadsPaginationButton;
