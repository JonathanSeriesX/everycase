"use client";

import { useEffect, useState } from "react";
import { InfoIcon } from "./icons";
import chrome from "../styles/Chrome.module.css";

// Every case image on the site is served as AVIF; a browser without the codec
// renders nothing at all. We surface this only when we are certain the codec
// is missing — a 1×1 AVIF that decodes means support, a decode error means it
// is absent. Until we know (SSR, or the probe hasn't settled) we show nothing,
// so a supported browser never flashes the warning.
const AVIF_PROBE =
  "data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACJtZGF0EgAKCBgABogQEDQgMgkQAAAAB8dSLfI=";

export default function AvifCallout() {
  // null = unknown (don't render), false = confirmed unsupported (render).
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (!cancelled) setSupported(img.width > 0 && img.height > 0);
    };
    img.onerror = () => {
      if (!cancelled) setSupported(false);
    };
    img.src = AVIF_PROBE;
    return () => {
      cancelled = true;
    };
  }, []);

  if (supported !== false) return null;

  return (
    <div className={chrome.callout} role="alert">
      <span className={chrome.calloutIcon} aria-hidden="true">
        <InfoIcon />
      </span>
      <div>
        Finest Woven is best enjoyed on a web browser with AVIF image codec
        support. AVIF is supported on iOS&nbsp;16, Android&nbsp;12,
        Safari&nbsp;16.4 (macOS Big&nbsp;Sur and newer), and Chrome&nbsp;85 and
        newer.
      </div>
    </div>
  );
}
