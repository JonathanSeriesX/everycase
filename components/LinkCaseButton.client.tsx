"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAddDevice, type DeviceOption } from "../lib/collectionQueries";
import DeviceWindow, {
  GroupedDeviceRows,
  devicePickerTitle,
  groupByModel,
} from "./DeviceWindow.client";
import styles from "../styles/DeviceSection.module.css";

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

  const addDevice = useAddDevice({
    onSuccess: () => router.refresh(),
    onError: () => setNote("Something went wrong — try again."),
  });

  const modelGroups = useMemo(() => groupByModel(options), [options]);

  const pick = (deviceId: string) => {
    setWindowOpen(false);
    setNote(null);
    addDevice.mutate({ deviceId });
  };

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
      {windowOpen && (
        <DeviceWindow
          title={devicePickerTitle(modelGroups)}
          note="The case moves under your device on this page."
          onClose={() => setWindowOpen(false)}
        >
          <GroupedDeviceRows groups={modelGroups} onPick={pick} />
        </DeviceWindow>
      )}
    </>
  );
}
