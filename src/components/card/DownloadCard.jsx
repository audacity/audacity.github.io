import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

function DownloadCard(props) {
  const { title, checksum, downloadURL, buttonText, downloadType } = props;
  const [isOpen, setIsOpen] = useState(false);

  function showDetailsHandler() {
    setIsOpen(!isOpen);
  }

  return (
    <div className="border rounded-md p-4 flex flex-col">
      <div className="flex justify-between underline-offset-2">
        <h4 className="text-md sm:text-lg font-bold">{title}</h4>

        {isOpen ? (
          <div className="flex gap-x-2">
            <div
              onClick={() => showDetailsHandler()}
              className="flex space-x-2 items-center"
            >
              <p className="text-sm sm:text-base">Hide details</p>
              <svg
                className="w-3 sm:w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 448 512"
              >
                <path d="M201.4 105.4c12.5-12.5 32.8-12.5 45.3 0l192 192c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L224 173.3 54.6 342.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l192-192z" />
              </svg>
            </div>
          </div>
        ) : (
          <div className="flex gap-x-2">
            <div
              onClick={() => showDetailsHandler()}
              className="flex space-x-2 items-center"
            >
              <p className="text-sm sm:text-base">Show details</p>
              <svg
                className="w-3 sm:w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 448 512"
              >
                <path d="M201.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 338.7 54.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z" />
              </svg>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4"
          >
            <label>Checksum</label>
            <div className="p-4 border bg-gray-50 mt-2">
              <p className="font-mono text-sm break-words">{checksum}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <a
        href={downloadURL}
        download
        className="flex justify-center sm:justify-start items-center mt-6 h-10 sm:w-fit px-3 bg-blue-700 hover:bg-blue-600 text-sm sm:text-base text-white rounded"
      >
        {`${buttonText}` + `${downloadType}`}
      </a>
    </div>
  );
}

export default DownloadCard;
