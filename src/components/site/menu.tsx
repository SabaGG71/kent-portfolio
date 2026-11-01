"use client";

import type { CSSProperties } from "react";
import { Popover } from "@base-ui/react/popover";
import { LINKS } from "./links";
import { RollingText } from "./rolling-text";

/**
 * Aldena's bottom-centre menu button, fixed. A small menu of the links grows up out of it, both in the
 * dark glass of the cards. The burger turns into a cross while it's open.
 */
export function Menu() {
  return (
    <Popover.Root>
      <Popover.Trigger
        data-intro="fade"
        aria-label="Menu"
        className="glass group fixed bottom-[var(--pad-b)] left-1/2 z-40 grid h-11 w-[88px] -translate-x-1/2 place-items-center rounded-[4px] border-cream/15 bg-[rgb(40_6_4/0.55)] text-cream transition-colors duration-300 hover:bg-[rgb(72_12_8/0.75)] data-popup-open:bg-[rgb(72_12_8/0.75)]"
      >
        <span aria-hidden className="relative block h-[11px] w-5">
          <span className="absolute inset-x-0 top-0 h-px bg-cream transition-transform duration-500 ease-out-expo group-data-popup-open:translate-y-[5px] group-data-popup-open:rotate-45 motion-reduce:transition-none" />
          <span className="absolute inset-x-0 top-[5px] h-px bg-cream transition-opacity duration-300 group-data-popup-open:opacity-0 motion-reduce:transition-none" />
          <span className="absolute inset-x-0 top-[10px] h-px bg-cream transition-transform duration-500 ease-out-expo group-data-popup-open:-translate-y-[5px] group-data-popup-open:-rotate-45 motion-reduce:transition-none" />
        </span>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner side="top" sideOffset={10} className="z-50">
          <Popover.Popup className="menu-pop glass w-[min(220px,calc(100vw-2*var(--pad)))] origin-[var(--transform-origin)] rounded-[6px] bg-[rgb(30_6_4/0.78)] p-2 text-cream shadow-[0_30px_80px_-30px_rgb(0_0_0/0.85)] outline-none">
            <Popover.Title className="sr-only">Menu</Popover.Title>
            <nav aria-label="Menu">
              <ul>
                {LINKS.map((l, i) => (
                  <li key={l.href} className="menu-item" style={{ "--i": i } as CSSProperties}>
                    <Popover.Close
                      nativeButton={false}
                      render={<a href={l.href} />}
                      className="roll-host flex items-center rounded-[4px] px-3 py-2 font-display text-[28px] leading-[1.05] font-medium tracking-[-0.03em] transition-colors duration-300 hover:bg-cream/[0.06] focus-visible:bg-cream/[0.06]"
                    >
                      <RollingText>{l.label}</RollingText>
                    </Popover.Close>
                  </li>
                ))}
              </ul>
            </nav>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
