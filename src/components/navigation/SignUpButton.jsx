import React from "react";

function SignUpButton({ onClick }) {
  return (
    <a
      href="https://audio.com/audacity/auth/sign-in?mtm_campaign=audacityteamorg&mtm_content=Nav_button"
      target="_blank"
      rel="noopener noreferrer"
    >
      <button
        onClick={onClick}
        className="bg-accent text-white rounded-full py-2 px-4 font-semibold hover:opacity-90 transition-opacity"
      >
        Sign up
      </button>
    </a>
  );
}

export default SignUpButton;
