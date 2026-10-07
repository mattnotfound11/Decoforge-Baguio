import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Newsreader, Plus_Jakarta_Sans } from "next/font/google";
import { ScrollReveal } from "@/components/scroll-reveal";
import { IntroLoader } from "@/components/motion/intro-loader";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { site } from "@/lib/site";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
});

/** Display face for editorial headlines and the sample book's plate titles. */
const instrument = Instrument_Serif({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-instrument",
  weight: "400",
  style: ["normal", "italic"],
});

/** Book face for the sample book's long-form notes. */
const newsreader = Newsreader({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-newsreader",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://decoforge-baguio.vercel.app"),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  keywords: [
    "PVC ceiling Baguio", "fluted panel Philippines", "WPC decking Baguio",
    "architectural surfaces", "interior fit-out Benguet",
  ],
  openGraph: {
    type: "website",
    locale: "en_PH",
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#171210",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-PH" suppressHydrationWarning className={`${jakarta.variable} ${instrument.variable} ${newsreader.variable}`}>
      <head>
        {/* Decide before first paint whether the intro plays, so it never flashes. If its
            script never finishes, a 9s failsafe lifts the cover and releases scroll. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var d=document.documentElement;setTimeout(function(){if(!d.hasAttribute("data-reveal-ready"))d.setAttribute("data-reveal-failed","")},8000);try{var skip=sessionStorage.getItem("df-intro")||matchMedia("(prefers-reduced-motion: reduce)").matches||location.pathname!=="/";d.dataset.intro=skip?"skip":"play";if(!skip)window.__dfIntroFailsafe=setTimeout(function(){if(d.dataset.intro==="play"){d.dataset.intro="skip";d.style.overflow="";dispatchEvent(new Event("df:intro-done"))}},9000)}catch(e){d.dataset.intro="skip"}})()`,
          }}
        />
        {/* Without JS the reveal classes would leave the page blank. */}
        <noscript>
          <style>{`[data-reveal],[data-split] .w>span{opacity:1 !important;transform:none !important;filter:none !important;clip-path:none !important}`}</style>
        </noscript>
        {/* Same reset if scripts load but never start (a failed chunk, a blocker). */}
        <style>{`html[data-reveal-failed] [data-reveal],html[data-reveal-failed] [data-split] .w>span{opacity:1 !important;transform:none !important;filter:none !important;clip-path:none !important}`}</style>
        <noscript>
        </noscript>
      </head>
      <body className="antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-rust focus:px-5 focus:py-3 focus:text-white"
        >
          Skip to content
        </a>
        <IntroLoader />
        {children}
        {/* Paper grain over the whole site. Fixed, so it never repaints on scroll. */}
        <div className="grain" aria-hidden="true" />
        <ScrollReveal />
        <SmoothScroll />
      </body>
    </html>
  );
}
