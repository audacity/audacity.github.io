import React, { useEffect, useRef } from "react";
import gsap from "gsap";

function Hero({ imageSrc = "" }) {
  const sectionRef = useRef(null);
  const mediaRef = useRef(null);
  const titleRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(sectionRef.current, { perspective: 1600 });

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // Compute the y-offset that centers the media in the *visible* viewport
      // (below the fixed site header), since the rest-state flex layout puts
      // the media in the upper portion of the section.
      const header = document.getElementById("site-header");
      const navHeight = header ? header.offsetHeight : 0;
      const visibleCenter = navHeight + (window.innerHeight - navHeight) / 2;
      const mediaRect = mediaRef.current.getBoundingClientRect();
      const centerOffset =
        visibleCenter - (mediaRect.top + mediaRect.height / 2);

      // Hide text until the video's final 1.5s — handled via timeupdate below.
      gsap.set(titleRef.current, { opacity: 0, y: 30 });
      gsap.set(buttonRef.current, { opacity: 0, scale: 0.8, y: 22 });

      // Settle the video at its full size, centered in the visible viewport.
      // It stays here as the focal point until the text entrance is triggered
      // (in the video's final 1.5s), at which point it moves up to its flex
      // rest position to make room for the title + button.
      tl.fromTo(
        mediaRef.current,
        {
          opacity: 0,
          scale: 1.15,
          y: centerOffset,
          rotationX: 16,
          filter: "blur(14px)",
          transformOrigin: "center center",
        },
        {
          opacity: 1,
          scale: 1.0,
          rotationX: 0,
          filter: "blur(0px)",
          duration: 1.4,
          ease: "expo.out",
        },
      );

      // Body bg is owned by FlowChapter (starts at #000000, scrubs to chapter
      // colors). Hero just sits on top of that black base.
      gsap.set("body", { backgroundColor: "#000000" });
    }, sectionRef);

    // Video starts moving up 0.4s before the text fades in, so it has time to
    // settle into its flex slot before the title lands beneath it.
    const video = mediaRef.current;
    let movedUp = false;
    let textFired = false;
    const TEXT_TAIL = 1.0;
    const MOVE_TAIL = TEXT_TAIL + 0.4;
    const onTimeUpdate = () => {
      if (!video || !isFinite(video.duration)) return;
      const remaining = video.duration - video.currentTime;
      if (!movedUp && remaining <= MOVE_TAIL) {
        movedUp = true;
        gsap.to(mediaRef.current, {
          y: 0,
          duration: 0.9,
          ease: "power3.inOut",
        });
      }
      if (!textFired && remaining <= TEXT_TAIL) {
        textFired = true;
        gsap.to(titleRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.85,
          ease: "power3.out",
        });
        gsap.to(buttonRef.current, {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.75,
          delay: 0.25,
          ease: "back.out(1.8)",
        });
      }
      // Seamlessly loop the last second before the video can `ended`. This
      // avoids ever depending on play() resuming after end, which some
      // browsers block — leaving the video frozen on a (possibly blank)
      // final frame.
      if (remaining <= 0.08) {
        video.currentTime = Math.max(0, video.duration - 1);
      }
    };
    video?.addEventListener("timeupdate", onTimeUpdate);

    return () => {
      video?.removeEventListener("timeupdate", onTimeUpdate);
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="snap-section relative min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center gap-5 md:gap-7 px-6 py-8 md:py-10 overflow-hidden"
    >
      <video
        ref={mediaRef}
        poster={imageSrc}
        width={1920}
        height={1200}
        autoPlay
        muted
        playsInline
        onEnded={(e) => {
          // Play the video once through, then loop just the last second.
          const v = e.currentTarget;
          if (!v.duration || !isFinite(v.duration)) return;
          v.currentTime = Math.max(0, v.duration - 1);
          v.play().catch(() => {});
        }}
        aria-label="The new Audacity 4 interface showing tracks of audio clips on a redesigned UI"
        className="block w-full max-w-4xl max-h-[44vh] md:max-h-[52vh] h-auto object-contain rounded-2xl shadow-2xl"
      >
        <source src="/videos/HeroVideo.webm" type="video/webm" />
        <source src="/videos/HeroVideo.mp4" type="video/mp4" />
      </video>

      <h1
        ref={titleRef}
        className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-50 tracking-tight leading-tight text-center max-w-3xl"
      >
        The world's most popular app
        <br />
        to record and edit audio
      </h1>

      <a
        ref={buttonRef}
        href="/download"
        className="inline-block px-8 py-3.5 bg-blue-600 text-white rounded-full font-medium text-lg hover:bg-blue-500 transition-colors"
      >
        Download
      </a>
    </section>
  );
}

export default Hero;
