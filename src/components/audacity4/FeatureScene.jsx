import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";

function ScrollTextBlock({ children }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-[50vh] flex items-center"
    >
      <div>{children}</div>
    </motion.div>
  );
}

function FeatureScene({ title, descriptions, imageSrc, imageAlt, mirrored = false, bgTint = false }) {
  const imageRef = useRef(null);
  const imageInView = useInView(imageRef, { once: true, margin: "-50px" });

  const bgClass = bgTint ? "bg-slate-50" : "bg-white";

  const imageColumn = (
    <div className="hidden md:flex md:w-[55%] items-start">
      <div className="sticky top-24 w-full py-8">
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
    <div className="w-full md:w-[40%] flex flex-col gap-0">
      {descriptions.map((desc, index) => (
        <ScrollTextBlock key={index}>
          {index === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="md:hidden mb-8"
            >
              <img
                src={imageSrc}
                alt={imageAlt}
                className="w-full rounded-xl shadow-[0_25px_50px_rgba(0,0,0,0.12)] border border-gray-100"
                loading="lazy"
              />
            </motion.div>
          )}
          {index === 0 && (
            <h2 className="text-slate-900 mb-4">{title}</h2>
          )}
          <p className="text-lg text-slate-600 leading-relaxed">{desc}</p>
        </ScrollTextBlock>
      ))}
    </div>
  );

  return (
    <section className={bgClass}>
      <div className={`max-w-screen-lg mx-6 sm:mx-16 xl:mx-auto py-12 md:py-0 flex flex-col md:flex-row ${mirrored ? "md:flex-row-reverse" : ""} gap-8 md:gap-12`}>
        {imageColumn}
        {textColumn}
      </div>
    </section>
  );
}

export default FeatureScene;
