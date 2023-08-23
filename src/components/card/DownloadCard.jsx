import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

function DownloadCard(props) {
  const { title, checksum, buttonText, downloadURL, downloadType } = props;
  const [isOpen, setIsOpen] = useState(false);

  function showDetailsHandler() {
    setIsOpen(!isOpen);
  }

  return (
    <div className="border border-bg-200 rounded-sm p-6">
      <div className="flex flex-col gap-4 md:flex-row md:justify-between items-center">
        <h4 className="text-xl font-semibold">{title}</h4>
        <div class="flex w-full md:w-fit flex-col-reverse text sm:flex-row gap-2">
          <a
            onClick={() => showDetailsHandler()}
            className="text-blue-700 text-base underline h-12 px-4 w-full whitespace-nowrap flex items-center justify-center"
          >
            {isOpen ?  "Hide checksum" : "Show checksum" }
          </a>
          <a
            href={downloadURL}
            className="flex justify-center text-center items-center px-4 h-12 w-full bg-slate-200 hover:bg-slate-300 text-base text-black rounded"
          >
            {`${buttonText}` + `${downloadType}`}
          </a>
        </div>
      </div>

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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default DownloadCard;
