"use client";

import { useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { useTheme } from "next-themes";
import {
  SunIcon,
  MoonIcon,
  MoonFilledIcon,
  CircleHalfIcon,
} from "./icons";
import styles from "../styles/Settings.module.css";

const emptySubscribe = () => () => {};

const OPTIONS = [
  { value: "light", label: "Light", Icon: SunIcon },
  { value: "dark", label: "Dark", Icon: MoonIcon },
  { value: "black", label: "Pitch Black", Icon: MoonFilledIcon },
  { value: "system", label: "System", Icon: CircleHalfIcon },
];

/** Segmented theme picker on the settings page. */
export default function ThemeControl() {
  const { theme, setTheme } = useTheme();
  // Theme is unknown until hydration; render no active segment before then.
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

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

  return (
    <div className={styles.segmented} role="radiogroup" aria-label="Theme">
      {OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={mounted && theme === value}
          data-active={mounted && theme === value}
          className={styles.segment}
          onClick={() => pickTheme(value)}
        >
          <Icon aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  );
}
