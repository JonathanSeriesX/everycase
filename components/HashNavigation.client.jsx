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
      anchor.blur();

      // On touch the "#" shows faintly at rest (no hover to reveal it on demand).
      // Once tapped it has served its purpose: mark it so CSS hides it for good.
      // We never remove the class, so the dismiss runs exactly once — there is no
      // sticky hover/focus to bring it back and re-play the fade. (On pointer
      // devices this class has no effect; hover/focus-visible drive the reveal.)
      if (anchor.classList.contains("subheading-anchor")) {
        anchor.classList.add("is-tapped");
      }

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
      if (target) {
        // scrollIntoView() ignores scroll-padding-top on Safari iOS, causing
        // the heading to land behind the sticky navbar (looks like overshoot).
        // Read the actual navbar height and scroll manually instead.
        const navbar = document.querySelector(".nextra-navbar");
        const offset = navbar ? navbar.getBoundingClientRect().height : 0;
        const top = target.getBoundingClientRect().top + window.scrollY - offset - 16;
        window.scrollTo({ top, left: window.scrollX });
      }

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
