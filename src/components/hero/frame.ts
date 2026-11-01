/**
 * How the hero photograph sits in the frame. The WebGL smoke, the fallback <img> and the head mask on
 * the title all crop from these numbers, so they stay pixel-aligned.
 */
export const PHOTO = {
  src: "/hero/kent-red-wall.webp",
  /** alpha = everything but his head: masks the title, so the type reads as if it sits behind him */
  headMask: "/hero/kent-head-mask.png",
  width: 1685,
  height: 934,
};

/** object-position of the crop: his face a touch left of centre, the frame held near the top of the photo */
export const POSITION = [0.47, 0.05] as const;

/** a little extra scale, so the smoke has image to pull from at the edges */
export const ZOOM = 1.08;

/** how far the photo sits below where the crop puts it, as a share of the frame's height: just enough that
 * his hair leaves the name readable */
export const DROP = 0.028;

/** His head in image uv (y down): the smoke leaves it untouched, so the head mask keeps lining up. */
export const HEAD = { x: 0.488, y: 0.42, rx: 0.125, ry: 0.25 };

/** CSS object-fit: cover, at ZOOM and dropped by DROP, in the frame's own pixels. */
export function coverRect(frameW: number, frameH: number) {
  const k = Math.max(frameW / PHOTO.width, frameH / PHOTO.height) * ZOOM;
  const w = PHOTO.width * k;
  const h = PHOTO.height * k;
  return { x: (frameW - w) * POSITION[0], y: (frameH - h) * POSITION[1] + frameH * DROP, w, h };
}
