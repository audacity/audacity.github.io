import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

function DownloadCard(props) {
  const { title, checksum, buttonText, downloadURL, downloadType } = props;
  const [isOpen, setIsOpen] = useState(false);

  function showDetailsHandler() {
    setIsOpen(!isOpen);
  }

  return (
    <div class="flex flex-col gap-2 py-12 border-b">
      <div className="flex justify-between">
        <h4 className="text-xl font-semibold">{title}</h4>
        <a
          href={downloadURL}
          className="flex justify-center sm:justify-start items-center h-12 sm:w-fit px-8 bg-slate-200 hover:bg-slate-300 text-lg text-black rounded"
        >
          {`${buttonText}` + `${downloadType}`}
        </a>
      </div>

      {isOpen ? (
        <></>
      ) : (
        <div>
          <a
            onClick={() => showDetailsHandler()}
            className="text-blue-700 text-lg underline"
          >
            Show checksum
          </a>
        </div>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col gap-4 mt-4"
          >
            <div>
              <label className="text-sm uppercase text-gray-600">
                Checksum
              </label>
              <div className="p-4 border bg-gray-50">
                <p className="font-mono text-sm break-words">{checksum}</p>
              </div>
            </div>

            <a
              onClick={() => showDetailsHandler()}
              className="text-blue-700 text-lg underline"
            >
              Hide checksum
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default DownloadCard;
