"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useRemoveCase, type DeviceOption } from "../lib/collectionQueries";
import LinkCaseButton from "./LinkCaseButton.client";
import carousel from "../styles/VerticalCarousel.module.css";
import device from "../styles/DeviceSection.module.css";

const ARM_RESET_TIMEOUT = 2000;

/**
 * Client shell of one collection case tile: renders the server-provided
 * card content plus the owner controls, and removes itself optimistically —
 * the tile disappears the moment the confirming tap lands, while the DELETE
 * and a background router.refresh() (which reconciles the header counts and
 * grouping) follow. A failed request brings the tile back with a note.
 */
export default function CollectionCaseTile({
  sku,
  label,
  canRemove = false,
  linkOptions = [],
  children,
}: {
  sku: string;
  label: string;
  canRemove?: boolean;
  /** Devices this case fits, for the owner's "Link" window. */
  linkOptions?: DeviceOption[];
  children: ReactNode;
}) {
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const removeCase = useRemoveCase({
    // Header counts and grouping are server state — reconcile them behind
    // the already-hidden tile.
    onSuccess: () => router.refresh(),
    onError: () => {
      setHidden(false);
      setArmed(false);
      setNote("Couldn't remove — try again.");
    },
  });

  const onRemoveClick = () => {
    if (!armed) {
      setArmed(true);
      setNote(null);
      clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setArmed(false), ARM_RESET_TIMEOUT);
      return;
    }
    clearTimeout(resetTimer.current);
    setHidden(true); // optimistic — the request follows
    removeCase.mutate(sku);
  };

  // Stay mounted while hidden so the in-flight mutation's callbacks (and a
  // possible rollback) still have a home; the server refresh unmounts us.
  if (hidden) return null;

  return (
    <article className={`${carousel.caseCard} ${device.tile}`}>
      {children}
      {(canRemove || linkOptions.length > 0) && (
        <div className={device.tileActions}>
          {linkOptions.length > 0 && (
            <LinkCaseButton label={label} options={linkOptions} />
          )}
          {canRemove && (
            <button
              type="button"
              className={device.tileButton}
              data-armed={armed}
              onClick={onRemoveClick}
              aria-label={`Remove ${label}`}
            >
              {armed ? "Sure?" : "Remove"}
            </button>
          )}
          {note && (
            <p className={device.tileNote} role="status">
              {note}
            </p>
          )}
        </div>
      )}
    </article>
  );
}
