"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Keeps the collection grid fresh when you return to it — Back from a case
 * page where you tapped "I own it", a bfcache restore, or any soft re-entry —
 * WITHOUT yanking the scroll position around.
 *
 * The grid is a force-dynamic Server Component, so the only way to reflect a
 * change made elsewhere is router.refresh(). But a plain refresh would leave
 * the viewport pinned to the same pixel offset, so newly-added groups above
 * would shove everything down. Instead we continuously remember which device
 * group sits at the top of the viewport, and once the refreshed data commits we
 * pin that same group back where it was — before paint, so there's no jump.
 *
 * Supersedes the old RefreshOnRestore (which only handled the bfcache pageshow
 * case and never touched scroll).
 */

// Survives soft (SPA) navigation, so we can tell a genuine return to the page
// from the very first visit. Reset only on a full document load.
let visitedThisSession = false;

// Sticky navbar height — matches scroll-padding-top in globals.css.
const NAV_OFFSET = 80;
const STORE_KEY = "collection-scroll-anchor";

interface Anchor {
  id: string;
  /** The group's offset from the top of the viewport when it was recorded. */
  top: number;
}

/** The topmost anchored section still visible below the navbar. */
function topAnchor(): Anchor | null {
  const els = document.querySelectorAll<HTMLElement>("[data-collection-anchor]");
  for (const el of els) {
    const rect = el.getBoundingClientRect();
    if (rect.bottom > NAV_OFFSET) {
      const id = el.dataset.collectionAnchor;
      if (id) return { id, top: rect.top };
    }
  }
  return null;
}

function rememberAnchor() {
  const anchor = topAnchor();
  if (!anchor) return;
  try {
    sessionStorage.setItem(STORE_KEY, JSON.stringify(anchor));
  } catch {
    /* storage disabled — anchoring just no-ops */
  }
}

/** Scroll so the remembered section sits exactly where it was pre-refresh. */
function restoreAnchor() {
  let anchor: Anchor | null;
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    anchor = raw ? (JSON.parse(raw) as Anchor) : null;
  } catch {
    return;
  }
  if (!anchor) return;
  const els = document.querySelectorAll<HTMLElement>("[data-collection-anchor]");
  for (const el of els) {
    if (el.dataset.collectionAnchor === anchor.id) {
      const delta = el.getBoundingClientRect().top - anchor.top;
      if (Math.abs(delta) > 1) window.scrollBy(0, delta);
      return;
    }
  }
}

export default function CollectionFreshness({
  signature,
}: {
  /** Fingerprint of the rendered collection; changes when data actually moves. */
  signature: string;
}) {
  const router = useRouter();
  const mounted = useRef(false);

  // Remember the topmost group as the user scrolls, so the anchor is current
  // the moment they leave (and on the final frame before they navigate away).
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(rememberAnchor);
    };
    rememberAnchor();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      rememberAnchor();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Pull fresh server data whenever we RETURN to the page — a soft Back remount
  // within the SPA session, or a bfcache pageshow. The first visit is already
  // fresh, so skip it.
  useEffect(() => {
    if (visitedThisSession) router.refresh();
    else visitedThisSession = true;

    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) router.refresh();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [router]);

  // Whenever the rendered content changes (a refresh brought new data, or an
  // in-page add/remove), pin the tracked group back into place — synchronously,
  // before paint. A no-op when nothing moved above it. Skip the initial mount.
  useLayoutEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    restoreAnchor();
  }, [signature]);

  return null;
}
