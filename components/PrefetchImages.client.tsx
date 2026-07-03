"use client";

import { useEffect } from "react";

/**
 * Quietly warms the browser cache with images the reader is likely to see
 * next (e.g. the grids one click away from the home page). Waits until the
 * page's own load has finished, then fetches everything at low priority —
 * it never competes with visible content.
 */
export default function PrefetchImages({ urls }: { urls: string[] }) {
  useEffect(() => {
    let cancelled = false;
    const start = () => {
      if (cancelled) return;
      for (const url of urls) {
        const img = new window.Image();
        img.fetchPriority = "low";
        img.decoding = "async";
        img.src = url;
      }
    };
    if (document.readyState === "complete") {
      start();
      return;
    }
    window.addEventListener("load", start, { once: true });
    return () => {
      cancelled = true;
      window.removeEventListener("load", start);
    };
  }, [urls]);

  return null;
}
