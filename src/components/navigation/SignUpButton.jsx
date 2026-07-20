import React from "react";

function SignUpButton({ onClick, label }) {
  return (
    <a
      href="https://audio.com/audacity/auth/sign-in?mtm_campaign=audacityteamorg&mtm_content=Nav_button"
      target="_blank"
      rel="noopener noreferrer"
    >
      <button
        onClick={onClick}
        className="inline-flex items-center justify-center h-9 px-5 font-muse-sans text-16 font-semibold text-text-contrast border border-text-contrast rounded-full hover:bg-text-contrast hover:text-background-dark transition-colors"
      >
        {label ?? "Sign Up"}
      </button>
    </a>
  );
}

export default SignUpButton;
