import React from "react";

function FeatureScene({ title, description, imageSrc, imageAlt, mirrored = false, bgClass = "bg-white", textClass = "text-slate-900", bodyClass = "text-slate-600" }) {
  const imageColumn = (
    <div className="w-full md:w-1/2 flex items-center justify-center px-4">
      <img
        src={imageSrc}
        alt={imageAlt}
        className="w-full max-w-lg rounded-xl shadow-[0_25px_50px_rgba(0,0,0,0.12)] border border-gray-100"
      />
    </div>
  );

  const textColumn = (
    <div className="w-full md:w-1/2 flex items-center px-4 md:px-8">
      <div>
        <h2 className={`${textClass} mb-4`}>{title}</h2>
        <p className={`text-lg leading-relaxed ${bodyClass}`}>{description}</p>
      </div>
    </div>
  );

  return (
    <section className={`h-screen snap-start snap-always ${bgClass}`}>
      <div className={`h-full max-w-screen-lg mx-auto px-6 sm:px-16 flex flex-col md:flex-row ${mirrored ? "md:flex-row-reverse" : ""} items-center gap-8 md:gap-12`}>
        {imageColumn}
        {textColumn}
      </div>
    </section>
  );
}

export default FeatureScene;
