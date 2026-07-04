"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import chrome from "../styles/Chrome.module.css";

export interface DropdownOption {
  value: string;
  label: ReactNode;
}

/**
 * The footer's listbox popover (trigger button + ✓-marked options), shared by
 * the Theme and Currency menus. Opens upward above the trigger.
 */
export default function DropdownMenu({
  ariaLabel,
  value,
  options,
  onSelect,
  buttonClassName,
  buttonContent,
  scrollable = false,
}: {
  ariaLabel: string;
  value: string;
  options: DropdownOption[];
  onSelect: (value: string) => void;
  buttonClassName: string;
  buttonContent: ReactNode;
  scrollable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

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
    chrome.themeMenuList,
    scrollable ? chrome.menuListScroll : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={chrome.themeMenu} ref={containerRef}>
      <button
        type="button"
        className={buttonClassName}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
      >
        {buttonContent}
      </button>
      {open && (
        <ul role="listbox" aria-label={ariaLabel} className={listClassName}>
          {options.map((option) => (
            <li key={option.value} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={option.value === value}
                data-active={option.value === value}
                className={chrome.themeOption}
                onClick={() => {
                  setOpen(false);
                  onSelect(option.value);
                }}
              >
                <span className={chrome.themeOptionCheck} aria-hidden="true">
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
