import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const fadeUp = (delay) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] },
});

function Hero({ imageSrc }) {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Text fades up and away
  const textOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);
  const textY = useTransform(scrollYProgress, [0, 0.4], [0, -80]);

  // Image moves from bottom to vertical centre, scales up slightly
  const imageY = useTransform(scrollYProgress, [0, 0.6], ["0%", "-50%"]);
  const imageTop = useTransform(scrollYProgress, [0, 0.6], ["50%", "50%"]);
  const imageScale = useTransform(scrollYProgress, [0, 0.6], [1, 1.1]);
  const imageOpacity = useTransform(scrollYProgress, [0.6, 0.9], [1, 0]);

  return (
    <section ref={sectionRef} className="overflow-hidden" style={{ height: "110vh" }}>
      <div
        className="sticky top-14 flex flex-col items-center px-6"
        style={{ height: "calc(100vh - 3.5rem)" }}
      >
        {/* Text — sits at top, fades up and away on scroll */}
        <motion.div
          className="flex flex-col gap-6 max-w-3xl text-center pt-12 z-0"
          style={{ opacity: textOpacity, y: textY }}
        >
          <motion.h1
            className="text-4xl md:text-6xl font-bold text-slate-900 tracking-tight leading-tight"
            {...fadeUp(0.1)}
          >
            Meet Audacity 4
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-slate-500 leading-relaxed font-light"
            {...fadeUp(0.3)}
          >
            A redesigned interface, powerful new editing tools, and workflows built for modern audio production.
          </motion.p>
          <motion.div className="flex justify-center mt-2" {...fadeUp(0.5)}>
            <a
              href="/download"
              className="px-8 py-3.5 bg-blue-700 text-white rounded-full font-medium text-lg hover:bg-blue-600 transition-colors"
            >
              Download Audacity 4
            </a>
          </motion.div>
        </motion.div>

        {/* Image — peeks from bottom on load, moves up to centre on scroll */}
        <motion.div
          className="absolute left-0 right-0 z-10 flex justify-center px-6"
          style={{ top: imageTop, y: imageY, scale: imageScale, opacity: imageOpacity }}
          initial={{ opacity: 0, scale: 3, y: "150%" }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <img
            src={imageSrc}
            alt="The new Audacity 4 interface showing a redesigned toolbar, track panel, and waveform editor"
            className="w-full max-w-5xl rounded-2xl shadow-xl border border-gray-200/50"
            loading="eager"
          />
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;
