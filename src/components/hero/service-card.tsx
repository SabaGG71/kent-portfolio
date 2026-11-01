"use client";

import { useEffect, useRef, useState, type FocusEvent } from "react";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { cn } from "@/lib/utils";

const SERVICES = [
  { title: "Local SEO", body: "Get found by people nearby who want to book a coffee cart or mobile bar." },
  { title: "Google Business Profile", body: "A profile that turns map views into calls and booking requests." },
  { title: "Websites that book", body: "Fast, clear pages that turn visitors into event inquiries." },
];

const HOLD = 6;
/** the hero's intro announces when the card is on screen; if it never does, start anyway */
const READY_EVENT = "hero:ready";
const READY_FALLBACK = 6000;
const pad = (i: number) => String(i + 1).padStart(2, "0");

const control =
  "grid size-7 place-items-center rounded-[3px] text-cream/75 transition-colors duration-300 hover:bg-cream/10 hover:text-cream focus-visible:bg-cream/10 focus-visible:text-cream";

/**
 * Aldena's glass card, cycling through what LocalEyes does. It starts once the intro has shown it, pauses
 * on hover or focus, has its own pause button, and stops for good once you steer it.
 */
export function ServiceCard({ className }: { className?: string }) {
  const [index, setIndex] = useState(0);
  const [armed, setArmed] = useState(false);
  const [steered, setSteered] = useState(false);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const bar = useRef<HTMLSpanElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const timer = useRef<gsap.core.Tween | null>(null);
  const first = useRef(true);
  const [reduce] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => {
    const arm = () => setArmed(true);
    window.addEventListener(READY_EVENT, arm);
    const fallback = window.setTimeout(arm, READY_FALLBACK);
    return () => {
      window.removeEventListener(READY_EVENT, arm);
      window.clearTimeout(fallback);
    };
  }, []);

  // the hairline fills while a card is held, then the next one comes in
  const auto = armed && !steered && !reduce;
  useEffect(() => {
    if (!auto) {
      gsap.set(bar.current, { scaleX: steered || reduce ? 1 : 0 });
      return;
    }
    timer.current = gsap.fromTo(
      bar.current,
      { scaleX: 0 },
      { scaleX: 1, duration: HOLD, ease: "none", onComplete: () => setIndex((i) => (i + 1) % SERVICES.length) },
    );
    return () => {
      timer.current?.kill();
      timer.current = null;
    };
  }, [index, auto, steered, reduce]);

  const held = paused || hovered || focused;
  useEffect(() => {
    if (held) timer.current?.pause();
    else timer.current?.resume();
  }, [held, index, auto]);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (reduce) gsap.fromTo(copy.current, { opacity: 0 }, { opacity: 1, duration: 0.3 });
    else gsap.fromTo(copy.current, { y: 10, opacity: 0, filter: "blur(6px)" }, { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.8, ease: "expo.out" });
  }, [index, reduce]);

  const go = (dir: 1 | -1) => {
    setSteered(true);
    setIndex((i) => (i + dir + SERVICES.length) % SERVICES.length);
  };

  // focus moving between the card's own buttons is still focus on the card
  const onBlur = (e: FocusEvent<HTMLElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
  };

  const s = SERVICES[index];

  return (
    <aside
      aria-label="What LocalEyes Growth does"
      onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={onBlur}
      className={cn(
        "glass w-full rounded-[4px] p-5 text-cream shadow-[0_30px_70px_-30px_rgb(0_0_0/0.7)]",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => go(-1)} aria-label="Previous service" className={control}>
            <ArrowLeft aria-hidden className="size-3.5" strokeWidth={2} />
          </button>
          <button type="button" onClick={() => go(1)} aria-label="Next service" className={control}>
            <ArrowRight aria-hidden className="size-3.5" strokeWidth={2} />
          </button>
          {auto && (
            <button type="button" onClick={() => setPaused((p) => !p)} aria-label={paused ? "Play rotation" : "Pause rotation"} className={control}>
              {paused ? <Play aria-hidden className="size-3" strokeWidth={2} /> : <Pause aria-hidden className="size-3" strokeWidth={2} />}
            </button>
          )}
        </div>
        <span aria-hidden className="relative h-px flex-1 overflow-hidden bg-cream/20">
          <span ref={bar} className="absolute inset-0 origin-left scale-x-0 bg-cream" />
        </span>
        <span className="text-[12px] font-medium tracking-[-0.02em] text-cream/70 tabular-nums">
          {pad(index)} / {pad(SERVICES.length - 1)}
        </span>
      </div>

      <div ref={copy} aria-live={steered ? "polite" : "off"} className="mt-5">
        <p className="text-[22px] leading-[1.15] font-semibold tracking-[-0.04em]">{s.title}</p>
        <p className="mt-2 min-h-[2.5em] text-[15px] leading-[1.25] font-medium tracking-[-0.03em] text-pretty text-cream/80">{s.body}</p>
      </div>
    </aside>
  );
}
