import React, { useState, useEffect, useRef } from "react";

function SplitDownloadButton(props) {
  const { OS, releaseData } = props;

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isOpen]);

  function handleButtonClick() {
    setIsOpen(!isOpen);
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center justify-center w-fit rounded-md text-white">
        <a
          href={releaseData[0].browser_download_url}
          className="flex items-center gap-3  h-10 pl-4 pr-3 rounded-l-md rounded-bl-md bg-blue-700 hover:bg-blue-600"
        >
          <img src={"src/assets/img/" + OS + ".svg"} class="w-4 fill-white" />
          {OS}
        </a>
        <button
          onClick={() => handleButtonClick()}
          className={`flex h-10 w-10 justify-center items-center ${
            isOpen ? `bg-blue-800` : `bg-blue-700 hover:bg-blue-600`
          } rounded-r-md`}
        >
          <span className="align-middle icon icon-caret-down text-white"></span>
          <span className="sr-only">More download options</span>
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-10 bg-white border border-b-gray-100 py-2 z-10">
          <div className="flex flex-col">
            {releaseData.map((item, index) => (
              <a
                href={item.browser_download_url}
                className="py-2 px-4 hover:bg-slate-200"
                key={index}
              >
                {item.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SplitDownloadButton;
