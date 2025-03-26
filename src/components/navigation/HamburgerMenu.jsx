import React from "react";

function HamburgerMenu(props) {
  const { navLinks, onLinkClick } = props;
  return (
    <div className="flex flex-col py-2 bg-gray-50 border-y-2 absolute left-0 right-0 z-40">
      {navLinks.map((navLink, index) => {
        return (
          <a 
            key={index} 
            onClick={() => onLinkClick()} 
            className="py-3 px-4 text-gray-800 hover:text-blue-700 hover:bg-gray-100"
            href={navLink.href} 
            target={navLink.target}
          >
            {navLink.linkText}
          </a>
        );
      })}
    </div>
  );
}

export default HamburgerMenu;