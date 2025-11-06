import { Footer, Layout, Navbar } from "nextra-theme-docs";
import { Banner, Head, Search } from "nextra/components";
import { getPageMap } from "nextra/page-map";
import { Quicksand } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "../styles/globals.css";
import localFont from "next/font/local";

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-quicksand",
});
const tofino = localFont({
  src: [
    {
      path: "../public/fonts/TofinoVariable.woff2",
      weight: "100 800",
      style: "oblique 0deg 1deg",
    },
  ],
  display: "swap",
  variable: "--font-tofino", // Define a custom CSS variable for easy usage
});

const logo = (
  <>
    <span
      className={quicksand.className} // Apply the Quicksand font
      style={{
        fontSize: "26px",
        letterSpacing: "0px",
        fontWeight: 300,
        marginRight: -5,
      }}
    >
      Finest
    </span>
    <picture>
      <img
        src="/icons/icon-512x512.png"
        alt="Finest Woven Logo"
        style={{
          marginTop: "0px",
          marginRight: "4px",
          height: "48px",
          width: "48px",
        }}
      />
    </picture>
    <span
      className={quicksand.className}
      style={{
        fontSize: "26px",
        letterSpacing: "0px",
        fontWeight: 300,
        marginLeft: -10,
        marginRight: 15,
      }}
    >
      Woven
    </span>
  </>
);

export const viewport = {
  themeColor: "#E3504F",
};

const baseTitle = {
  default: "Finest Woven",
  template: "%s — Finest Woven",
};

const baseDescription =
  "The only catalogue of all the Apple cases ever released for iPhone, iPad, and Mac.";

export const metadata = {
  applicationName: "Finest Woven",
  title: baseTitle,
  description: baseDescription,
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/icons/512_w_shadow.png",
    apple: "/icons/apple-touch-icon.png",
    other: [
      {
        rel: "mask-icon",
        url: "/icons/bw.svg",
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
        url: "https://cloudfront.everycase.org/assets/og.webp",
        width: 2000,
        height: 1000,
        alt: "Multiple iPhone 13 models displayed in Apple's silicone cases",
      },
    ],
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

/*
const banner = (
    <Banner storageKey="nextra-finest-woven">
        Finest Woven is your library of Apple cases 🎉
    </Banner>
);
const footer = <Footer>MITS {new Date().getFullYear()} © Nextra.</Footer>;
*/

// Navbar component
const navbar = (
  <Navbar
    logo={logo}
    //search={{ placeholder: 'Search by color or SKU...' }} — doesn't work...
    /*
    if I create twatter account, it goes here:
    chatLink="https://twitter.com/shuding_"
    chatIcon={
      <svg width="24" height="24" viewBox="0 0 248 204">
        <path
          fill="currentColor"
          d="M221.95 51.29c.15 2.17.15 4.34.15 6.53 0 66.73-50.8 143.69-143.69 143.69v-.04c-27.44.04-54.31-7.82-77.41-22.64 3.99.48 8 .72 12.02.73 22.74.02 44.83-7.61 62.72-21.66-21.61-.41-40.56-14.5-47.18-35.07a50.338 50.338 0 0 0 22.8-.87C27.8 117.2 10.85 96.5 10.85 72.46v-.64a50.18 50.18 0 0 0 22.92 6.32C11.58 63.31 4.74 33.79 18.14 10.71a143.333 143.333 0 0 0 104.08 52.76 50.532 50.532 0 0 1 14.61-48.25c20.34-19.12 52.33-18.14 71.45 2.19 11.31-2.23 22.15-6.38 32.07-12.26a50.69 50.69 0 0 1-22.2 27.93c10.01-1.18 19.79-3.86 29-7.95a102.594 102.594 0 0 1-25.2 26.16z"
        />
      </svg>
    }*/
  />
);

export default async function RootLayout({ children }) {
  return (
    <html
      lang="en"
      dir="ltr"
      //suppressHydrationWarning // Suggested by `next-themes` package https://github.com/pacocoursey/next-themes#with-app
    >
      <Head
        color={{
          hue: 0,
          saturation: 100,
        }}
      >
        {/* Your additional tags should be passed as `children` of `<Head>` element */}
      </Head>

      <body className={tofino.className}>
        <Layout
          //banner={banner}
          navbar={navbar}
          search={<Search placeholder="Search by color or SKU..." />}
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/JonathanSeriesX/everycase/tree/main"
          footer={<></>}
          toc={{
            float: true,
            backToTop: true,
            //extraContent: <p className="x:text-xs x:text-gray-100">( ͡° ͜ʖ ͡°)</p>,
          }}
          sidebar={{
            defaultMenuCollapseLevel: 1,
            toggleButton: true,
            autoCollapse: false,
          }}
        >
          {children}
          <Analytics />
          <SpeedInsights />
        </Layout>
      </body>
    </html>
  );
}
