import React from "react";

function AudacityInstallerButton(props) {
  const { museHubReleaseData } = props;
  function onClickButtonHandler() {
    setTimeout(() => {
        window.location.href = "/post-download";
      }, 2000);
  }
  
  return (
    <a
      onClick={onClickButtonHandler}
      href={museHubReleaseData[0].browser_download_url}
      className="flex justify-center text-center items-center px-4 h-12 w-full sm:w-fit bg-blue-700 hover:bg-blue-600 text-base text-white rounded"
    >
      Download
    </a>
  );
}

export default AudacityInstallerButton;
