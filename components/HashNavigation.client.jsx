"use client";

import { useEffect } from "react";

/**
 * Keep same-page anchors out of the browser's Back stack.
 *
 * Nextra renders TOC and heading permalink entries as native hash links. Each
 * click normally pushes a history entry, and those entries can leave Next's
 * rendered route out of sync with the URL when the user returns from a case
 * page. Replacing the current entry preserves deep links without accumulating
 * stale route entries.
 */
export default function HashNavigation() {
  useEffect(() => {
    const handleClick = (event) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        !(event.target instanceof Element)
      ) {
        return;
      }

      const anchor = event.target.closest('a[href^="#"]');
      if (!anchor) return;

      const url = new URL(anchor.href, window.location.href);
      if (
        !url.hash ||
        url.origin !== window.location.origin ||
        url.pathname !== window.location.pathname ||
        url.search !== window.location.search
      ) {
        return;
      }

      event.preventDefault();

      const oldURL = window.location.href;
      window.history.replaceState(
        window.history.state,
        "",
        `${url.pathname}${url.search}${url.hash}`,
      );

      let target;
      try {
        target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      } catch {
        target = document.getElementById(url.hash.slice(1));
      }
      target?.scrollIntoView();

      if (oldURL !== window.location.href) {
        window.dispatchEvent(
          new HashChangeEvent("hashchange", {
            oldURL,
            newURL: window.location.href,
          }),
        );
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
