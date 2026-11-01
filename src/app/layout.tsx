import type { Metadata, Viewport } from "next";
import { Baskervville, Mona_Sans } from "next/font/google";
import { LiquidFilter } from "@/components/site/liquid-filter";
import { SmoothScroll } from "@/components/site/smooth-scroll";
import "./globals.css";

// Baskervville for the name and the big lines in the hero; Mona Sans, a variable grotesk that can also
// widen (its wdth axis), for everything else
const display = Baskervville({
  variable: "--font-baskervville",
  subsets: ["latin"],
  display: "swap",
});

const sans = Mona_Sans({
  variable: "--font-mona",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "kent fyi · Founder of LocalEyes Growth",
  description: "Kent helps coffee carts, dessert carts and mobile bars get found online and booked for more events.",
};

export const viewport: Viewport = {
  themeColor: "#120504",
  colorScheme: "dark",
  viewportFit: "cover",
};

// Runs before first paint, so the intro start states only apply when JS can play them. Chromium (the one
// browser with navigator.userAgentData) also gets the bend in the liquid glass.
const jsFlag = `document.documentElement.classList.add('js');if(navigator.userAgentData)document.documentElement.classList.add('liquid')`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: jsFlag }} />
      </head>
      <body>
        <LiquidFilter />
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
