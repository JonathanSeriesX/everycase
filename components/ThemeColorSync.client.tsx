"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

const emptySubscribe = () => () => {};

// Page background per theme — matches --site-bg in globals.css. Android
// Chrome repaints its toolbar from theme-color mutations; WebKit ignores
// attribute mutations entirely, so this is inert on iOS/macOS Safari (which
// keep following the static media-scoped metas — and the macOS tab-bar
// overflow depends on the value matching the page background anyway).
export const THEME_COLOR: Record<string, string> = {
  light: "rgb(250,250,250)",
  dark: "rgb(17,17,17)",
  black: "rgb(0,0,0)",
};

/**
 * Invisible, mounted in the root layout: keeps Chrome's toolbar following
 * the site theme (including OS scheme flips while theme is "system").
 * Mutation only — never remove or insert meta nodes (React owns them;
 * removal crashes the next route reconciliation).
 */
export default function ThemeColorSync() {
  const { theme, resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!mounted) return;
    const color =
      THEME_COLOR[theme === "black" ? "black" : (resolvedTheme ?? "")] ??
      THEME_COLOR.light;
    for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
      meta.setAttribute("content", color);
    }
  }, [mounted, theme, resolvedTheme]);

  return null;
}
