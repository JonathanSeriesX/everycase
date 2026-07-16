"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAddDevice, useRemoveDevice } from "../lib/collectionQueries";
import DeviceWindow, { DeviceRow } from "./DeviceWindow.client";
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
 * in one request (PUT with replaceDeviceId); grouping is derived, so
 * nothing else moves.
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
  const [windowOpen, setWindowOpen] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const fail = () => {
    setArmed(false);
    setNote("Something went wrong — try again.");
  };
  // The tiles themselves are server-rendered — refresh redraws the groups.
  const removeDevice = useRemoveDevice({
    onSuccess: () => router.refresh(),
    onError: fail,
  });
  const swapDevice = useAddDevice({
    onSuccess: () => router.refresh(),
    onError: fail,
  });
  const busy = removeDevice.isPending || swapDevice.isPending;

  const remove = () => {
    if (!armed) {
      setArmed(true);
      setNote(null);
      clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setArmed(false), ARM_RESET_TIMEOUT);
      return;
    }
    clearTimeout(resetTimer.current);
    removeDevice.mutate(deviceId);
  };

  const swap = (nextId: string) => {
    setWindowOpen(false);
    if (nextId === deviceId) return;
    setNote(null);
    swapDevice.mutate({ deviceId: nextId, replaceDeviceId: deviceId });
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
        aria-label={`Unlink ${label}`}
      >
        {busy ? "Working…" : armed ? "Sure?" : "Unlink"}
      </button>
      {note && (
        <p className={styles.tileNote} role="status">
          {note}
        </p>
      )}
      {windowOpen && (
        <DeviceWindow
          title={`Which ${model} do you have?`}
          onClose={() => setWindowOpen(false)}
        >
          <div className={windowStyles.deviceListGroup}>
            {variants.map((variant) => (
              <DeviceRow
                key={variant.deviceId}
                thumbnail={variant.thumbnail}
                disabled={variant.deviceId === deviceId}
                onClick={() => swap(variant.deviceId)}
                label={
                  <>
                    {variant.colour}
                    {variant.deviceId === deviceId && " — current"}
                  </>
                }
              />
            ))}
          </div>
        </DeviceWindow>
      )}
    </div>
  );
}
