"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Force the top of the page on forward navigations.
 *
 * Next's App Router scroll handler bails when the new page's top edge is
 * anywhere in [0, viewportHeight] — including the strip hidden behind our
 * sticky navbar. So navigating from a scrolled-down list to a SHORT page (whose
 * carried-over scroll clamps into that strip) leaves the heading tucked under
 * the navbar. It only shows on viewports where the short page can scroll that
 * far, which is why it looked viewport-dependent. `scroll-padding-top` /
 * `scroll-margin-top` can't help because Next returns before it ever calls
 * scrollIntoView.
 *
 * We only act on real forward (push) navigations: Back/Forward restore their
 * saved position, and same-page `#hash` links are handled by HashNavigation.
 * The collection pages own their scroll (CollectionFreshness), so we skip them.
 */
export default function ScrollToTopOnNavigate() {
  const pathname = usePathname();
  const isPop = useRef(false);
  const firstRun = useRef(true);

  useEffect(() => {
    // popstate fires before the pathname effect on Back/Forward — flag it so we
    // leave the browser's restored scroll position alone.
    const onPopState = () => {
      isPop.current = true;
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (firstRun.current) {
      // Initial load: never override the browser (deep links, #hash, refresh).
      firstRun.current = false;
      return;
    }
    if (isPop.current) {
      isPop.current = false;
      return;
    }
    if (window.location.hash) return;
    if (pathname.startsWith("/collection")) return;
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
