import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

function HorizontalScroll({ cards }) {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const x = useTransform(scrollYProgress, [0, 1], ["0%", `-${(cards.length - 1) * 100}%`]);

  return (
    <section ref={sectionRef} style={{ height: `${cards.length * 100}vh` }}>
      <div className="sticky top-0 h-screen overflow-hidden flex items-center">
        <motion.div className="flex" style={{ x, width: `${cards.length * 100}vw` }}>
          {cards.map((card, index) => (
            <div
              key={index}
              className="w-screen h-screen flex-shrink-0 flex items-center justify-center px-8"
            >
              <div className="max-w-screen-md text-center">
                <h2 className="text-slate-900 mb-4">{card.title}</h2>
                <p className="text-lg text-slate-600 leading-relaxed">{card.description}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default HorizontalScroll;
