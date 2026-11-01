"use client";

import Image from "next/image";
import { Fragment, useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

/** the pictures that open up inside the sentence, and how wide each one is */
const CHIPS = {
  kent: { src: "/about/kent-terrace.webp", width: "1.9em" },
  podcast: { src: "https://i.ytimg.com/vi/WtfVjOL8TiU/maxresdefault.jpg", width: "1.55em" },
  lens: { src: "https://images.unsplash.com/photo-1582994254571-52c62d96ebab?w=1200&h=1200&fit=crop&q=80", width: "1.55em" },
};

type Chip = { chip: keyof typeof CHIPS; tail?: string };

/** one sentence, with a picture after a few of its words */
const STATEMENT: (string | Chip)[] = [
  "I'm Kent",
  { chip: "kent", tail: "." },
  "I bet on myself and I build what lasts. Today that's LocalEyes Growth",
  { chip: "podcast", tail: "," },
  "helping coffee carts, dessert carts and mobile bars get found",
  { chip: "lens" },
  "on Google and booked for more events.",
];

/** a word behind frosted glass: faint, with a soft glow right where it sits */
const FROSTED = { color: "rgba(255, 243, 232, 0.12)", textShadow: "0 0 12px rgba(255, 243, 232, 0.35)" };
const CLEAR = { color: "rgba(255, 243, 232, 1)", textShadow: "0 0 0px rgba(255, 243, 232, 0)" };

/**
 * About Kent in one sentence, set big. When it scrolls into view it comes out of the frost word by word,
 * and where it names Kent, LocalEyes and being found a photo opens out of the line like a pill, frosted
 * at first and clearing as it opens. Hover a pill and it swells up out of the text for a closer look.
 * It plays once, on arrival, so there's no long scroll. Without JS, or with reduced motion, it's all there.
 */
export function About() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const tl = gsap.timeline({ paused: true });
      let t = 0;
      gsap.utils.toArray<HTMLElement>("[data-word], [data-chip]").forEach((el) => {
        if (el.hasAttribute("data-chip")) {
          const [photo, veil] = el.children;
          tl.fromTo(el, { clipPath: "inset(0% 50% 0% 50% round 999px)" }, { clipPath: "inset(0% 0% 0% 0% round 999px)", duration: 0.55, ease: "expo.out" }, t)
            .fromTo(photo, { scale: 1.45, filter: "blur(14px) saturate(1.3)" }, { scale: 1, filter: "blur(0px) saturate(1)", duration: 0.7, ease: "power3.out" }, t)
            .fromTo(veil, { opacity: 1 }, { opacity: 0, duration: 0.5, ease: "power2.out" }, t);
          t += 0.04;
        } else {
          tl.fromTo(el, FROSTED, { ...CLEAR, duration: 0.4, ease: "power2.out" }, t);
          t += 0.012;
        }
      });
      // quick: the whole sentence is clear in under a second, started just as it comes up the screen
      ScrollTrigger.create({ trigger: "[data-line]", start: "top 85%", once: true, onEnter: () => tl.play() });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="about"
      aria-labelledby="about-title"
      className="relative bg-coal pt-[clamp(112px,15vw,200px)] pr-[var(--pad-r)] pb-[clamp(96px,12vw,160px)] pl-[var(--pad-l)]"
    >
      <div className="grid gap-y-8 lg:grid-cols-12 lg:gap-x-8">
        <h2 id="about-title" className="text-[12px] font-semibold tracking-[0.02em] text-cream/60 uppercase lg:col-span-3 lg:pt-[0.9em]">
          About
        </h2>
        <p
          data-line
          className="text-[clamp(28px,3.6vw,56px)] leading-[1.12] font-semibold tracking-[-0.03em] text-pretty text-cream [font-variation-settings:'wdth'_108] lg:col-span-9"
        >
          {STATEMENT.map((part, k) =>
            typeof part === "string" ? (
              <Fragment key={k}>
                {k > 0 && " "}
                {part.split(" ").map((word, i) => (
                  <Fragment key={i}>
                    {i > 0 && " "}
                    <span data-word className="inline-block">
                      {word}
                    </span>
                  </Fragment>
                ))}
              </Fragment>
            ) : (
              <Fragment key={k}>
                {/* swells up out of the line on hover, for a closer look */}
                <span
                  aria-hidden
                  data-chip
                  style={{ width: CHIPS[part.chip].width }}
                  className="relative ml-[0.2em] inline-block h-[0.73em] overflow-hidden rounded-full bg-[#1c0705] transition-[scale,box-shadow] duration-700 ease-out-expo hover:z-10 hover:scale-[2.4] hover:shadow-[0_30px_60px_-20px_rgb(0_0_0/0.8)] motion-reduce:transition-none"
                >
                  <span className="absolute inset-0 block">
                    {/* once open, each one keeps drifting a little, like a clip on loop */}
                    <span className="drift absolute inset-0 block">
                      <Image src={CHIPS[part.chip].src} alt="" fill loading="eager" sizes="(min-width: 1024px) 320px, 160px" className="object-cover" />
                    </span>
                  </span>
                  {/* the frost it opens out of */}
                  <span className="absolute inset-0 bg-cream/30 opacity-0" />
                </span>
                {part.tail && (
                  <span data-word className="inline-block">
                    {part.tail}
                  </span>
                )}
              </Fragment>
            ),
          )}
        </p>
      </div>
    </section>
  );
}
