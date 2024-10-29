import "nextra-theme-docs/style.css";
import "/styles/global.css";
import "lightbox.js-react/dist/index.css";
import { initLightboxJS } from "lightbox.js-react";
import { NextUIProvider } from "@nextui-org/react"; // Import NextUIProvider
import React, { useEffect } from "react";
import { usePreserveScroll } from "/components/ScrollPreserve.tsx";
import { Analytics } from "@vercel/analytics/react";

export default function Nextra({ Component, pageProps }) {
  usePreserveScroll();

  useEffect(() => {
    initLightboxJS(
      process.env.NEXT_PUBLIC_LIGHTBOX_LICENSE_KEY,
      "individual"
    );
  }, []);

  return (
    <NextUIProvider> {/* Wrap everything with NextUIProvider */}
      <Component {...pageProps} />
      <Analytics />
    </NextUIProvider>
  );
}