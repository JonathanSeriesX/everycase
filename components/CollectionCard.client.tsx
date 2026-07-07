"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useSession } from "../lib/auth-client";
import {
  useAddDevice,
  useCaseStatus,
  useDevices,
  useSetCaseStatus,
  type CollectionStatus,
} from "../lib/collectionQueries";
import CaseImage from "./CaseImage.client";
import styles from "../styles/CaseInfoCards.module.css";

/**
 * The "Your collection" info card on case pages: owned/wanted toggles for
 * this SKU. Pages stay fully static — collection state comes through the
 * shared query cache (lib/collectionQueries), and only for signed-in
 * visitors.
 *
 * Pressing "I own it" on a case that fits none of your registered devices
 * opens a small window asking which device you have; picking one registers
 * the device (it then stays until you remove it on the collection page) and
 * adds the case. "Skip" owns the case without a device — it lands in the
 * collection page's "not linked to a device" section. Every later
 * compatible case is owned with a single tap — no windows — and grouping is
 * derived server-side (see lib/collectionItems). The window is single-pick
 * and lives in a portal because the card's backdrop-filter would otherwise
 * trap and clip a fixed-position child.
 */
export default function CollectionCard({ sku }: { sku: string }) {
  const { data: session } = useSession();
  const userId = session?.user.id;
  const signedIn = Boolean(userId);
  const [note, setNote] = useState<string | null>(null);
  const [windowOpen, setWindowOpen] = useState(false);

  const statusQuery = useCaseStatus(sku, signedIn);
  const devicesQuery = useDevices(sku, signedIn);
  const status = signedIn ? (statusQuery.data ?? null) : null;
  const compatible = useMemo(
    () => devicesQuery.data?.compatible ?? [],
    [devicesQuery.data],
  );
  const ownedIds = useMemo(
    () => new Set(devicesQuery.data?.devices.map((d) => d.deviceId)),
    [devicesQuery.data],
  );

  const failNote = () => setNote("Something went wrong — try again.");
  const setStatus = useSetCaseStatus(sku, { onError: failNote });
  const addDevice = useAddDevice({
    onError: failNote,
    // Only own the case once its device is actually registered.
    onSuccess: () => setStatus.mutate("owned"),
  });

  useEffect(() => {
    if (!windowOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setWindowOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [windowOpen]);

  const ownsCompatible = useMemo(
    () => compatible.some((d) => ownedIds.has(d.deviceId)),
    [compatible, ownedIds],
  );
  const modelGroups = useMemo(() => {
    const byModel = new Map<string, typeof compatible>();
    for (const device of compatible) {
      const group = byModel.get(device.model);
      if (group) group.push(device);
      else byModel.set(device.model, [device]);
    }
    return [...byModel.entries()];
  }, [compatible]);

  const toggle = (next: Exclude<CollectionStatus, null>) => {
    if (!signedIn) {
      setNote("Sign in with the account button above to track your collection.");
      return;
    }
    setNote(null);
    const target: CollectionStatus = status === next ? null : next;
    // First case that fits none of the registered devices: offer to pick
    // one (or Skip and own the case unlinked). A single compatible device
    // (AirTag, Apple Pencil, MagSafe Accessories) needs no asking — the
    // collection page groups such cases under it automatically.
    if (target === "owned" && compatible.length > 1 && !ownsCompatible) {
      setWindowOpen(true);
      return;
    }
    if (target !== "owned") setWindowOpen(false);
    setStatus.mutate(target);
  };

  const pick = (deviceId: string) => {
    setWindowOpen(false);
    addDevice.mutate({ deviceId });
  };

  const skip = () => {
    setWindowOpen(false);
    setStatus.mutate("owned");
  };

  const chip = (
    value: Exclude<CollectionStatus, null>,
    label: string,
    activeLabel: string,
  ) => (
    <button
      type="button"
      className={`${styles.chip} ${styles.actionChip} ${styles.collectionChip}`}
      data-active={status === value}
      aria-pressed={status === value}
      disabled={signedIn && statusQuery.isPending}
      onClick={() => toggle(value)}
    >
      {status === value ? activeLabel : label}
    </button>
  );

  const windowTitle =
    modelGroups.length === 1
      ? `Which ${modelGroups[0][0]} do you have?`
      : "Which device do you have?";

  return (
    <div className={styles.card} data-pagefind-ignore>
      <span className={styles.label}>Your collection</span>
      <div className={`${styles.chipRow} ${styles.collectionRow}`}>
        {chip("owned", "I own it", "Owned")}
        {chip("wanted", "I want it", "Wishlisted")}
      </div>
      {note && <p className={styles.collectionNote}>{note}</p>}
      {windowOpen &&
        createPortal(
          <div
            className={styles.deviceOverlay}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setWindowOpen(false);
            }}
          >
            <div
              className={styles.deviceWindow}
              role="dialog"
              aria-modal="true"
              aria-label={windowTitle}
            >
              <span className={styles.label}>{windowTitle}</span>
              <p className={styles.collectionNote}>
                The case goes under your device on the collection page — or
                skip, and it stays unlinked.
              </p>
              <div className={styles.deviceList}>
                {modelGroups.map(([model, devices]) => (
                  <div key={model} className={styles.deviceListGroup}>
                    {modelGroups.length > 1 && (
                      <span className={styles.skuGroupLabel}>{model}</span>
                    )}
                    {devices.map((device) => (
                      <button
                        key={device.deviceId}
                        type="button"
                        className={styles.deviceRow}
                        onClick={() => pick(device.deviceId)}
                      >
                        <span className={styles.deviceThumb} aria-hidden="true">
                          {device.thumbnail && (
                            <CaseImage code={device.thumbnail} alt="" />
                          )}
                        </span>
                        <span className={styles.deviceRowLabel}>
                          {device.colour}
                        </span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
              <div className={styles.windowActions}>
                <button
                  type="button"
                  className={`${styles.chip} ${styles.actionChip}`}
                  onClick={skip}
                >
                  Skip
                </button>
                <button
                  type="button"
                  className={`${styles.chip} ${styles.actionChip}`}
                  onClick={() => setWindowOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
