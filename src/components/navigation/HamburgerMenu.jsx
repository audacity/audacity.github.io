import React from "react";
import {motion} from 'framer-motion';

function HamburgerMenu(props) {
  const { navLinks, onLinkClick } = props;
  return <motion.div className="flex flex-col py-2 bg-gray-50 border-y-2 absolute left-0 right-0 z-40">{navLinks.map((navLink) => {
    return <motion.a initial={{opacity: 0}} animate={{opacity: 1}} onClick={() => onLinkClick()} className="py-3 px-4 text-gray-800 hover:text-blue-700 hover:bg-gray-100" href={navLink.href} target={navLink.target}>{navLink.linkText}</motion.a>
  })}</motion.div>;
}

export default HamburgerMenu;
