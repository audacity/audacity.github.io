import React, { useRef, useEffect, useState } from "react";
import { motion, useScroll, useInView, AnimatePresence } from "framer-motion";

function FeatureScene({ title, descriptions, imageSrc, imageAlt, mirrored = false }) {
  const sectionRef = useRef(null);
  const imageRef = useRef(null);
  const imageInView = useInView(imageRef, { once: true, margin: "-50px" });
  const [activeIndex, setActiveIndex] = useState(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (v) => {
      const stepCount = descriptions.length;
      const index = Math.min(Math.floor(v * stepCount), stepCount - 1);
      setActiveIndex(index);
    });
    return unsubscribe;
  }, [scrollYProgress, descriptions.length]);

  const sectionHeight = `${descriptions.length * 100 + 50}vh`;

  const imageColumn = (
    <div className="hidden md:block md:w-[55%]">
      <div className="sticky top-[50vh] -translate-y-1/2 w-full">
        <motion.div
          ref={imageRef}
          initial={{ opacity: 0, y: 20 }}
          animate={imageInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <img
            src={imageSrc}
            alt={imageAlt}
            className="w-full rounded-xl shadow-[0_25px_50px_rgba(0,0,0,0.12)] border border-gray-100"
            loading="lazy"
          />
        </motion.div>
      </div>
    </div>
  );

  const textColumn = (
    <div className="w-full md:w-[40%]">
      {/* Mobile: stacked layout, no sticky */}
      <div className="md:hidden flex flex-col gap-8 py-8">
        <img
          src={imageSrc}
          alt={imageAlt}
          className="w-full rounded-xl shadow-[0_25px_50px_rgba(0,0,0,0.12)] border border-gray-100"
          loading="lazy"
        />
        <h2 className="text-slate-900">{title}</h2>
        {descriptions.map((desc, index) => (
          <p key={index} className="text-lg text-slate-600 leading-relaxed">{desc}</p>
        ))}
      </div>

      {/* Desktop: sticky text that crossfades */}
      <div className="hidden md:block sticky top-[50vh] -translate-y-1/2">
        <div className="relative w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <h2 className="text-slate-900 mb-4">{title}</h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                {descriptions[activeIndex]}
              </p>
              {/* Progress dots */}
              <div className="flex gap-2 mt-8">
                {descriptions.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                      index === activeIndex ? "bg-blue-700" : "bg-slate-300"
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );

  return (
    <section ref={sectionRef} className="bg-white">
      <div className={`max-w-screen-lg mx-6 sm:mx-16 xl:mx-auto py-12 md:py-[50vh] flex flex-col md:flex-row ${mirrored ? "md:flex-row-reverse" : ""} gap-8 md:gap-12`} style={{ minHeight: sectionHeight }}>
        {imageColumn}
        {textColumn}
      </div>
    </section>
  );
}

export default FeatureScene;
