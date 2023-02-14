import React, { useState } from "react";

function NavigationReact() {
  const [isOpen, setIsOpen] = useState(false);

  function navButtonHandler() {
    setIsOpen(!isOpen);
  }

  return (
    <nav className="relative bg-white border-y-2">
      <div className="flex justify-between mx-w-sm mx-auto py-3 px-4">
        <a href="/">
          <span className="text-blue-700 text-base font-bold">Audacity</span>
        </a>
        <ul className="hidden sm:flex gap-4">
          <li>
            <a
              href="/downloads"
              className="hover:text-blue-500 text-gray-700 text-sm hover:underline"
            >
              Downloads
            </a>
          </li>
          <li>
            <a
              href="/blog"
              className="hover:text-blue-500 text-gray-700 text-sm hover:underline"
            >
              Blog
            </a>
          </li>
          <li>
            <a
              href="https://support.audacityteam.org"
              target="_blank"
              className="hover:text-blue-500 text-gray-700 text-sm hover:underline"
            >
              Help
            </a>
          </li>
          <li>
            <a
              href="https://forum.audacityteam.org/"
              target="_blank"
              className="hover:text-blue-500 text-gray-700 text-sm hover:underline"
            >
              Forum
            </a>
          </li>
        </ul>
        <button className="sm:hidden" onClick={() => navButtonHandler()}>
          Menu
        </button>
      </div>
      {isOpen && (
        <div className="px-4 py-4 w-full bg-gray-100 absolute top-12 z-20 border-t-2">
          <div className="flex flex-col gap-y-2">
            <a className="py-2 hover:bg-gray-200" href="/downloads">
              Downloads
            </a>
            <a className="py-2 hover:bg-gray-200" href="/blog">
              Blog
            </a>
            <a
              className="py-2 hover:bg-gray-200"
              href="https://support.audacityteam.org"
              target="_blank"
            >
              Help
            </a>
            <a
              className="py-2 hover:bg-gray-200"
              href="https://forum.audacityteam.org"
              target="_blank"
            >
              Forum
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}

export default NavigationReact;
