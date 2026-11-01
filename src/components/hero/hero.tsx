"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { PHOTO } from "./frame";
import { SmokePhoto, type HeroFx } from "./smoke-photo";
import { Masthead } from "./masthead";
import { PodcastCard } from "./podcast-card";
import { ServiceCard } from "./service-card";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => (resolve = r));
  return { promise, resolve };
}

/** tells the page the hero is on screen (the service card starts rotating on it) */
const ready = () => window.dispatchEvent(new Event("hero:ready"));

const TAGLINE = ["Coffee carts. Dessert carts.", "Found on Google.", "Booked for more events."];

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const photo = useRef<HTMLImageElement>(null);
  const fx = useRef<HeroFx>({ reveal: 0, loaded: 0, title: 0 });
  const [texture] = useState(deferred);

  const onPhoto = (status: "on" | "off") => {
    root.current?.setAttribute("data-webgl", status);
    // no smoke to wait for: let the intro go as soon as the type is in
    if (status === "off") texture.resolve();
  };
  const onTexture = () => {
    gsap.to(fx.current, { loaded: 1, duration: 0.9, ease: "power2.out" });
    texture.resolve();
  };

  useGSAP(
    (_, contextSafe) => {
      const q = gsap.utils.selector(root);
      const f = fx.current;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        Object.assign(f, { reveal: 1, loaded: 1, title: 1 });
        ready();
        return;
      }

      // Aldena's parallax: the photo (and the name set into it) drifts at a fraction of the scroll
      gsap.to(q("[data-stage]"), {
        yPercent: 28,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
      });

      const run = contextSafe!(() => {
        // every piece of chrome on the page, the header and the menu button included
        const chrome = document.querySelectorAll("[data-intro=fade]");

        gsap
          .timeline({ onComplete: ready })
          // the photograph condenses out of a dark red haze
          .to(f, { reveal: 1, duration: 2.2, ease: "power2.inOut" }, 0)
          // the name rises out of it letter by letter (the masthead eases each one itself)
          .to(f, { title: 1, duration: 1.6, ease: "none" }, 0.45)
          .fromTo(chrome, { y: 24 }, { y: 0, opacity: 1, duration: 1.1, ease: "expo.out", stagger: 0.06 }, 1.3);
      });

      // start once the type is in and the photo is on the GPU, or after a short wait regardless
      let started = false;
      let cancelled = false;
      const start = () => {
        if (started || cancelled) return;
        started = true;
        run();
        ScrollTrigger.refresh();
      };
      Promise.all([document.fonts.ready, texture.promise]).then(start);
      const fallback = window.setTimeout(start, 2600);
      return () => {
        cancelled = true;
        window.clearTimeout(fallback);
      };
    },
    { scope: root },
  );

  return (
    <section ref={root} aria-labelledby="hero-title" className="relative isolate h-svh min-h-[640px] overflow-hidden bg-coal">
      {/* the photograph through smoke, its grain, and the name set into the same frame */}
      <div data-stage className="absolute inset-0 will-change-transform">
        <Image
          ref={photo}
          data-photo-fallback
          src={PHOTO.src}
          alt="Kent against a sunlit red wall, eyes closed, face turned up to the light"
          fill
          preload
          quality={90}
          // cropped to cover at 1.08 and dropped 2.8% (frame.ts): on tall screens about 1.95 viewport heights wide
          sizes="(max-aspect-ratio: 1685/934) 195vh, 108vw"
          className="origin-[47%_5%] translate-y-[2.8%] scale-[1.08] object-cover object-[47%_5%] transition-opacity duration-700"
        />
        <SmokePhoto
          data-smoke
          fx={fx}
          source={photo}
          onStatus={onPhoto}
          onTexture={onTexture}
          className="absolute inset-0 size-full opacity-0 transition-opacity duration-500"
        />
        <div aria-hidden className="grain pointer-events-none absolute inset-0" />
        {/* just enough shade for the small type in the corners */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-0 top-0 h-[22%] bg-gradient-to-b from-coal/40 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(90%_55%_at_0%_100%,rgb(18_5_4/0.6),transparent_70%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(60%_45%_at_100%_100%,rgb(18_5_4/0.35),transparent_70%)]" />
        </div>
        <Masthead id="hero-title" text="kent fyi" fx={fx} />
      </div>

      {/* bottom left: one line to remember him by, Aldena style */}
      <div className="absolute bottom-[var(--pad-b)] left-[var(--pad-l)] w-[min(620px,calc(100%-var(--pad-l)-var(--pad-r)))] md:w-[min(620px,calc(50%-var(--pad-l)-40px))]">
        <p data-intro="fade" className="font-display text-[clamp(30px,3vw,46px)] leading-[1.1] font-medium tracking-[-0.03em] text-balance text-cream">
          I bet on myself.
          <br />I build what lasts.
        </p>
        <p
          data-intro="fade"
          className="mt-5 pb-14 text-[12px] leading-[1.6] font-semibold tracking-[0.02em] text-[#fffc] uppercase md:mt-6 md:pb-0 md:text-[13px]"
        >
          {TAGLINE.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </p>
      </div>

      {/* bottom right: the podcast, then what LocalEyes does (from laptop width up, clear of the menu button) */}
      <div className="absolute right-[var(--pad-r)] bottom-[var(--pad-b)] hidden w-[372px] flex-col gap-3 lg:flex">
        <div data-intro="fade">
          <PodcastCard />
        </div>
        <div data-intro="fade">
          <ServiceCard />
        </div>
      </div>
    </section>
  );
}
