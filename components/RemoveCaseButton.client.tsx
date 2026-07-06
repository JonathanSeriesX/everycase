"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useRemoveCase } from "../lib/collectionQueries";
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
  const [note, setNote] = useState<string | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  // The tile is server-rendered — refresh redraws the collection page.
  const removeCase = useRemoveCase({
    onSuccess: () => router.refresh(),
    onError: () => {
      setArmed(false);
      setNote("Couldn't remove — try again.");
    },
  });

  const onClick = () => {
    if (!armed) {
      setArmed(true);
      setNote(null);
      clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setArmed(false), ARM_RESET_TIMEOUT);
      return;
    }
    clearTimeout(resetTimer.current);
    removeCase.mutate(sku);
  };

  return (
    <>
      <button
        type="button"
        className={styles.tileButton}
        data-armed={armed}
        disabled={removeCase.isPending}
        onClick={onClick}
        aria-label={`Remove ${label}`}
      >
        {removeCase.isPending ? "Removing…" : armed ? "Sure?" : "Remove"}
      </button>
      {note && (
        <p className={styles.tileNote} role="status">
          {note}
        </p>
      )}
    </>
  );
}
