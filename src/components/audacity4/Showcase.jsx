import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

function Showcase({ imageSrc, imageAlt }) {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Image starts contained, scales to fill viewport
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.7, 1]);
  const borderRadius = useTransform(scrollYProgress, [0, 0.5], [16, 0]);

  return (
    <section ref={sectionRef} className="h-screen sticky top-0 flex items-center justify-center overflow-hidden">
      <motion.img
        src={imageSrc}
        alt={imageAlt}
        className="w-full h-full object-contain shadow-[0_40px_80px_rgba(0,0,0,0.18)]"
        style={{ scale, borderRadius }}
      />
    </section>
  );
}

export default Showcase;
