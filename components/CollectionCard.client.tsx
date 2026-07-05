"use client";

import { useEffect, useState } from "react";
import { useSession } from "../lib/auth-client";
import styles from "../styles/CaseInfoCards.module.css";

type Status = "owned" | "wanted" | null;

/**
 * The "Your collection" info card on case pages: owned/wanted toggles for
 * this SKU. Pages stay fully static — collection state is fetched here on
 * the client, and only for signed-in visitors.
 */
export default function CollectionCard({ sku }: { sku: string }) {
  const { data: session } = useSession();
  const [status, setStatus] = useState<Status>(null);
  const [loaded, setLoaded] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const userId = session?.user.id;

  useEffect(() => {
    if (!userId) {
      setStatus(null);
      setLoaded(false);
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
    return () => {
      cancelled = true;
    };
  }, [userId, sku]);

  const toggle = async (next: Exclude<Status, null>) => {
    if (!userId) {
      setNote("Sign in with the account button above to track your collection.");
      return;
    }
    setNote(null);
    const previous = status;
    const target: Status = status === next ? null : next;
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
    } catch {
      setStatus(previous);
      setNote("Something went wrong — try again.");
    }
  };

  const chip = (value: Exclude<Status, null>, label: string) => (
    <button
      type="button"
      className={`${styles.chip} ${styles.actionChip} ${styles.collectionChip}`}
      data-active={status === value}
      aria-pressed={status === value}
      disabled={Boolean(userId) && !loaded}
      onClick={() => toggle(value)}
    >
      {label}
    </button>
  );

  return (
    <div className={styles.card} data-pagefind-ignore>
      <span className={styles.label}>Your collection</span>
      <div className={`${styles.chipRow} ${styles.collectionRow}`}>
        {chip("owned", "I own it")}
        {chip("wanted", "I want it")}
      </div>
      {note && <p className={styles.collectionNote}>{note}</p>}
    </div>
  );
}
