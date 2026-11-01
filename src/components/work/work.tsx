"use client";

import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import { RollingText } from "@/components/site/rolling-text";

type Venture = {
  kind: string;
  title: string;
  line: string;
  image: { src: string; alt: string; position?: string };
  link?: { href: string; label: string };
};

/** what Kent has his name on; the wine and jewelry photos are placeholders until the real ones come in */
const VENTURES: Venture[] = [
  {
    kind: "Wine",
    title: "kent fyi",
    line: "My own wine, under my own name.",
    image: { src: "https://images.unsplash.com/photo-1575184560884-5f3ece6e636c?w=2400&q=80", alt: "A wine glass in deep red light" },
  },
  {
    kind: "Partnership",
    title: "Jewelry",
    line: "A signed deal with a jewelry brand.",
    image: { src: "https://images.unsplash.com/photo-1782988112531-a189b256440e?w=2400&q=80", alt: "Two diamond rings on glowing embers" },
  },
  {
    kind: "Company",
    title: "LocalEyes Growth",
    line: "Getting coffee carts, dessert carts and mobile bars found on Google and booked.",
    image: { src: "/work/kent-terrace.webp", alt: "Kent on a mountain terrace, smiling in sunglasses", position: "54% 40%" },
    link: { href: "https://localeyesgrowth.com", label: "localeyesgrowth.com" },
  },
];

/**
 * Work as three tall panels side by side, one open at a time. Hover, focus or tap one and it opens out
 * while the others narrow: its photo comes up into full colour and settles, and its name widens out across
 * it on Mona Sans's width axis. Closed, a panel shows its name running up the side. On phones they stack
 * and open downwards. They rise in once, on arrival.
 */
export function Work() {
  const root = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(0);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.from("[data-panel]", {
        yPercent: 10,
        opacity: 0,
        duration: 1.2,
        ease: "expo.out",
        stagger: 0.09,
        scrollTrigger: { trigger: "[data-panels]", start: "top 80%", once: true },
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="work"
      aria-labelledby="work-title"
      className="relative bg-coal pt-[clamp(48px,6vw,96px)] pr-[var(--pad-r)] pb-[clamp(112px,12vw,160px)] pl-[var(--pad-l)]"
    >
      <h2 id="work-title" className="border-b border-cream/12 pb-5 text-[12px] font-semibold tracking-[0.02em] text-cream/60 uppercase">
        Work
      </h2>

      <ul data-panels className="mt-6 flex h-[118svh] flex-col gap-3 lg:h-[76svh] lg:min-h-[520px] lg:flex-row">
        {VENTURES.map((v, i) => {
          const isOpen = open === i;
          return (
            <li
              key={v.title}
              data-panel
              data-open={isOpen || undefined}
              onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(i)}
              className={cn(
                "group relative min-h-0 min-w-0 basis-0 overflow-hidden rounded-[6px] bg-[#1c0705] transition-[flex-grow] duration-[900ms] ease-out-expo motion-reduce:transition-none",
                isOpen ? "grow-[3.4]" : "grow",
              )}
            >
              <div className="absolute inset-0 scale-110 brightness-[0.45] saturate-[0.35] transition-[scale,filter] duration-[1200ms] ease-out-expo group-data-open:scale-100 group-data-open:brightness-[0.8] group-data-open:saturate-100 motion-reduce:transition-none">
                <Image
                  src={v.image.src}
                  alt={v.image.alt}
                  fill
                  sizes="(min-width: 1024px) 62vw, 100vw"
                  className="object-cover"
                  style={{ objectPosition: v.image.position }}
                />
              </div>
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgb(18_5_4/0.85),transparent_60%)]" />
              <div aria-hidden className="grain pointer-events-none absolute inset-0" />

              {/* opens the panel for keyboard and touch; the name is what it's called */}
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`work-${i}`}
                onFocus={() => setOpen(i)}
                onClick={() => setOpen(i)}
                className="absolute inset-0 z-[1] cursor-default rounded-[6px] focus-visible:-outline-offset-4"
              >
                <span className="sr-only">
                  {v.title}, {v.kind}
                </span>
              </button>

              {/* closed: the name running up the side */}
              <p
                aria-hidden
                translate="no"
                className="pointer-events-none absolute bottom-5 left-5 text-[clamp(20px,1.8vw,28px)] leading-none font-semibold tracking-[-0.03em] whitespace-nowrap text-cream transition-opacity duration-300 group-data-open:opacity-0 lg:rotate-180 lg:[writing-mode:vertical-rl]"
              >
                {v.title}
              </p>

              {/* open: the kind, the name widening out, the line and the link */}
              <div
                id={`work-${i}`}
                className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] p-5 opacity-0 transition-opacity duration-500 group-data-open:opacity-100 group-data-open:delay-[400ms] lg:p-8"
              >
                <p className="text-[12px] font-semibold tracking-[0.02em] text-cream/70 uppercase">{v.kind}</p>
                <h3
                  translate={v.title === "kent fyi" ? "no" : undefined}
                  className="mt-3 text-[clamp(32px,3.9vw,60px)] leading-[0.95] font-semibold tracking-[-0.04em] whitespace-nowrap text-cream transition-[font-variation-settings] duration-[1200ms] ease-out-expo [font-variation-settings:'wdth'_92] group-data-open:[font-variation-settings:'wdth'_115] group-data-open:delay-[400ms] motion-reduce:transition-none"
                >
                  {v.title}
                </h3>
                <div className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-2">
                  <p className="max-w-[40ch] text-[15px] leading-[1.45] font-medium tracking-[-0.01em] text-cream/80">{v.line}</p>
                  {v.link && (
                    <a
                      href={v.link.href}
                      target="_blank"
                      rel="noreferrer"
                      tabIndex={isOpen ? 0 : -1}
                      className="roll-host pointer-events-auto inline-flex items-center gap-1.5 text-[12px] font-semibold tracking-[0.02em] text-cream uppercase"
                    >
                      <RollingText>{v.link.label}</RollingText>
                      <ArrowUpRight aria-hidden className="size-3.5 text-ember" strokeWidth={2} />
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
