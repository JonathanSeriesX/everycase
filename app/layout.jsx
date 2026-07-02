import { preload } from "react-dom";
import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Link from "next/link";
import Navbar from "../components/Navbar";
import HashNavigation from "../components/HashNavigation.client";
import "../styles/globals.css";

// Safari tints its tab bar / iOS top bar with theme-color; matching the page
// background (per colour scheme) lets the page visually flow through the
// browser chrome — same trick the old Nextra <Head> used. A manual theme
// toggle updates these metas client-side (see ThemeToggle).
export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "rgb(250,250,250)" },
    { media: "(prefers-color-scheme: dark)", color: "rgb(17,17,17)" },
  ],
};

const baseTitle = {
  default: "Finest Woven",
  template: "%s — Finest Woven",
};

const baseDescription =
  "The only catalogue of all the Apple accessories ever released for iPhone, iPad, and Mac.";

export const metadata = {
  applicationName: "Finest Woven",
  title: baseTitle,
  description: baseDescription,
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "https://cloudfront.everycase.org/assets/512_w_shadow.png",
    apple: "https://cloudfront.everycase.org/assets/apple-touch-icon.png",
    other: [
      {
        rel: "mask-icon",
        url: "https://cloudfront.everycase.org/assets/bw.svg",
        color: "#E3504F",
      },
    ],
  },
  openGraph: {
    title: baseTitle,
    description: baseDescription,
    siteName: "Finest Woven",
    locale: "en_GB",
    type: "website",
    images: [
      {
        url: "https://cloudfront.everycase.org/og/fallback.webp",
        width: 2400,
        height: 1260,
        alt: "Multiple iPhone 13 models displayed in Apple's silicone cases",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    creator: "@JonathanSeriesX",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
  },
  other: {
    "msapplication-config": "none",
    "msapplication-TileColor": "#FFE0F5",
    "msapplication-tap-highlight": "no",
  },
};

export default function RootLayout({ children }) {
  preload("https://cloudfront.everycase.org/fonts/TofinoVariableOffset.woff2", {
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  });

  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning // theme class is set pre-hydration by next-themes
    >
      <body>
        {/* The SSR theme-color metas are keyed to the OS colour scheme; when a
            stored manual theme disagrees, fix them during parse — before
            paint — so the browser bar never flashes the wrong colour. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.theme,d=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches),c=d?"rgb(17,17,17)":"rgb(250,250,250)";document.querySelectorAll('meta[name="theme-color"]').forEach(function(m){m.setAttribute("content",c)})}catch(e){}`,
          }}
        />
        <ThemeProvider attribute="class" disableTransitionOnChange>
          <HashNavigation />
          <Navbar />
          <main className="site-main">{children}</main>
          <footer className="site-footer">
            <Link href="/about">About ★</Link>
            <Link href="/support">Support this ♥</Link>
          </footer>
          <Analytics />
          <SpeedInsights />
          <script
            defer
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon='{"token": "95e2bceaf09643619d934557acc8f72d"}'
          ></script>
        </ThemeProvider>
      </body>
    </html>
  );
}
