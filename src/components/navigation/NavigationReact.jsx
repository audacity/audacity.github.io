import React, { useState } from "react";
import AudacityIconSVG from "../inlineSVG/AudacityIconSVG";
import AudacityWordmarkSVG from "../inlineSVG/AudacityWordmarkSVG";
import SignUpButton from "./SignUpButton";
import "@fontsource-variable/signika";
import "../../styles/fonts.css";

function NavigationReact(props) {
  const { currentURL } = props;
  const [isHamburgerMenuOpen, setIsHamburgerMenuOpen] = useState(false);

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
    {
      href: "https://merch.audacityteam.org/",
      linkText: "Merch",
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
            ? "font-muse-sans text-16 text-accent"
            : "font-muse-sans text-16 text-text-primary hover:text-accent"
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
    <nav className="border-b-2 z-3 filter bg-white bg-opacity-90 backdrop-blur-xl">
      <div className="flex h-14 items-center max-w-screen-2xl mx-auto px-4 md:px-6">
        <div className="flex-1">
          <a className="flex w-fit items-center gap-2" href="/">
            <AudacityIconSVG className="h-5 fill-text-primary" />
            <AudacityWordmarkSVG className="h-5 fill-text-primary" />
            <span className="font-muse-sans text-14 text-black opacity-80">by muse group</span>
          </a>
        </div>

        <div className="lg:flex-1 justify-center hidden gap-4 sm:flex">
          {navLinks.map((navLink, index) => {
            return renderNavLink(navLink, index);
          })}
        </div>

        <div className="hidden lg:flex flex-1 justify-end items-center gap-3">
          <a href="/cloud-saving" className="font-muse-sans text-16 text-text-primary hover:text-accent">
            Audacity Cloud saving
          </a>
          <SignUpButton onClick={handleButtonClick} />
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

      {isHamburgerMenuOpen && (
        <div className="flex flex-col py-2 bg-gray-50 border-y-2 absolute left-0 right-0 z-40 transition-opacity duration-200 ease-in-out opacity-100">
          {navLinks.map((navLink, index) => (
            <a
              key={index}
              onClick={() => handleHamburgerMenuClick()}
              className="py-3 px-4 text-text-primary hover:text-accent hover:bg-gray-100 transition-all duration-200 ease-in-out"
              style={{
                animationName: "fadeIn",
                animationDuration: "200ms",
                animationTimingFunction: "ease-in-out",
                animationFillMode: "forwards",
                animationDelay: `${index * 50}ms`,
                opacity: 0,
                transform: "translateX(-10px)",
              }}
              href={navLink.href}
              target={navLink.target}
            >
              {navLink.linkText}
            </a>
          ))}

          <style jsx>{`
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: translateX(-10px);
              }
              to {
                opacity: 1;
                transform: translateX(0);
              }
            }
          `}</style>
        </div>
      )}
    </nav>
  );
}

export default NavigationReact;
