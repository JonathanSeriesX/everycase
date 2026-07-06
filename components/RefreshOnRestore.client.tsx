"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Refetches the page when the browser restores it from the back/forward
 * cache. Collection pages are per-user and mutate from case pages, so a
 * bfcache'd copy (browser Back after "I own it") is silently stale.
 */
export default function RefreshOnRestore() {
  const router = useRouter();
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) router.refresh();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [router]);
  return null;
}
