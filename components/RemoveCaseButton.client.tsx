"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../styles/DeviceSection.module.css";

const ARM_RESET_TIMEOUT = 3000;

/** Two-tap case removal on collection tiles. */
export default function RemoveCaseButton({
  sku,
  label,
}: {
  sku: string;
  label: string;
}) {
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const onClick = async () => {
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
        `/api/collection?sku=${encodeURIComponent(sku)}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setBusy(false);
      setArmed(false);
    }
  };

  return (
    <button
      type="button"
      className={styles.tileButton}
      data-armed={armed}
      disabled={busy}
      onClick={onClick}
      aria-label={`Remove ${label}`}
    >
      {busy ? "Removing…" : armed ? "Sure?" : "Remove"}
    </button>
  );
}
