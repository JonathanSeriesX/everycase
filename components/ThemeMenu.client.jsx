"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { useTheme } from "next-themes";
import chrome from "../styles/Chrome.module.css";

const emptySubscribe = () => () => {};

const OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "black", label: "Pitch Black" },
  { value: "system", label: "System" },
];

// Page background per theme — matches --site-bg in globals.css. Android
// Chrome repaints its toolbar from theme-color mutations; WebKit ignores
// attribute mutations entirely, so this is inert on iOS/macOS Safari (which
// keep following the static media-scoped metas — and the macOS tab-bar
// overflow depends on the value matching the page background anyway).
const THEME_COLOR = {
  light: "rgb(250,250,250)",
  dark: "rgb(17,17,17)",
  black: "rgb(0,0,0)",
};

export default function ThemeMenu() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
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
      THEME_COLOR[theme === "black" ? "black" : resolvedTheme] ??
      THEME_COLOR.light;
    for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
      meta.setAttribute("content", color);
    }
  }, [mounted, theme, resolvedTheme]);

  // Close on outside interaction / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Cross-fade between themes with the View Transitions API — except on
  // iOS, where the snapshot animation makes Safari 26 paint an opaque plate
  // behind its glass bottom pill. iOS switches instantly (all transitions
  // suppressed for the swap); everyone else gets the snapshot fade.
  const pickTheme = (next) => {
    setOpen(false);
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

  const current = OPTIONS.find((option) => option.value === theme);
  const label = mounted && current ? current.label : "…";

  return (
    <span className={chrome.themeMenu} ref={containerRef}>
      <button
        type="button"
        className={chrome.footerAction}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
      >
        Theme: {label} <span aria-hidden="true">▴</span>
      </button>
      {open && (
        <ul role="listbox" aria-label="Theme" className={chrome.themeMenuList}>
          {OPTIONS.map((option) => (
            <li key={option.value} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={option.value === theme}
                data-active={option.value === theme}
                className={chrome.themeOption}
                onClick={() => pickTheme(option.value)}
              >
                <span className={chrome.themeOptionCheck} aria-hidden="true">
                  {option.value === theme ? "✓" : ""}
                </span>
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </span>
  );
}
