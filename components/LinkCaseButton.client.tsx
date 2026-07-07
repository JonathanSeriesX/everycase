"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useAddDevice, type DeviceOption } from "../lib/collectionQueries";
import CaseImage from "./CaseImage.client";
import { PhoneSymbol } from "./icons";
import styles from "../styles/DeviceSection.module.css";
import windowStyles from "../styles/CaseInfoCards.module.css";

/**
 * "Link" on an unlinked owned case tile: opens the same "which device do
 * you have?" window as case pages, registers the pick, and the case
 * regroups under it (grouping is derived, so nothing else is written).
 * Rendered only when the catalogue actually has devices this case fits.
 */
export default function LinkCaseButton({
  label,
  options,
}: {
  label: string;
  /** Every device this case fits, in catalogue order. */
  options: DeviceOption[];
}) {
  const router = useRouter();
  const [windowOpen, setWindowOpen] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (!windowOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setWindowOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [windowOpen]);

  const addDevice = useAddDevice({
    onSuccess: () => router.refresh(),
    onError: () => setNote("Something went wrong — try again."),
  });

  const modelGroups = useMemo(() => {
    const byModel = new Map<string, DeviceOption[]>();
    for (const option of options) {
      const group = byModel.get(option.model);
      if (group) group.push(option);
      else byModel.set(option.model, [option]);
    }
    return [...byModel.entries()];
  }, [options]);

  const pick = (deviceId: string) => {
    setWindowOpen(false);
    setNote(null);
    addDevice.mutate({ deviceId });
  };

  const windowTitle =
    modelGroups.length === 1
      ? `Which ${modelGroups[0][0]} do you have?`
      : "Which device do you have?";

  return (
    <>
      <button
        type="button"
        className={styles.tileButton}
        disabled={addDevice.isPending}
        onClick={() => setWindowOpen(true)}
        aria-label={`Link ${label} to a device`}
      >
        {addDevice.isPending ? "Linking…" : "Link"}
      </button>
      {note && (
        <p className={styles.tileNote} role="status">
          {note}
        </p>
      )}
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
              aria-label={windowTitle}
            >
              <span className={windowStyles.label}>{windowTitle}</span>
              <p className={windowStyles.collectionNote}>
                The case moves under your device on this page.
              </p>
              <div className={windowStyles.deviceList}>
                {modelGroups.map(([model, devices]) => (
                  <div key={model} className={windowStyles.deviceListGroup}>
                    {modelGroups.length > 1 && (
                      <span className={windowStyles.skuGroupLabel}>{model}</span>
                    )}
                    {devices.map((option) => (
                      <button
                        key={option.deviceId}
                        type="button"
                        className={windowStyles.deviceRow}
                        onClick={() => pick(option.deviceId)}
                      >
                        <span
                          className={windowStyles.deviceThumb}
                          aria-hidden="true"
                        >
                          {option.thumbnail ? (
                            <CaseImage code={option.thumbnail} alt="" />
                          ) : (
                            <PhoneSymbol
                              className={windowStyles.deviceThumbFallback}
                            />
                          )}
                        </span>
                        <span className={windowStyles.deviceRowLabel}>
                          {option.colour}
                        </span>
                      </button>
                    ))}
                  </div>
                ))}
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
    </>
  );
}
