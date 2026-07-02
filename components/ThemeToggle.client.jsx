"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { SunIcon, MoonIcon } from "./icons";
import chrome from "../styles/Chrome.module.css";

const emptySubscribe = () => () => {};

// Must match --site-bg in globals.css — the browser chrome (Safari tab bar,
// mobile top bar) follows the page background.
const THEME_COLOR = {
  light: "rgb(250,250,250)",
  dark: "rgb(17,17,17)",
};

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // Theme is unknown until hydration; render a stable placeholder to avoid a
  // mismatch flash.
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  // The SSR theme-color metas are keyed to prefers-color-scheme; a manual
  // toggle must override them at once so the browser bar follows the theme
  // immediately, not the OS setting.
  useEffect(() => {
    if (!mounted) return;
    const color = THEME_COLOR[resolvedTheme] ?? THEME_COLOR.light;
    for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
      meta.setAttribute("content", color);
    }
  }, [mounted, resolvedTheme]);

  const isDark = mounted && resolvedTheme === "dark";
  return (
    <button
      type="button"
      className={chrome.iconButton}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}
