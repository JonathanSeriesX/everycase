import { preload } from "react-dom";
import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Link from "next/link";
import Navbar from "../components/Navbar";
import ThemeMenu from "../components/ThemeMenu.client";
import HashNavigation from "../components/HashNavigation.client";
import "../styles/globals.css";

// Theme-color = the page background per OS colour scheme, as the old Nextra
// <Head> delivered it. Safari treats a background-matching value as an
// invitation to extend the page into its chrome (macOS tab-bar overflow).
// Chrome additionally honours runtime CONTENT MUTATIONS of these metas —
// that's how the Android toolbar follows a manual site toggle (see
// ThemeMenu and the pre-paint script below); WebKit ignores mutations, so
// Safari only ever sees these static values.
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
        alt: "Finest woven logo",
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
        {/* Chrome only (WebKit ignores meta mutations): when a stored manual
            theme disagrees with the OS scheme, retint the theme-color metas
            during parse so the Android toolbar is right from first paint.
            Mutation only — these nodes are React-owned, never remove them. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.theme,c=t==="black"?"rgb(0,0,0)":(t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches))?"rgb(17,17,17)":"rgb(250,250,250)";document.querySelectorAll('meta[name="theme-color"]').forEach(function(m){m.setAttribute("content",c)})}catch(e){}`,
          }}
        />
        {/* enableColorScheme off: next-themes would inline-write color-scheme
            per theme, defeating the static `color-scheme: light dark` that
            keeps iOS 26 from re-adapting its chrome (and it has no notion of
            the black theme anyway). */}
        <ThemeProvider
          attribute="class"
          themes={["light", "dark", "black"]}
          enableColorScheme={false}
        >
          <HashNavigation />
          <Navbar />
          <main className="site-main">{children}</main>
          <footer className="site-footer">
            <Link href="/about" prefetch={false}>
              About ★
            </Link>
            <Link href="/support" prefetch={false}>
              Support this ♥
            </Link>
            <ThemeMenu />
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
