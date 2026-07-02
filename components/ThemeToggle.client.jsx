"use client";

import { useEffect, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { useTheme } from "next-themes";
import { SunIcon, MoonIcon } from "./icons";
import chrome from "../styles/Chrome.module.css";

const emptySubscribe = () => () => {};

// The navbar's composited colour per scheme — the browser chrome (Safari tab
// bar, iOS status bar) is painted to match it. Keep in sync with .navbar in
// Chrome.module.css and the pre-paint script in app/layout.jsx.
const THEME_COLOR = {
  light: "rgb(252,248,250)",
  dark: "rgb(17,17,20)",
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

  // The SSR theme-color metas are keyed to prefers-color-scheme; when the
  // theme changes they must follow the SITE theme instead. WebKit does not
  // reliably re-evaluate media-scoped metas on attribute mutation, so the
  // pair is replaced with one fresh meta node — parse-time insertion always
  // triggers a chrome repaint, in Safari included.
  useEffect(() => {
    if (!mounted) return;
    const color = THEME_COLOR[resolvedTheme] ?? THEME_COLOR.light;
    for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
      meta.remove();
    }
    const meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.content = color;
    document.head.appendChild(meta);
  }, [mounted, resolvedTheme]);

  const isDark = mounted && resolvedTheme === "dark";

  // Cross-fade between themes with the View Transitions API: the browser
  // snapshots old and new and fades them as one image, so every colour moves
  // in sync. Browsers without support just switch instantly.
  const switchTheme = () => {
    const next = isDark ? "light" : "dark";
    if (typeof document.startViewTransition === "function") {
      document.startViewTransition(() => {
        flushSync(() => setTheme(next));
      });
    } else {
      setTheme(next);
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
