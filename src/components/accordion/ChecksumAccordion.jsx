import { useState } from "react";

function ChecksumAccordion(props) {
  const { title, downloadUrl, checksum } = props;

  const [isOpen, setIsOpen] = useState(false);

  function toggleAccordion() {
    setIsOpen((prevIsOpen) => !prevIsOpen);
  }

  return (
    <div
      className="flex flex-col rounded-lg border border-text-primary/15 p-2"
      onClick={toggleAccordion}
    >
      <div className="flex align-middle">
        {isOpen ? (
          <span className="align-middle icon icon-caret-down text-accent"></span>
        ) : (
          <span className="align-middle icon icon-caret-right text-accent"></span>
        )}
        <p className="font-bold">{title}</p>
      </div>

      {isOpen && (
        <div className="flex flex-col gap-2 mt-2">
          <div className="flex flex-col">
            <label>Checksum:</label>
            <div className="rounded border border-text-primary/10 bg-background-light p-2">
              <small className="block break-all font-mono text-12 leading-snug text-text-primary/70">
                {checksum}
              </small>
            </div>
          </div>
          <a
            href={downloadUrl}
            className="flex justify-center rounded-full bg-accent px-3 py-2 text-14 font-semibold text-white transition-opacity hover:opacity-90"
          >
            Download {title}
          </a>
        </div>
      )}
    </div>
  );
}

export default ChecksumAccordion;
