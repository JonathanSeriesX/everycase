"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import CaseImage from "./CaseImage.client";
import styles from "../styles/DeviceSection.module.css";
import windowStyles from "../styles/CaseInfoCards.module.css";

const ARM_RESET_TIMEOUT = 3000;

export interface DeviceVariant {
  deviceId: string;
  colour: string;
  thumbnail: string;
}

/**
 * Owner controls on a device tile: two-tap Remove, and "Change colour" —
 * a small window listing the other colours of the same model (picked the
 * wrong one in the case-page window). Changing colour swaps the device
 * document; grouping is derived, so nothing else moves.
 */
export default function DeviceActions({
  deviceId,
  label,
  model,
  variants,
}: {
  deviceId: string;
  label: string;
  model: string;
  /** Every colour of this model, including the current one. */
  variants: DeviceVariant[];
}) {
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [windowOpen, setWindowOpen] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  useEffect(() => {
    if (!windowOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setWindowOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [windowOpen]);

  const remove = async () => {
    if (!armed) {
      setArmed(true);
      clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setArmed(false), ARM_RESET_TIMEOUT);
      return;
    }
    clearTimeout(resetTimer.current);
    setBusy(true);
    try {
      const res = await fetch(
        `/api/devices?deviceId=${encodeURIComponent(deviceId)}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setBusy(false);
      setArmed(false);
    }
  };

  const swap = async (nextId: string) => {
    setWindowOpen(false);
    if (nextId === deviceId) return;
    setBusy(true);
    try {
      const added = await fetch("/api/devices", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: nextId }),
      });
      if (!added.ok) throw new Error();
      await fetch(`/api/devices?deviceId=${encodeURIComponent(deviceId)}`, {
        method: "DELETE",
      });
      router.refresh();
    } catch {
      setBusy(false);
    }
  };

  const others = variants.filter((variant) => variant.deviceId !== deviceId);

  return (
    <div className={styles.tileActions}>
      {others.length > 0 && (
        <button
          type="button"
          className={styles.tileButton}
          disabled={busy}
          onClick={() => setWindowOpen(true)}
        >
          Colour
        </button>
      )}
      <button
        type="button"
        className={styles.tileButton}
        data-armed={armed}
        disabled={busy}
        onClick={remove}
        aria-label={`Remove ${label}`}
      >
        {busy ? "Working…" : armed ? "Sure?" : "Remove"}
      </button>
      {windowOpen &&
        createPortal(
          <div
            className={windowStyles.deviceOverlay}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setWindowOpen(false);
            }}
          >
            <div
              className={windowStyles.deviceWindow}
              role="dialog"
              aria-modal="true"
              aria-label={`Which ${model} do you have?`}
            >
              <span className={windowStyles.label}>
                Which {model} do you have?
              </span>
              <div className={windowStyles.deviceList}>
                <div className={windowStyles.deviceListGroup}>
                  {variants.map((variant) => (
                    <button
                      key={variant.deviceId}
                      type="button"
                      className={windowStyles.deviceRow}
                      disabled={variant.deviceId === deviceId}
                      onClick={() => swap(variant.deviceId)}
                    >
                      <span
                        className={windowStyles.deviceThumb}
                        aria-hidden="true"
                      >
                        {variant.thumbnail && (
                          <CaseImage code={variant.thumbnail} alt="" />
                        )}
                      </span>
                      <span className={windowStyles.deviceRowLabel}>
                        {variant.colour}
                        {variant.deviceId === deviceId && " — current"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                className={`${windowStyles.chip} ${windowStyles.actionChip} ${windowStyles.windowDone}`}
                onClick={() => setWindowOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
