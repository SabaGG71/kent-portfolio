/**
 * The bend in the liquid glass (.glass in globals.css): slow, smooth noise that nudges what's behind the
 * glass a few pixels this way and that, like looking through poured glass. Chromium only, as only it takes
 * an SVG filter as a backdrop filter; everywhere else the glass is simply blurred.
 */
export function LiquidFilter() {
  return (
    <svg aria-hidden width="0" height="0" className="pointer-events-none absolute">
      <filter id="liquid" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves={1} seed={4} result="noise" />
        <feGaussianBlur in="noise" stdDeviation={3} result="map" />
        <feDisplacementMap in="SourceGraphic" in2="map" scale={24} xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
}
