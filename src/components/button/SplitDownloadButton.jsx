import React, { useState } from "react";

function SplitDownloadButton(props) {
  const { OS, downloadHref, releaseData } = props;

  const [isOpen, setIsOpen] = useState(false);

  function handleButtonClick() {
    setIsOpen(!isOpen);
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-center w-fit rounded-md text-white">
        <a href={releaseData[0].browser_download_url} className="flex items-center gap-3  h-10 pl-4 pr-3 rounded-l-md rounded-bl-md bg-blue-700 hover:bg-blue-600">
          <svg
            className="w-4 fill-white"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 448 512"
          >
            <path d="M0 93.7l183.6-25.3v177.4H0V93.7zm0 324.6l183.6 25.3V268.4H0v149.9zm203.8 28L448 480V268.4H203.8v177.9zm0-380.6v180.1H448V32L203.8 65.7z"></path>
          </svg>
          {OS}
        </a>
        <div
          onClick={() => handleButtonClick()}
          
          className={`flex h-10 w-10 justify-center items-center ${
            isOpen ? `bg-blue-800` : `bg-blue-700 hover:bg-blue-600`
          } rounded-r-md`}
        >
          <span className="align-middle icon icon-caret-down text-white"></span>
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-10 bg-white border border-b-gray-100 py-2">
          <div className="flex flex-col">
            {releaseData.map((item, index) => (
              <a href={item.browser_download_url} className="py-2 px-4 hover:bg-slate-200" key={index}>{item.name}</a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SplitDownloadButton;
