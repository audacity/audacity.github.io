import React, { useState } from "react";

function ChecksumAccordion(props) {
  const { title, downloadUrl, checksum } = props;

  const [isOpen, setIsOpen] = useState(false);

  function toggleAccordion() {
    setIsOpen((prevIsOpen) => !prevIsOpen);
  }

  return (
    <div
      className="p-2 border border-gray-200 rounded flex flex-col"
      onClick={toggleAccordion}
    >
      <div class="flex align-middle">
        {isOpen ? (
          <span class="align-middle icon icon-caret-down text-gray-600"></span>
        ) : (
          <span class="align-middle icon icon-caret-right text-gray-600"></span>
        )}
        <h5>{title}</h5>
      </div>

      {isOpen && (
        <div class="flex flex-col gap-2 mt-2">
          <div class="flex flex-col">
            <label>Checksum:</label>
            <div class="p-2 border bg-gray-50">
              <small class="break-words">{checksum}</small>
            </div>
          </div>
          <a
            href={downloadUrl}
            class="flex justify-center bg-gray-200 hover:bg-gray-300 text-gray p-2 rounded"
          >
            Download {title}
          </a>
        </div>
      )}
    </div>
  );
}

export default ChecksumAccordion;
