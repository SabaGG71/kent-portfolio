"use client";

import { useEffect, useRef, type ComponentProps, type RefObject } from "react";
import { gsap } from "@/lib/gsap";
import { DROP, HEAD, POSITION, ZOOM } from "./frame";
import { createStage, PHOTO_FRAG, uploadTexture } from "./smoke-gl";

/** Shared, mutable state that GSAP tweens and the canvases read every frame. */
export type HeroFx = {
  /** 0 all smoke, 1 the photograph has condensed */
  reveal: number;
  /** 0 until the photo is on the GPU, eased to 1 */
  loaded: number;
  /** the name's entrance, 0 hidden below its baseline, 1 set */
  title: number;
};

/** a calm frame for reduced motion */
const STILL_TIME = 14;
/** seconds the smoke keeps breathing after the photo has formed; then the frame holds still */
const LINGER = 4;

type Props = Omit<ComponentProps<"canvas">, "ref"> & {
  fx: RefObject<HeroFx>;
  /** the rendered <img>, used as the texture */
  source: RefObject<HTMLImageElement | null>;
  onStatus?: (status: "on" | "off") => void;
  onTexture?: () => void;
};

export function SmokePhoto({ fx, source, onStatus, onTexture, ...props }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  // the callbacks can change identity between renders without rebuilding the GL context
  const statusRef = useRef(onStatus);
  const textureRef = useRef(onTexture);
  useEffect(() => {
    statusRef.current = onStatus;
    textureRef.current = onTexture;
  });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const stage = createStage(canvas, PHOTO_FRAG, {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "high-performance",
    });
    if (!stage) {
      statusRef.current?.("off");
      return;
    }
    const { gl, uniform } = stage;

    let imgW = 16;
    let imgH = 9;
    let texture: WebGLTexture | null = null;
    let quality = 1;
    let visible = true;
    let lost = false;
    let running = !reduce;
    let now = reduce ? STILL_TIME : 0;

    gl.uniform1i(uniform("uTex"), 0);
    gl.uniform2f(uniform("uPos"), POSITION[0], POSITION[1]);
    gl.uniform1f(uniform("uZoom"), ZOOM);
    gl.uniform1f(uniform("uDrop"), DROP);
    gl.uniform4f(uniform("uHead"), HEAD.x, HEAD.y, HEAD.rx, HEAD.ry);

    const draw = () => {
      if (lost) return;
      const f = fx.current;
      gl.uniform2f(uniform("uRes"), canvas.width, canvas.height);
      gl.uniform2f(uniform("uImg"), imgW, imgH);
      gl.uniform1f(uniform("uTime"), now);
      gl.uniform1f(uniform("uReveal"), f.reveal);
      gl.uniform1f(uniform("uLoaded"), f.loaded);
      stage.draw();
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr * quality));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr * quality));
      if (canvas.width === w && canvas.height === h) return;
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      // resizing clears the buffer, so paint straight away rather than leave a blank frame
      draw();
    };
    resize();

    // the photograph goes up to the GPU once decoded, and again if the browser swaps in a larger
    // srcset candidate after a resize
    const img = source.current;
    const load = () => {
      if (lost || !img?.naturalWidth) return;
      const first = !texture;
      if (texture) gl.deleteTexture(texture);
      texture = uploadTexture(gl, img);
      imgW = img.naturalWidth;
      imgH = img.naturalHeight;
      if (first) textureRef.current?.();
      if (!running) draw();
    };
    // no photo: nothing to wait for, and nothing worth drawing
    let failed = false;
    const fail = () => {
      failed = true;
      statusRef.current?.("off");
    };

    // frames: skip offscreen, step the resolution down if a slow GPU falls behind its own refresh rate
    // (the median of the first frames, so one late frame can't skew it), and once the photo has formed
    // and breathed a moment, hold the frame and stop drawing
    let frames = 0;
    let slow = 0;
    let interval = 0;
    const deltas: number[] = [];
    let formedAt = -1;
    const stop = () => {
      running = false;
      gsap.ticker.remove(tick);
    };
    const tick = (time: number, deltaMs: number) => {
      if (failed) return stop();
      if (!visible || lost) return;
      now = time;
      frames++;
      if (frames > 1 && frames <= 61) {
        deltas.push(deltaMs);
        if (deltas.length === 60) interval = [...deltas].sort((a, b) => a - b)[30];
      } else if (interval && quality > 0.56) {
        slow = deltaMs > Math.max(interval * 1.6, 18) ? slow + 1 : Math.max(0, slow - 1);
        if (slow > 40) {
          quality *= 0.82;
          slow = 0;
          resize();
        }
      }
      draw();
      const f = fx.current;
      if (f.reveal < 1 || f.loaded < 1) formedAt = -1;
      else if (formedAt < 0) formedAt = time;
      else if (time - formedAt > LINGER) stop();
    };

    // the photo may already have settled before this ran, loaded or broken
    img?.addEventListener("load", load);
    img?.addEventListener("error", fail);
    if (img?.complete) {
      if (img.naturalWidth) load();
      else fail();
    }

    const io = new IntersectionObserver((entries) => {
      visible = entries[entries.length - 1].isIntersecting;
    });
    io.observe(canvas);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // a move to a screen with a different pixel density changes no CSS size, so watch for it directly
    let dppx = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    const onDensity = () => {
      dppx.removeEventListener("change", onDensity);
      dppx = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      dppx.addEventListener("change", onDensity);
      resize();
    };
    dppx.addEventListener("change", onDensity);

    const onLost = (e: Event) => {
      e.preventDefault();
      lost = true;
      statusRef.current?.("off");
    };
    canvas.addEventListener("webglcontextlost", onLost);

    if (reduce) draw();
    else gsap.ticker.add(tick);
    statusRef.current?.("on");

    return () => {
      gsap.ticker.remove(tick);
      io.disconnect();
      ro.disconnect();
      dppx.removeEventListener("change", onDensity);
      img?.removeEventListener("load", load);
      img?.removeEventListener("error", fail);
      canvas.removeEventListener("webglcontextlost", onLost);
      if (texture) gl.deleteTexture(texture);
      stage.dispose();
    };
  }, [fx, source]);

  return <canvas ref={ref} aria-hidden {...props} />;
}
