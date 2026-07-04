"use client";

import { useEffect, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { useTheme } from "next-themes";
import DropdownMenu from "./DropdownMenu.client";
import {
  SunIcon,
  MoonIcon,
  MoonFilledIcon,
  CircleHalfIcon,
} from "./icons";
import chrome from "../styles/Chrome.module.css";

const emptySubscribe = () => () => {};

const OPTIONS = [
  { value: "light", label: "Light", Icon: SunIcon },
  { value: "dark", label: "Dark", Icon: MoonIcon },
  { value: "black", label: "Pitch Black", Icon: MoonFilledIcon },
  { value: "system", label: "System", Icon: CircleHalfIcon },
];

// Page background per theme — matches --site-bg in globals.css. Android
// Chrome repaints its toolbar from theme-color mutations; WebKit ignores
// attribute mutations entirely, so this is inert on iOS/macOS Safari (which
// keep following the static media-scoped metas — and the macOS tab-bar
// overflow depends on the value matching the page background anyway).
const THEME_COLOR: Record<string, string> = {
  light: "rgb(250,250,250)",
  dark: "rgb(17,17,17)",
  black: "rgb(0,0,0)",
};

export default function ThemeMenu() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  // Theme is unknown until hydration; render a stable placeholder to avoid a
  // mismatch flash.
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  // Keep Chrome's toolbar following the site theme. Mutation only — never
  // remove or insert meta nodes (React owns them; removal crashes the next
  // route reconciliation).
  useEffect(() => {
    if (!mounted) return;
    const color =
      THEME_COLOR[theme === "black" ? "black" : (resolvedTheme ?? "")] ??
      THEME_COLOR.light;
    for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
      meta.setAttribute("content", color);
    }
  }, [mounted, theme, resolvedTheme]);

  // Cross-fade between themes with the View Transitions API — except on
  // iOS, where the snapshot animation makes Safari 26 paint an opaque plate
  // behind its glass bottom pill. iOS switches instantly (all transitions
  // suppressed for the swap); everyone else gets the snapshot fade.
  const pickTheme = (next: string) => {
    if (next === theme) return;
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

  const current = mounted
    ? OPTIONS.find((option) => option.value === theme)
    : null;
  const label = current ? current.label : "…";
  const CurrentIcon = current?.Icon;

  return (
    <DropdownMenu
      ariaLabel="Theme"
      value={theme ?? ""}
      options={OPTIONS.map((option) => ({
        value: option.value,
        label: option.label,
      }))}
      onSelect={pickTheme}
      buttonClassName={chrome.footerAction}
      buttonContent={
        <>
          Theme: {label}{" "}
          <span className={chrome.themeIcon} aria-hidden="true">
            {CurrentIcon && <CurrentIcon />}
          </span>
        </>
      }
    />
  );
}
