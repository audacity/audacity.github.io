import React, { useRef, useEffect, useState } from "react";
import { motion, useScroll, useInView, AnimatePresence } from "framer-motion";

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function easeInCubic(t) {
  return t * t * t;
}

function getColors(t) {
  // Ease-in: stay light for longer, then darken more aggressively toward the end
  const e = easeInCubic(t);
  return {
    bg: `rgb(${lerp(248, 15, e)},${lerp(250, 23, e)},${lerp(252, 42, e)})`,
    heading: `rgb(${lerp(15, 248, e)},${lerp(23, 250, e)},${lerp(42, 252, e)})`,
    body: `rgb(${lerp(71, 203, e)},${lerp(85, 213, e)},${lerp(105, 225, e)})`,
    dotInactive: `rgb(${lerp(203, 71, e)},${lerp(213, 85, e)},${lerp(225, 105, e)})`,
  };
}

function FeatureScene({ title, descriptions, imageSrc, imageAlt, mirrored = false, sceneIndex = 0, totalScenes = 1 }) {
  const sectionRef = useRef(null);
  const imageRef = useRef(null);
  const imageInView = useInView(imageRef, { once: true, margin: "-50px" });
  const [activeIndex, setActiveIndex] = useState(0);
  const [colors, setColors] = useState(() => getColors(totalScenes <= 1 ? 0 : sceneIndex / (totalScenes - 1)));

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (v) => {
      const stepCount = descriptions.length;
      const index = Math.min(Math.floor(v * stepCount), stepCount - 1);
      setActiveIndex(index);

      // Color transitions happen in the padding zones between sections.
      // The section layout is: [50vh top pad] [content] [50vh bottom pad]
      // Total height = (descriptions.length * 100 + 50)vh
      // Top pad ends at ~50/(total) of scroll, bottom pad starts at ~(total-50)/total
      const totalVh = descriptions.length * 100 + 50;
      const topPadEnd = 50 / totalVh;
      const bottomPadStart = (totalVh - 50) / totalVh;

      const thisSceneT = totalScenes <= 1 ? 0 : sceneIndex / (totalScenes - 1);
      const nextSceneT = totalScenes <= 1 ? 0 : Math.min((sceneIndex + 1) / (totalScenes - 1), 1);

      let colorT;
      if (v <= topPadEnd) {
        // In top padding: transition from previous scene's color to this scene's color
        const prevSceneT = totalScenes <= 1 ? 0 : Math.max((sceneIndex - 1) / (totalScenes - 1), 0);
        const padProgress = v / topPadEnd;
        colorT = prevSceneT + (thisSceneT - prevSceneT) * padProgress;
      } else if (v >= bottomPadStart) {
        // In bottom padding: transition from this scene's color to next scene's color
        const padProgress = (v - bottomPadStart) / (1 - bottomPadStart);
        colorT = thisSceneT + (nextSceneT - thisSceneT) * padProgress;
      } else {
        // In content area: hold this scene's color
        colorT = thisSceneT;
      }

      setColors(getColors(Math.min(Math.max(colorT, 0), 1)));
    });
    return unsubscribe;
  }, [scrollYProgress, descriptions.length, sceneIndex, totalScenes]);

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
                    className="w-2 h-2 rounded-full"
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
    <section ref={sectionRef} style={{ backgroundColor: colors.bg }}>
      <div className={`max-w-screen-lg mx-6 sm:mx-16 xl:mx-auto py-12 md:py-[50vh] flex flex-col md:flex-row ${mirrored ? "md:flex-row-reverse" : ""} gap-8 md:gap-12`} style={{ minHeight: sectionHeight }}>
        {imageColumn}
        {textColumn}
      </div>
    </section>
  );
}

export default FeatureScene;
