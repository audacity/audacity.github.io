import React, { useRef, useEffect, useState } from "react";
import { motion, useScroll, useInView, AnimatePresence } from "framer-motion";

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function getSceneColors(sceneIndex, totalScenes) {
  const t = totalScenes <= 1 ? 0 : sceneIndex / (totalScenes - 1);

  // Background: white (248,250,252) -> dark navy (15,23,42)
  const bgR = lerp(248, 15, t);
  const bgG = lerp(250, 23, t);
  const bgB = lerp(252, 42, t);

  // Heading: slate-900 (15,23,42) -> white (248,250,252)
  const hR = lerp(15, 248, t);
  const hG = lerp(23, 250, t);
  const hB = lerp(42, 252, t);

  // Body text: slate-600 (71,85,105) -> slate-300 (203,213,225)
  const bR = lerp(71, 203, t);
  const bG = lerp(85, 213, t);
  const bB = lerp(105, 225, t);

  // Dots inactive: slate-300 (203,213,225) -> slate-600 (71,85,105)
  const dR = lerp(203, 71, t);
  const dG = lerp(213, 85, t);
  const dB = lerp(225, 105, t);

  return {
    bg: `rgb(${bgR},${bgG},${bgB})`,
    heading: `rgb(${hR},${hG},${hB})`,
    body: `rgb(${bR},${bG},${bB})`,
    dotInactive: `rgb(${dR},${dG},${dB})`,
  };
}

function FeatureScene({ title, descriptions, imageSrc, imageAlt, mirrored = false, sceneIndex = 0, totalScenes = 1 }) {
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

  const colors = getSceneColors(sceneIndex, totalScenes);
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
        <h2 style={{ color: colors.heading }}>{title}</h2>
        {descriptions.map((desc, index) => (
          <p key={index} className="text-lg leading-relaxed" style={{ color: colors.body }}>{desc}</p>
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
              <h2 className="mb-4" style={{ color: colors.heading }}>{title}</h2>
              <p className="text-lg leading-relaxed" style={{ color: colors.body }}>
                {descriptions[activeIndex]}
              </p>
              {/* Progress dots */}
              <div className="flex gap-2 mt-8">
                {descriptions.map((_, index) => (
                  <div
                    key={index}
                    className="w-2 h-2 rounded-full transition-colors duration-300"
                    style={{
                      backgroundColor: index === activeIndex ? "#1d4ed8" : colors.dotInactive,
                    }}
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
    <section ref={sectionRef} style={{ backgroundColor: colors.bg, transition: "background-color 0.3s ease" }}>
      <div className={`max-w-screen-lg mx-6 sm:mx-16 xl:mx-auto py-12 md:py-[50vh] flex flex-col md:flex-row ${mirrored ? "md:flex-row-reverse" : ""} gap-8 md:gap-12`} style={{ minHeight: sectionHeight }}>
        {imageColumn}
        {textColumn}
      </div>
    </section>
  );
}

export default FeatureScene;
