"use client";

import { useSyncExternalStore } from "react";
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
