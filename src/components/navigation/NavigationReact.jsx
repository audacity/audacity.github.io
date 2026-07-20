import React, { useState } from "react";
import AudacityLogoSVG from "../inlineSVG/AudacityLogoSVG";
import SignUpButton from "./SignUpButton";
import "@fontsource-variable/signika";
import "../../styles/fonts.css";

function NavigationReact(props) {
  const { currentURL, labels = {}, localePrefix = "" } = props;
  const [isHamburgerMenuOpen, setIsHamburgerMenuOpen] = useState(false);

  function getUrlPath(url) {
    const parts = url.split("/");
    return "/" + parts[parts.length - 1];
  }

  const navLinks = [
    {
      href: `${localePrefix}/download`,
      linkText: labels.downloads ?? "Downloads",
      target: "",
    },
    {
      href: `${localePrefix}/features/`,
      linkText: labels.features ?? "Features",
      target: "",
    },
    {
      href: `${localePrefix}/about`,
      linkText: "Audacity 4",
      target: "",
      badge: labels.new ?? "New",
    },
    {
      href: `${localePrefix}/help`,
      linkText: labels.help ?? "Help",
      target: "",
    },
  ];

  function handleHamburgerMenuClick() {
    setIsHamburgerMenuOpen(!isHamburgerMenuOpen);
  }

  function renderNavLink(navLink, index) {
    const isActive = getUrlPath(currentURL) === navLink.href;
    return (
      <a
        href={navLink.href}
        target={navLink.target}
        key={index}
        className={
          "inline-flex items-center gap-2 " +
          (isActive
            ? "font-muse-sans text-16 text-accent"
            : "font-muse-sans text-16 text-text-contrast hover:text-accent transition-colors")
        }
      >
        {navLink.linkText}
        {navLink.badge && (
          <span className="inline-flex items-center justify-center rounded-full bg-accent text-background-dark text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 leading-none">
            {navLink.badge}
          </span>
        )}
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
    <nav className="z-3 bg-background-dark">
      <div className="flex h-14 items-center max-w-screen-2xl mx-auto px-6 md:px-10 gap-8">
        <a
          className="flex w-fit items-center shrink-0"
          href={localePrefix || "/"}
        >
          <AudacityLogoSVG className="h-8 fill-accent" />
        </a>

        <div className="hidden sm:flex items-center gap-8">
          {navLinks.map((navLink, index) => renderNavLink(navLink, index))}
        </div>

        <div className="hidden lg:flex flex-1 justify-end items-center gap-5">
          <a
            href={`${localePrefix}/cloud-saving`}
            className="font-muse-sans text-16 text-text-contrast hover:text-accent transition-colors"
          >
            {labels.tryCloud ?? "Try Audacity Cloud"}
          </a>
          <SignUpButton onClick={handleButtonClick} label={labels.signUp} />
        </div>

        <button
          className="flex w-10 h-10 ml-auto hover:bg-white/10 active:bg-white/20 rounded-sm justify-center items-center sm:hidden text-text-contrast"
          onClick={() => handleHamburgerMenuClick()}
          aria-label="Hamburger menu"
        >
          {isHamburgerMenuOpen ? (
            <svg
              className="fill-current w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 320 512"
            >
              <path d="M310.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L160 210.7 54.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L114.7 256 9.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 301.3 265.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L205.3 256 310.6 150.6z" />
            </svg>
          ) : (
            <svg
              className="fill-current w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 448 512"
            >
              <path d="M0 96C0 78.3 14.3 64 32 64H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32z" />
            </svg>
          )}
        </button>
      </div>

      {isHamburgerMenuOpen && (
        <div className="flex flex-col py-2 bg-background-dark border-y border-white/10 absolute left-0 right-0 z-40 transition-opacity duration-200 ease-in-out opacity-100">
          {navLinks.map((navLink, index) => (
            <a
              key={index}
              onClick={() => handleHamburgerMenuClick()}
              className="flex items-center gap-2 py-3 px-6 font-muse-sans text-16 text-text-contrast hover:text-accent hover:bg-white/5 transition-all duration-200 ease-in-out"
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
              {navLink.badge && (
                <span className="inline-flex items-center justify-center rounded-full bg-accent text-background-dark text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 leading-none">
                  {navLink.badge}
                </span>
              )}
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
