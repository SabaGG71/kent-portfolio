import Image from "next/image";
import { ArrowUpRight, Play } from "lucide-react";

/** LocalEyes Podcast, episode 1, on YouTube */
const EPISODE = "https://www.youtube.com/watch?v=WtfVjOL8TiU";
const FRAME = "https://i.ytimg.com/vi/WtfVjOL8TiU/maxresdefault.jpg";

/**
 * A small preview of the LocalEyes Podcast in the dark glass of the cards, the first episode's frame
 * drifting like a clip on loop. It opens the episode on YouTube.
 */
export function PodcastCard() {
  return (
    <a
      href={EPISODE}
      target="_blank"
      rel="noreferrer"
      className="glass group flex items-center gap-4 rounded-[4px] p-3 pr-4 text-cream shadow-[0_30px_70px_-30px_rgb(0_0_0/0.7)] transition-colors duration-300 hover:bg-[rgb(72_12_8/0.6)]"
    >
      <span className="relative aspect-video w-[118px] shrink-0 overflow-hidden rounded-[3px] bg-coal">
        <Image src={FRAME} alt="" fill sizes="118px" loading="eager" className="drift object-cover" />
        <span className="absolute inset-0 grid place-items-center bg-coal/20">
          <span className="grid size-7 place-items-center rounded-full bg-cream/90 text-[#2a0604] transition-transform duration-500 ease-out-expo group-hover:scale-110">
            <Play aria-hidden className="size-3 translate-x-px fill-current" strokeWidth={0} />
          </span>
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-[12px] font-medium tracking-[-0.02em] text-cream/70">
          <span aria-hidden className="size-1.5 rounded-full bg-ember" />
          LocalEyes Podcast · Ep. 1
        </span>
        <span className="mt-1 block text-[15px] leading-[1.2] font-semibold tracking-[-0.03em] text-pretty">
          What 3 years of catering SEO taught us
        </span>
        <span className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold tracking-[-0.03em] text-cream/80 uppercase">
          Watch on YouTube
          <ArrowUpRight
            aria-hidden
            className="size-3.5 text-ember transition-transform duration-500 ease-out-expo group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            strokeWidth={2}
          />
        </span>
        <span className="sr-only">(opens in a new tab)</span>
      </span>
    </a>
  );
}
