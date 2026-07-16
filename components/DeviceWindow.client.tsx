"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { DeviceOption } from "../lib/collectionQueries";
import CaseImage from "./CaseImage.client";
import { PhoneSymbol } from "./icons";
import styles from "../styles/CaseInfoCards.module.css";

/**
 * The shared "Which device do you have?" window — one modal look for the
 * case page's own-it flow (CollectionCard), the collection page's "Link"
 * button (LinkCaseButton), and its "Change colour" control (DeviceActions).
 *
 * Render it only while open; Escape / a backdrop tap call `onClose`. It is
 * single-pick and lives in a portal because the opener cards' backdrop-filter
 * would otherwise trap and clip a fixed-position child. `children` is the
 * list body (usually <GroupedDeviceRows> or bare <DeviceRow>s); `footer`
 * replaces the default lone Cancel button.
 */
export default function DeviceWindow({
  title,
  note,
  onClose,
  footer,
  children,
}: {
  title: string;
  note?: string;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close.current();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return createPortal(
    <div
      className={styles.deviceOverlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={styles.deviceWindow}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <span className={styles.label}>{title}</span>
        {note && <p className={styles.collectionNote}>{note}</p>}
        <div className={styles.deviceList}>{children}</div>
        {footer ?? (
          <button
            type="button"
            className={`${styles.chip} ${styles.actionChip} ${styles.windowDone}`}
            onClick={onClose}
          >
            Cancel
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}

/** One pickable device: thumbnail (or the phone placeholder) + label. */
export function DeviceRow({
  thumbnail,
  label,
  disabled = false,
  onClick,
}: {
  thumbnail: string;
  label: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={styles.deviceRow}
      disabled={disabled}
      onClick={onClick}
    >
      <span className={styles.deviceThumb} aria-hidden="true">
        {thumbnail ? (
          <CaseImage code={thumbnail} alt="" />
        ) : (
          <PhoneSymbol className={styles.deviceThumbFallback} />
        )}
      </span>
      <span className={styles.deviceRowLabel}>{label}</span>
    </button>
  );
}

/** Devices bucketed by model, in first-seen order, as [model, devices]. */
export function groupByModel(options: DeviceOption[]): [string, DeviceOption[]][] {
  const byModel = new Map<string, DeviceOption[]>();
  for (const option of options) {
    const group = byModel.get(option.model);
    if (group) group.push(option);
    else byModel.set(option.model, [option]);
  }
  return [...byModel.entries()];
}

/** Window title: name the model when there is only one to ask about. */
export function devicePickerTitle(groups: [string, DeviceOption[]][]): string {
  return groups.length === 1
    ? `Which ${groups[0][0]} do you have?`
    : "Which device do you have?";
}

/** The window body for model-grouped choices: a labelled group per model
    (the label is dropped when a single model needs no introduction). */
export function GroupedDeviceRows({
  groups,
  onPick,
}: {
  groups: [string, DeviceOption[]][];
  onPick: (deviceId: string) => void;
}) {
  return (
    <>
      {groups.map(([model, devices]) => (
        <div key={model} className={styles.deviceListGroup}>
          {groups.length > 1 && (
            <span className={styles.skuGroupLabel}>{model}</span>
          )}
          {devices.map((device) => (
            <DeviceRow
              key={device.deviceId}
              thumbnail={device.thumbnail}
              label={device.colour}
              onClick={() => onPick(device.deviceId)}
            />
          ))}
        </div>
      ))}
    </>
  );
}
