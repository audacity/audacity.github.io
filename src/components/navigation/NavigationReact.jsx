import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import HamburgerMenu from "./HamburgerMenu";

function NavigationReact() {
  const [isHamburgerMenuOpen, setIsHamburgerMenuOpen] = useState(false);

  const navLinks = [
    { href: "/downloads", linkText: "Downloads", target: "" },
    { href: "/blog", linkText: "Blog", target: "" },
    {
      href: "https://support.audacityteam.org",
      linkText: "Help",
      target: "_blank",
    },
    {
      href: "https://forum.audacityteam.org/",
      linkText: "Forum",
      target: "_blank",
    },
  ];

  function handleHamburgerMenuClick() {
    setIsHamburgerMenuOpen(!isHamburgerMenuOpen);
  }

  function renderNavLink(navLink, index) {
    const currentURL = "/" + window.location.href.split('/').pop();
    const navLinkURL = navLink.href;

    console.log(currentURL, navLinkURL);

    return (
      <a href={navLink.href} target={navLink.target} key={index} className={navLinkURL === currentURL ? 'underline underline-offset-4 text-gray-800' : 'font-regular text-gray-800 hover:text-blue-700'}>
        {navLink.linkText}
      </a>
    );
  }

  return (
    <nav className="fixed left-0 right-0 top-0 border-b-2 z-50 filter bg-white bg-opacity-90 backdrop-blur-xl">
      <div className="flex justify-between max-w-6xl mx-auto h-12 px-3 xl:px-0 items-center">
        <a href="/">
          <span className="text-blue-700 text-lg font-semibold">Audacity</span>
        </a>
        <div className="hidden gap-3 sm:flex">
          {navLinks.map((navLink, index) => {
            return renderNavLink(navLink, index);
          })}
        </div>

        <button
          className="flex w-10 h-10 hover:bg-gray-100 active:bg-gray-200 rounded-sm justify-center items-center sm:hidden"
          onClick={() => handleHamburgerMenuClick()}
        >
          {isHamburgerMenuOpen ? (
            <svg
              className="fill-gray-700 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 320 512"
            >
              <path d="M310.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L160 210.7 54.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L114.7 256 9.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 301.3 265.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L205.3 256 310.6 150.6z" />
            </svg>
          ) : (
            <svg
              className="fill-gray-700 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 448 512"
            >
              <path d="M0 96C0 78.3 14.3 64 32 64H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32z" />
            </svg>
          )}
        </button>
      </div>
      <AnimatePresence>
        {isHamburgerMenuOpen && (
          <HamburgerMenu
            navLinks={navLinks}
            onLinkClick={handleHamburgerMenuClick}
          />
        )}
      </AnimatePresence>
    </nav>
  );
}

export default NavigationReact;
