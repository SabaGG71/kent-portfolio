import { LINKS } from "./links";
import { RollingText } from "./rolling-text";

/** Aldena-style: just the links, centred over the photo, and it scrolls away with the page. */
export function Header() {
  return (
    <header className="absolute inset-x-0 top-0 z-30 text-cream">
      <a
        href="#main"
        className="absolute top-3 left-3 z-10 -translate-y-16 rounded-[4px] bg-cream px-3 py-2 text-[12px] font-semibold text-[#2a0604] uppercase transition-transform focus-visible:translate-y-0"
      >
        Skip to content
      </a>
      <nav aria-label="Primary" className="hidden h-[var(--header-h)] items-center justify-center gap-5 md:flex">
        {LINKS.map((l) => (
          <a key={l.href} data-intro="fade" href={l.href} className="roll-host py-2 text-[12px] font-semibold tracking-[-0.03em] uppercase">
            <RollingText>{l.label}</RollingText>
          </a>
        ))}
      </nav>
    </header>
  );
}
