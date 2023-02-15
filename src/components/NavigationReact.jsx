import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

function NavigationReact() {
  const [isOpen, setIsOpen] = useState(false);

  function navButtonHandler() {
    setIsOpen(!isOpen);
  }

  return (
    <nav className="relative bg-white border-b-2 z-50">
      <div className="flex justify-between mx-w-sm mx-auto py-3 px-4">
        <a href="/">
          <span className="text-blue-700 text-base font-bold">Audacity</span>
        </a>
        <ul
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="hidden sm:flex gap-4"
        >
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
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{
              height: "auto",
              transition: { height: { duration: 0.5 } },
            }}
            exit={{
              height: 0,
              transition: {
                height: { duration: 0.5 },
              },
            }}
            className="px-4 py-4 w-full bg-gray-100 absolute top-12 z-20 border-y-2"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { opacity: { delay: 0.5 } } }}
              exit={{ opacity: 0, transition: { opacity: { duration: 0.1 } } }}
              className="flex flex-col gap-y-2"
            >
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default NavigationReact;
