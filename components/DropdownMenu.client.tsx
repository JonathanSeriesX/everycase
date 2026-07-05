"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
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
  const containerRef = useRef<HTMLSpanElement>(null);

  // Open upward when the viewport has no room below the trigger (the list
  // is capped at ~21rem, ≈340px).
  const toggleOpen = () => {
    if (!open) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const spaceBelow = window.innerHeight - rect.bottom;
        setDirection(spaceBelow < 360 && rect.top > spaceBelow ? "up" : "down");
      }
    }
    setOpen((wasOpen) => !wasOpen);
  };

  // Close on outside interaction / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

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
