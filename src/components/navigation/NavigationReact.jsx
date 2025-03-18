import React, { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import HamburgerMenu from "./HamburgerMenu";
import AudacityLogo from "../../assets/img/Audacity_Logo.svg";
import "@fontsource-variable/signika";
import "../../styles/fonts.css";

function NavigationReact(props) {
  const { currentURL } = props;
  const [isHamburgerMenuOpen, setIsHamburgerMenuOpen] = useState(false);
  const [abTestVariant, setAbTestVariant] = useState("main");

  useEffect(() => {
    const variant = process.env.NETLIFY_BRANCH || "main";
    setAbTestVariant(variant);

    console.log(process.env.NETLIFY_BRANCH);
    console.log(`Current AB test variant: ${variant}`);
  }, []);

  console.log(abTestVariant);

  function getUrlPath(url) {
    const parts = url.split("/");
    return "/" + parts[parts.length - 1];
  }

  const navLinks = [
    { href: "/download", linkText: "Downloads", target: "" },
    { href: "/FAQ", linkText: "FAQ", target: "" },
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
    return (
      <a
        href={navLink.href}
        target={navLink.target}
        key={index}
        className={
          getUrlPath(currentURL) === navLink.href
            ? "font-regular text-blue-700"
            : "font-regular text-gray-800 hover:text-blue-700"
        }
      >
        {navLink.linkText}
      </a>
    );
  }

  function handleButtonClick() {
    if (typeof _paq !== "undefined") {
      _paq.push([
        "trackEvent",
        "CTA Button",
        "audio.com CTA",
        "audio.com navbar CTA",
      ]);
    }
  }

  return (
    <nav className="border-b-2 z-3 filter bg-white bg-opacity-90 backdrop-blur-xl ">
      <div className="flex h-14 items-center max-w-screen-2xl mx-auto px-4 md:px-6">
        <div className="flex-1">
          <a className="flex w-fit items-center gap-1 lg:gap-2" href="/">
            <img
              className="w-5 lg:w-6 h-full"
              src={AudacityLogo.src}
              alt="A yellow and orange waveform between the ears of a set of blue headphones"
            />
            <p className="signika text-blue-700 lg:text-lg font-medium lg:leading-none">
              Audacity
            </p>
          </a>
        </div>

        <div className="lg:flex-1 justify-center hidden gap-4 sm:flex">
          {navLinks.map((navLink, index) => {
            return renderNavLink(navLink, index);
          })}
        </div>

        <div className="hidden lg:flex flex-1 justify-end items-center gap-3">
          <p className="text-base hover:text-blue-700">
            <a href="/cloud-saving">Audacity Cloud saving</a>
          </p>
          <a
            href="https://audio.com/audacity/auth/sign-in?mtm_campaign=audacityteamorg&mtm_content=Nav_button"
            target="_blank"
          >
            <button
              onClick={() => {
                handleButtonClick();
              }}
              className="border-2 border-blue-700 rounded-md py-0.5 px-2 text-blue-700 font-semibold hover:bg-blue-700 hover:text-white"
            >
              Sign up
            </button>
          </a>
        </div>

        <button
          className="flex w-10 h-10 hover:bg-gray-100 active:bg-gray-200 rounded-sm justify-center items-center sm:hidden"
          onClick={() => handleHamburgerMenuClick()}
          aria-label="Hamburger menu"
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
