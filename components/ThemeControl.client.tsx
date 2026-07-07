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
import DropdownMenu from "./DropdownMenu.client";
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

  const active = mounted
    ? OPTIONS.find((option) => option.value === theme)
    : undefined;

  // Both controls render; CSS shows exactly one — the segmented pill where
  // it fits on a single line, the dropdown on viewports too narrow for it
  // (wrapped segments read as two stray pills — see .themeMenu).
  return (
    <>
      <div
        className={`${styles.segmented} ${styles.themeSegmented}`}
        role="radiogroup"
        aria-label="Theme"
      >
        {OPTIONS.map(({ value, label, Icon }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={mounted && theme === value}
            data-active={mounted && theme === value}
            className={styles.segment}
            onClick={(event) => {
              // Chrome focuses buttons on click, and the global button:focus
              // reset kills the active segment's shadow; Safari never focuses
              // on click, so this blur is a no-op there.
              event.currentTarget.blur();
              pickTheme(value);
            }}
          >
            <Icon aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
      <span className={styles.themeMenu}>
        <DropdownMenu
          ariaLabel="Theme"
          value={active?.value ?? ""}
          options={OPTIONS.map(({ value, label, Icon }) => ({
            value,
            label: (
              <span className={styles.themeMenuOption}>
                <Icon aria-hidden="true" />
                {label}
              </span>
            ),
          }))}
          onSelect={pickTheme}
          buttonContent={
            active ? (
              <span className={styles.themeMenuOption}>
                <active.Icon aria-hidden="true" />
                {active.label}
              </span>
            ) : (
              "Theme"
            )
          }
        />
      </span>
    </>
  );
}
