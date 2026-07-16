"use client";

import { useRef, useState, type ReactNode } from "react";
import { useDismiss } from "../lib/useDismiss";
import { ChevronRightIcon } from "./icons";
import styles from "../styles/Settings.module.css";

export interface DropdownOption {
  value: string;
  label: ReactNode;
}

/**
 * Listbox popover (trigger button + ✓-marked options) for settings controls.
 * Opens downward, below the trigger.
 */
export default function DropdownMenu({
  ariaLabel,
  value,
  options,
  onSelect,
  buttonContent,
  scrollable = false,
}: {
  ariaLabel: string;
  value: string;
  options: DropdownOption[];
  onSelect: (value: string) => void;
  buttonContent: ReactNode;
  scrollable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState<"down" | "up">("down");
  const [anchor, setAnchor] = useState<"right" | "left">("right");
  const containerRef = useRef<HTMLSpanElement>(null);

  // Open upward when the viewport has no room below the trigger (the list
  // is capped at ~21rem, ≈340px). Anchor to whichever trigger corner keeps
  // the list on-screen: right-anchored (extending left) by default, but a
  // trigger sitting near the left edge — wrapped settings rows on narrow
  // viewports — flips to left-anchored so the list extends right instead
  // of crossing the screen boundary.
  const toggleOpen = () => {
    if (!open) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const spaceBelow = window.innerHeight - rect.bottom;
        setDirection(spaceBelow < 360 && rect.top > spaceBelow ? "up" : "down");
        const listWidth = 240; // generous estimate; max-width caps overflow
        setAnchor(rect.right - listWidth < 8 ? "left" : "right");
      }
    }
    setOpen((wasOpen) => !wasOpen);
  };

  // Close on outside interaction / Escape.
  useDismiss(containerRef, () => setOpen(false), open);

  const listClassName = [
    styles.menuList,
    scrollable ? styles.menuListScroll : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={styles.menu} ref={containerRef}>
      <button
        type="button"
        className={styles.menuButton}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={toggleOpen}
      >
        {buttonContent}
        <ChevronRightIcon
          aria-hidden="true"
          className={styles.menuChevron}
          data-open={open || undefined}
        />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={ariaLabel}
          className={listClassName}
          data-direction={direction}
          data-anchor={anchor}
        >
          {options.map((option) => (
            <li key={option.value} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={option.value === value}
                data-active={option.value === value}
                className={styles.menuOption}
                onClick={() => {
                  setOpen(false);
                  onSelect(option.value);
                }}
              >
                <span className={styles.menuCheck} aria-hidden="true">
                  {option.value === value ? "✓" : ""}
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
