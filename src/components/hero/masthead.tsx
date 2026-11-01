"use client";

import { useEffect, useRef, type RefObject } from "react";
import { preload } from "react-dom";
import { gsap } from "@/lib/gsap";
import { coverRect, PHOTO } from "./frame";
import type { HeroFx } from "./smoke-photo";

const INK = "#fff3e8";
const WEIGHT = 600;
/** the lighter cut a letter eases into under the cursor (Baskervville is variable, 400 to 700) */
const HOVER_WEIGHT = 400;
const TRACKING = -0.04;
/** share of the entrance each letter takes; the rest is the stagger across the name */
const RISE = 0.62;

const cssPx = (name: string, fallback: number) => {
  const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
  return Number.isFinite(v) ? v : fallback;
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

type Glyph = { g: string; x: number; w: number };

/**
 * The name, set big across the top like Aldena's masthead and drawn on a canvas, with his head cut back out
 * over it (a CSS mask from the photo's head matte), so the type reads as if it sits behind him.
 *
 * Entrance (fx.title, 0 to 1): the letters rise one after another out of a line of warm haze at the
 * baseline. Hover: the letters under the cursor ease into a lighter cut of the face, as if the ink thins
 * where you touch it. The real <h1> stays for readers and search, and shows itself if the canvas can't draw.
 * Lives inside [data-stage] so it moves with the photo.
 */
export function Masthead({ id, text, fx }: { id: string; text: string; fx: RefObject<HeroFx> }) {
  const heading = useRef<HTMLHeadingElement>(null);
  const ref = useRef<HTMLCanvasElement>(null);
  // fetch the mask with the page, not when the name first draws
  preload(PHOTO.headMask, { as: "image" });

  useEffect(() => {
    const canvas = ref.current;
    const h1 = heading.current;
    const frame = canvas?.closest<HTMLElement>("[data-stage]");
    const ctx = canvas?.getContext("2d");
    if (!canvas || !h1 || !frame || !ctx) {
      h1?.setAttribute("data-canvas", "off");
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const family = getComputedStyle(h1).fontFamily;
    let masked = false;

    // layout, in CSS px
    let W = 0;
    let dpr = 1;
    let size = 100;
    let baseline = 0;
    let descent = 0;
    let bandH = 0;
    let glyphs: Glyph[] = [];
    /** how far each letter has eased toward the hover weight, 0 to 1 */
    let thin = new Float32Array(0);
    /** the name's own box, so the header above it doesn't count as hovering it */
    let ink = { left: 0, right: 0, top: 0, bottom: 0 };

    const build = () => {
      W = frame.clientWidth;
      const H = frame.clientHeight;
      if (!W || !H) return false;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const pad = cssPx("--pad", 24);
      const top = cssPx("--header-h", 80) + H * 0.07;

      // most of the frame's width, but no taller than a quarter of it; measured before resizing resets the context
      ctx.font = `${WEIGHT} 100px ${family}`;
      const at100 = ctx.measureText(text).width + TRACKING * 100 * (text.length - 1);
      size = Math.min(((W - 2 * pad) * 0.85 / at100) * 100, H * 0.26);
      ctx.font = `${WEIGHT} ${size}px ${family}`;
      const ls = TRACKING * size;
      const m = ctx.measureText(text);
      baseline = top + ctx.measureText("kfy").actualBoundingBoxAscent;
      descent = m.actualBoundingBoxDescent;
      const width = m.width + ls * (text.length - 1);
      const start = (W - width) / 2;
      // each glyph after its kerned prefix (the pair just before it included), plus the tracking
      glyphs = [...text]
        .map((g, k) => {
          const w = ctx.measureText(g).width;
          return { g, w, x: start + ctx.measureText(text.slice(0, k + 1)).width - w + ls * k };
        })
        .filter((glyph) => glyph.g !== " ");
      thin = new Float32Array(glyphs.length);
      ink = { left: start, right: start + width, top, bottom: baseline + descent };
      bandH = baseline + size * 0.35;

      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(bandH * dpr);
      canvas.style.height = `${bandH}px`;

      // his head, cut back out over the type, cropped exactly like the photo
      if (masked) {
        const r = coverRect(W, H);
        for (const prefix of ["", "-webkit-"]) {
          canvas.style.setProperty(`${prefix}mask-image`, `url(${PHOTO.headMask})`);
          canvas.style.setProperty(`${prefix}mask-size`, `${r.w}px ${r.h}px`);
          canvas.style.setProperty(`${prefix}mask-position`, `${r.x}px ${r.y}px`);
          canvas.style.setProperty(`${prefix}mask-repeat`, "no-repeat");
        }
      }
      return true;
    };

    const draw = (p: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, bandH);
      ctx.font = `${WEIGHT} ${size}px ${family}`;
      ctx.fillStyle = INK;

      // the letters, each rising in turn from under a line that follows it down, so descenders arrive whole.
      // A letter under the cursor is set in a lighter cut, centred where the heavier one stood.
      const n = glyphs.length;
      const stagger = n > 1 ? (1 - RISE) / (n - 1) : 0;
      glyphs.forEach((glyph, k) => {
        const local = clamp01((p - k * stagger) / RISE);
        if (local <= 0) return;
        const e = 1 - (1 - local) ** 4;
        ctx.save();
        if (local < 1) {
          ctx.beginPath();
          ctx.rect(glyph.x - size, 0, glyph.w + size * 2, baseline + size * 0.03 + e * descent);
          ctx.clip();
        }
        let x = glyph.x;
        if (thin[k] > 0) {
          ctx.font = `${Math.round(WEIGHT + (HOVER_WEIGHT - WEIGHT) * thin[k])} ${size}px ${family}`;
          x += (glyph.w - ctx.measureText(glyph.g).width) / 2;
        }
        ctx.globalAlpha = Math.min(1, local * 2.2);
        ctx.fillText(glyph.g, x, baseline + (1 - e) * size * 0.85);
        ctx.restore();
      });

      // the haze they rise out of: a warm line along the baseline that swells and fades with the entrance
      if (p > 0 && p < 1 && n) {
        const left = glyphs[0].x;
        const right = glyphs[n - 1].x + glyphs[n - 1].w;
        ctx.save();
        ctx.translate((left + right) / 2, baseline);
        ctx.scale((right - left) / 2, size * 0.09);
        const haze = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
        haze.addColorStop(0, `rgba(255, 176, 128, ${Math.sin(Math.PI * p) * 0.5})`);
        haze.addColorStop(1, "rgba(255, 176, 128, 0)");
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = haze;
        ctx.fillRect(-1, -1, 2, 2);
        ctx.restore();
      }
    };

    // the last mouse position, re-checked on scroll too: the wheel moves the name under a still cursor
    const pointer = { x: 0, on: false };
    let clientX = -1;
    let clientY = -1;
    const locate = () => {
      const r = canvas.getBoundingClientRect();
      const x = clientX - r.left;
      const y = clientY - r.top;
      // over the letters themselves, with a little air around them
      const air = size * 0.15;
      pointer.on =
        clientX >= 0 &&
        fx.current.title >= 1 &&
        x >= ink.left - air &&
        x <= ink.right + air &&
        y >= ink.top - air &&
        y <= ink.bottom + air;
      pointer.x = x;
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      clientX = e.clientX;
      clientY = e.clientY;
      locate();
    };
    const onScroll = () => {
      if (clientX >= 0) locate();
    };
    const onLeave = () => {
      clientX = clientY = -1;
      pointer.on = false;
    };

    // entrance frames while fx.title runs; afterwards a frame only while a letter is still changing weight
    let lastP = -1;
    let idle = true;
    const tick = (_time: number, deltaMs: number) => {
      if (!glyphs.length) return;
      const p = fx.current.title;
      if (p < 1 || lastP < 1) {
        if (p !== lastP) draw(p);
        lastP = p;
        // a cursor already resting on the name counts as soon as the entrance ends
        if (p >= 1 && clientX >= 0) locate();
        return;
      }
      // each letter thins by how close the cursor is, the nearest most, and settles slowly, like ink
      const ease = 1 - (1 - 0.08) ** Math.min(3, deltaMs / 16.667);
      let moving = false;
      glyphs.forEach((glyph, k) => {
        const d = (pointer.x - (glyph.x + glyph.w / 2)) / (size * 0.55);
        const goal = pointer.on ? Math.exp(-d * d) : 0;
        if (Math.abs(goal - thin[k]) > 0.002) {
          thin[k] += (goal - thin[k]) * ease;
          moving = true;
        } else thin[k] = goal;
      });
      if (moving) {
        draw(1);
        idle = false;
      } else if (!idle) {
        draw(1);
        idle = true;
      }
    };

    const rebuild = () => {
      if (build()) draw(reduce ? 1 : fx.current.title);
    };

    let timer = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(rebuild, 80);
    });

    // a move to a screen with a different pixel density changes no CSS size, so watch for it directly
    let dppx = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    const onDensity = () => {
      dppx.removeEventListener("change", onDensity);
      dppx = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      dppx.addEventListener("change", onDensity);
      rebuild();
    };

    // the type and the mask first: a mask that never loads would hide the name, so it's simply skipped
    const maskReady = new Promise<boolean>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = PHOTO.headMask;
    });
    let cancelled = false;
    Promise.all([document.fonts.load(`${WEIGHT} 100px ${family}`).catch(() => undefined), maskReady]).then(([, ok]) => {
      if (cancelled) return;
      masked = ok;
      rebuild();
      h1.setAttribute("data-canvas", "on");
      ro.observe(frame);
      dppx.addEventListener("change", onDensity);
      if (!reduce) {
        gsap.ticker.add(tick);
        window.addEventListener("pointermove", onMove, { passive: true });
        window.addEventListener("scroll", onScroll, { passive: true });
        document.documentElement.addEventListener("pointerleave", onLeave);
      }
    });

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      ro.disconnect();
      dppx.removeEventListener("change", onDensity);
      gsap.ticker.remove(tick);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [text, fx]);

  return (
    <>
      <h1
        ref={heading}
        id={id}
        data-title-text
        translate="no"
        className="absolute inset-x-[var(--pad)] top-[calc(var(--header-h)+7svh)] text-center font-display text-[min(20vw,26svh)] leading-[0.92] font-semibold tracking-[-0.04em] whitespace-nowrap text-cream"
      >
        {text}
      </h1>
      <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-x-0 top-0 block w-full" />
    </>
  );
}
