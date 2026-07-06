"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useSession } from "../lib/auth-client";
import CaseImage from "./CaseImage.client";
import styles from "../styles/CaseInfoCards.module.css";

type Status = "owned" | "wanted" | null;

interface DeviceOption {
  deviceId: string;
  model: string;
  colour: string;
  thumbnail: string;
}

/**
 * The "Your collection" info card on case pages: owned/wanted toggles for
 * this SKU. Pages stay fully static — collection state is fetched here on
 * the client, and only for signed-in visitors.
 *
 * Owned cases always belong to a device. Pressing "I own it" on the first
 * case that fits none of your registered devices opens a small window
 * asking which device you have; picking one registers the device and only
 * then adds the case (cancelling adds nothing). Every later compatible
 * case is owned with a single tap — no windows — and grouping is derived
 * server-side (see lib/collectionItems). The window is single-pick and
 * lives in a portal because the card's backdrop-filter would otherwise
 * trap and clip a fixed-position child.
 */
export default function CollectionCard({ sku }: { sku: string }) {
  const { data: session } = useSession();
  const [status, setStatus] = useState<Status>(null);
  const [loaded, setLoaded] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [ownedIds, setOwnedIds] = useState<string[]>([]);
  const [compatible, setCompatible] = useState<DeviceOption[]>([]);
  const [windowOpen, setWindowOpen] = useState(false);
  const userId = session?.user.id;

  const fetchDevices = (cancelled?: () => boolean) =>
    fetch(`/api/devices?sku=${encodeURIComponent(sku)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data || cancelled?.()) return;
        setOwnedIds(data.devices.map((d: DeviceOption) => d.deviceId));
        setCompatible(data.compatible);
      })
      .catch(() => {});

  useEffect(() => {
    if (!userId) {
      setStatus(null);
      setLoaded(false);
      setOwnedIds([]);
      setCompatible([]);
      setWindowOpen(false);
      return;
    }
    let cancelled = false;
    fetch(`/api/collection?skus=${encodeURIComponent(sku)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setStatus(data.items[0]?.status ?? null);
        setLoaded(true);
      })
      .catch(() => {});
    fetchDevices(() => cancelled);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, sku]);

  useEffect(() => {
    if (!windowOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setWindowOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [windowOpen]);

  const ownsCompatible = useMemo(
    () => compatible.some((d) => ownedIds.includes(d.deviceId)),
    [compatible, ownedIds],
  );
  const modelGroups = useMemo(() => {
    const byModel = new Map<string, DeviceOption[]>();
    for (const device of compatible) {
      const group = byModel.get(device.model);
      if (group) group.push(device);
      else byModel.set(device.model, [device]);
    }
    return [...byModel.entries()];
  }, [compatible]);

  const saveStatus = async (target: Status) => {
    const previous = status;
    setStatus(target);
    try {
      const res = target
        ? await fetch("/api/collection", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sku, status: target }),
          })
        : await fetch(`/api/collection?sku=${encodeURIComponent(sku)}`, {
            method: "DELETE",
          });
      if (!res.ok) throw new Error();
      // Shrinking the owned set may have pruned a device server-side.
      if (target !== "owned") fetchDevices();
      return true;
    } catch {
      setStatus(previous);
      setNote("Something went wrong — try again.");
      return false;
    }
  };

  const toggle = (next: Exclude<Status, null>) => {
    if (!userId) {
      setNote("Sign in with the account button above to track your collection.");
      return;
    }
    setNote(null);
    const target: Status = status === next ? null : next;
    // Owned cases always belong to a device: the first case that fits none
    // of the registered ones must pick a device before it can be owned.
    if (target === "owned" && compatible.length > 0 && !ownsCompatible) {
      setWindowOpen(true);
      return;
    }
    if (target !== "owned") setWindowOpen(false);
    void saveStatus(target);
  };

  const pick = async (deviceId: string) => {
    setWindowOpen(false);
    const previous = ownedIds;
    setOwnedIds((ids) => [...ids, deviceId]);
    try {
      const res = await fetch("/api/devices", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setOwnedIds(previous);
      setNote("Something went wrong — try again.");
      return;
    }
    await saveStatus("owned");
  };

  const chip = (
    value: Exclude<Status, null>,
    label: string,
    activeLabel: string,
  ) => (
    <button
      type="button"
      className={`${styles.chip} ${styles.actionChip} ${styles.collectionChip}`}
      data-active={status === value}
      aria-pressed={status === value}
      disabled={Boolean(userId) && !loaded}
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
                The case goes under your device on the collection page.
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
              <button
                type="button"
                className={`${styles.chip} ${styles.actionChip} ${styles.windowDone}`}
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
