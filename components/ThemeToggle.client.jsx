"use client";

import { useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { useTheme } from "next-themes";
import { SunIcon, MoonIcon } from "./icons";
import chrome from "../styles/Chrome.module.css";

const emptySubscribe = () => () => {};

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // Theme is unknown until hydration; render a stable placeholder to avoid a
  // mismatch flash.
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const isDark = mounted && resolvedTheme === "dark";

  // Cross-fade between themes with the View Transitions API — except on
  // iOS, where the snapshot animation makes Safari 26 paint an opaque plate
  // behind its glass bottom pill. iOS switches instantly (all transitions
  // suppressed for the swap); everyone else gets the snapshot fade.
  const switchTheme = () => {
    const next = isDark ? "light" : "dark";
    const isIOS =
      /iPhone|iPad|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (!isIOS && typeof document.startViewTransition === "function") {
      document.startViewTransition(() => {
        flushSync(() => setTheme(next));
      });
    } else {
      const root = document.documentElement;
      root.classList.add("no-theme-fade");
      setTheme(next);
      window.setTimeout(() => root.classList.remove("no-theme-fade"), 60);
    }
  };

  return (
    <button
      type="button"
      className={chrome.iconButton}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={switchTheme}
    >
      {isDark ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}
