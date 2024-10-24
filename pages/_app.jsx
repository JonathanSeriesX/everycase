import "nextra-theme-docs/style.css";
import "/styles/global.css";
import "lightbox.js-react/dist/index.css"
import { initLightboxJS } from 'lightbox.js-react';
import React, { useEffect } from 'react';
import { usePreserveScroll } from '/components/ScrollPreserve.tsx';

export default function Nextra({ Component, pageProps }) {
  usePreserveScroll();
  useEffect(() => {
    initLightboxJS(process.env.NEXT_PUBLIC_LIGHTBOX_LICENSE_KEY, "individual");
  }, []);

  return (
    <>
      <Component {...pageProps} />
    </>
  );
}
