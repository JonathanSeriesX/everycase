import "nextra-theme-docs/style.css";
import "/styles/global.css";
import "/styles/tables.css";
import "/styles/lightbox.css";
import "lightbox.js-react/dist/index.css";
import { initLightboxJS } from "lightbox.js-react";
import React, { useEffect } from "react";
import { usePreserveScroll } from "/components/ScrollPreserve.tsx";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import localFont from "next/font/local";

const tofino = localFont({
  src: [
    {
      path: "../public/fonts/TofinoVariable.woff2",
      weight: "100 800",
      style: "oblique 0deg 1deg"
    }
  ],
  display: "swap",
  variable: "--font-tofino" // Define a custom CSS variable for easy usage
});

export default function Nextra({ Component, pageProps }) {
  usePreserveScroll();

  useEffect(() => {
    initLightboxJS(
      process.env.LIGHTBOX_LICENSE_KEY,
      "individual"
    );
  }, []);

  return (
    <main className={tofino.className}>
      <Component {...pageProps} />
      <Analytics />
      <SpeedInsights />
    </main>
  );
}