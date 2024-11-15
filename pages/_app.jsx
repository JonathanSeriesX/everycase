import "nextra-theme-docs/style.css";
import "/styles/global.css";
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
    },
    {
      path: "../public/fonts/TofinoVariable.ttf",
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

    // Check if service workers are supported and avoid registering in unsupported environments
    if ("serviceWorker" in navigator && process.env.NODE_ENV !== "development") {
      // Register service worker
      navigator.serviceWorker
        .register("/service-worker.js")
        .then(() => {
          console.log("Service worker registered successfully.");
        })
        .catch((error) => {
          console.error("Service worker registration failed:", error);
        });

      // Check if service worker is ready, only if supported
      navigator.serviceWorker.ready
        .then(() => {
          console.log("Service worker is active and ready.");
        })
        .catch((error) => {
          console.error("Service worker readiness check failed:", error);
        });
    } else {
      console.warn("Service workers are not supported in this environment.");
    }
  }, []);

  return (
    <main className={tofino.className}>
      <Component {...pageProps} />
      <Analytics />
      <SpeedInsights />
    </main>
  );
}