import type { CSSProperties } from "react";

/**
 * Aldena's link hover: on hover of the nearest .roll-host, each letter rolls up in turn and its copy
 * (a text-shadow one line below) rolls in behind it. Readers get the word whole.
 */
export function RollingText({ children }: { children: string }) {
  return (
    <>
      <span className="sr-only">{children}</span>
      <span aria-hidden className="roll">
        {[...children].map((ch, i) => (
          <span key={i} style={{ "--i": i } as CSSProperties}>
            {ch}
          </span>
        ))}
      </span>
    </>
  );
}
