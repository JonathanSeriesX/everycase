"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * Standard popover dismissal: a mousedown outside `ref`, or Escape anywhere,
 * calls `onDismiss`. Listeners are attached only while `enabled` (usually the
 * popover's open state), and always read the latest `onDismiss` — callers can
 * pass a fresh closure every render without re-subscribing.
 */
export function useDismiss(
  ref: RefObject<HTMLElement | null>,
  onDismiss: () => void,
  enabled: boolean,
) {
  const latest = useRef(onDismiss);
  useEffect(() => {
    latest.current = onDismiss;
  });

  useEffect(() => {
    if (!enabled) return;
    const onDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) latest.current();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") latest.current();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [enabled, ref]);
}
