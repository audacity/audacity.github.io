import React, { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";

function FeatureScene({ title, descriptions, imageSrc, imageAlt, mirrored = false, bgColor = "#ffffff" }) {
  const sectionRef = useRef(null);
  const imageRef = useRef(null);
  const imageInView = useInView(imageRef, { once: true, margin: "-50px" });
  const [activeIndex, setActiveIndex] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (v) => {
      const stepCount = descriptions.length;
      const index = Math.min(Math.floor(v * stepCount), stepCount - 1);
      if (v >= 0.98) {
        setActiveIndex(stepCount - 1);
        setStepProgress(1);
      } else {
        setActiveIndex(index);
        setStepProgress(Math.min((v * stepCount) - index, 1));
      }
    });
    return unsubscribe;
  }, [scrollYProgress, descriptions.length]);

  const sectionInView = useInView(sectionRef, { margin: "-40% 0px -40% 0px" });

  useEffect(() => {
    if (sectionInView) {
      document.body.style.backgroundColor = bgColor;
    }
  }, [sectionInView, bgColor]);

  const sectionHeight = `${descriptions.length * 100}vh`;

  const imageColumn = (
    <div className="hidden md:block md:w-[55%]">
      <div className="sticky top-0 h-screen flex items-center">
        <img
          src={imageSrc}
          alt={imageAlt}
          className="w-full rounded-xl shadow-[0_25px_50px_rgba(0,0,0,0.12)] border border-gray-100"
          loading="lazy"
        />
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
      <div className="hidden md:flex sticky top-0 h-screen items-center gap-8">
        <div className="relative flex-1">
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
            </motion.div>
          </AnimatePresence>
        </div>
        {/* Progress indicator */}
        <div className="flex flex-col items-center gap-3">
          <span className="text-xs font-medium text-slate-400">{activeIndex + 1}/{descriptions.length}</span>
          <div className="w-1 rounded-full bg-slate-200/50 overflow-hidden" style={{ height: "120px" }}>
            <div
              className="w-full rounded-full bg-blue-700/40"
              style={{
                height: `${stepProgress * 100}%`,
                transition: "none",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <section ref={sectionRef} className="relative">
      <div className={`max-w-screen-lg mx-6 sm:mx-16 xl:mx-auto py-12 md:py-0 flex flex-col md:flex-row ${mirrored ? "md:flex-row-reverse" : ""} gap-8 md:gap-12`} style={{ minHeight: sectionHeight }}>
        {imageColumn}
        {textColumn}
      </div>
    </section>
  );
}

export default FeatureScene;
