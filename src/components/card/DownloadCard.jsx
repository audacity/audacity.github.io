import React from "react";
import { trackEvent } from "../../utils/matomo";

function DownloadCard(props) {
  const { OS, title, downloadURL, downloadType, checksum } = props;

  function handleDownloadButtonClick() {
    trackEvent(
      "Download Button",
      "Download Audacity",
      `${OS + " " + title + " " + downloadType}`,
    );

    setTimeout(() => {
      window.location.href = "/post-download";
    }, 2000);
  }

  return (
    <div className="border border-bg-200 rounded-md p-6">
      <div className="flex flex-col sm:flex-row gap-2 justify-between items-center">
        <h2 className="text-xl font-semibold">{title}</h2>
        <a
          onClick={() => {
            handleDownloadButtonClick();
          }}
          href={downloadURL}
          className="flex justify-center text-center items-center px-4 h-12 w-full sm:w-fit bg-slate-200 hover:bg-slate-300 text-base text-black rounded"
        >
          Download
        </a>
      </div>

      {checksum && (
        <div className="flex flex-col mt-8 border-t pt-4">
          <label htmlFor="checksum">Checksum:</label>
          <div
            id="checksum"
            className="mt-2 p-2 bg-gray-50 border border-gray-200"
          >
            <small className="break-words">{checksum}</small>
          </div>
        </div>
      )}
    </div>
  );
}

export default DownloadCard;
