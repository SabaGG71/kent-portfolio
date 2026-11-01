"use client";

import { ArrowUpRight, Check, Copy } from "lucide-react";
import { useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { RollingText } from "@/components/site/rolling-text";

/** Kent's address: still to be confirmed before launch */
const EMAIL = "kent@localeyesgrowth.com";

type Item = { text: string; href?: string };

const COLUMNS: { label: string; items: Item[] }[] = [
  {
    label: "Ventures",
    items: [{ text: "kent fyi, wine" }, { text: "Jewelry partnership" }, { text: "LocalEyes Growth", href: "https://localeyesgrowth.com" }],
  },
  {
    label: "Listen",
    items: [
      { text: "LocalEyes Podcast", href: "https://www.youtube.com/watch?v=WtfVjOL8TiU" },
      { text: "YouTube", href: "https://www.youtube.com/@LocalEyesSEO" },
    ],
  },
];

const label = "text-[12px] font-semibold tracking-[0.02em] text-cream/55 uppercase";

/**
 * FYI: the last word. A line to end on, everything worth knowing laid out on a quiet grid (how to reach
 * him, what he has his name on, where to listen), and then the name again across the whole width, rising
 * in letter by letter, thinning under the cursor like the masthead. It plays once, on arrival.
 */
export function Contact() {
  const root = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.from("[data-rise]", {
        y: 28,
        opacity: 0,
        duration: 1,
        ease: "expo.out",
        stagger: 0.08,
        scrollTrigger: { trigger: root.current, start: "top 75%", once: true },
      });
      gsap.from("[data-letter]", {
        yPercent: 100,
        duration: 1.1,
        ease: "expo.out",
        stagger: 0.05,
        scrollTrigger: { trigger: "[data-wordmark]", start: "top 92%", once: true },
      });
    },
    { scope: root },
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // no clipboard access (an insecure origin, say): the address is right there to select
    }
  };

  return (
    <section ref={root} id="contact" aria-labelledby="contact-title" className="relative overflow-hidden bg-coal pt-[clamp(96px,12vw,160px)]">
      <div className="px-[var(--pad-l)] pr-[var(--pad-r)]">
        <p data-rise className={label}>
          FYI
        </p>
        <h2
          id="contact-title"
          data-rise
          className="mt-6 max-w-[13ch] text-[clamp(40px,6.4vw,104px)] leading-[0.98] font-semibold tracking-[-0.045em] text-cream [font-variation-settings:'wdth'_108]"
        >
          Let&rsquo;s build something that lasts.
        </h2>

        <div className="mt-[clamp(48px,7vw,96px)] grid gap-x-8 gap-y-10 border-t border-cream/12 pt-8 sm:grid-cols-2 lg:grid-cols-12">
          <div data-rise className="sm:col-span-2 lg:col-span-6">
            <p className={label}>Contact</p>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              <a
                href={`mailto:${EMAIL}`}
                className="roll-host text-[clamp(22px,2.4vw,36px)] leading-none font-semibold tracking-[-0.03em] text-cream"
              >
                <RollingText>{EMAIL}</RollingText>
              </a>
              <button
                type="button"
                onClick={copy}
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-cream/20 px-3 text-[12px] font-semibold tracking-[0.02em] text-cream/80 uppercase transition-colors duration-300 hover:border-cream/50 hover:text-cream"
              >
                {copied ? <Check aria-hidden className="size-3.5 text-ember" strokeWidth={2} /> : <Copy aria-hidden className="size-3.5" strokeWidth={2} />}
                <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.label} data-rise className="lg:col-span-3">
              <p className={label}>{column.label}</p>
              <ul className="mt-4 space-y-2 text-[17px] leading-[1.35] font-medium tracking-[-0.02em]">
                {column.items.map((item) => (
                  <li key={item.text}>
                    {item.href ? (
                      <a href={item.href} target="_blank" rel="noreferrer" className="roll-host inline-flex items-center gap-1.5 text-cream">
                        <RollingText>{item.text}</RollingText>
                        <ArrowUpRight aria-hidden className="size-3.5 text-ember" strokeWidth={2} />
                        <span className="sr-only">(opens in a new tab)</span>
                      </a>
                    ) : (
                      <span className="text-cream/80">{item.text}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* the name again, the whole width, as the last word on the page */}
      <p
        data-wordmark
        aria-hidden
        translate="no"
        className="mt-[clamp(64px,9vw,128px)] overflow-hidden pb-[0.26em] text-center font-display text-[29vw] leading-[0.8] font-semibold tracking-[-0.04em] whitespace-nowrap text-cream transition-[font-weight] duration-700 ease-out-expo hover:font-normal motion-reduce:transition-none"
      >
        {[..."kent fyi"].map((ch, i) => (
          <span key={i} data-letter className="inline-block whitespace-pre">
            {ch}
          </span>
        ))}
      </p>

      <div className="flex items-center justify-between border-t border-cream/12 px-[var(--pad-l)] pt-5 pr-[var(--pad-r)] pb-[calc(var(--pad-b)+4px)] text-[12px] font-semibold tracking-[0.02em] text-cream/55 uppercase">
        <span translate="no">&copy; kent fyi</span>
        <a href="#main" className="roll-host text-cream/80 hover:text-cream">
          <RollingText>Back to top</RollingText>
        </a>
      </div>
    </section>
  );
}
