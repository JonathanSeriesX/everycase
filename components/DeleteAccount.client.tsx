"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { authClient } from "../lib/auth-client";
import styles from "../styles/Settings.module.css";

/** The account section on /settings: delete everything, with one confirm. */
export default function DeleteAccount() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deletion = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (!res.ok) throw new Error();
      // The session doc is already gone; this just clears the cookie.
      await authClient.signOut().catch(() => {});
    },
    onSuccess: () => {
      router.push("/");
      router.refresh();
    },
    onError: () => {
      setError("Could not delete the account — try again.");
      setConfirming(false);
    },
  });
  // Stay disabled through the post-success redirect.
  const busy = deletion.isPending || deletion.isSuccess;

  const deleteAccount = () => {
    setError(null);
    deletion.mutate();
  };

  return (
    <div className={styles.card}>
      <div className={styles.row}>
        <div className={styles.rowText}>
          <span className={styles.rowLabel}>
            {confirming ? "Are you sure?" : "Delete account"}
          </span>

          <span className={styles.rowHint}>
            {confirming
              ? "This permanently removes everything. Last chance."
              : "Removes your profile and collection, frees up your username. There is no undo."}
          </span>
        </div>

        {confirming ? (
          <span className={styles.actions}>
            <button
              type="button"
              className={styles.primaryButton}
              disabled={busy}
              onClick={deleteAccount}
            >
              {busy ? "Deleting…" : "Yes, delete"}
            </button>

            <button
              type="button"
              className={styles.secondaryButton}
              disabled={busy}
              onClick={() => setConfirming(false)}
            >
              No
            </button>
          </span>
        ) : (
          <button
            type="button"
            className={styles.dangerButton}
            onClick={() => setConfirming(true)}
          >
            Delete account
          </button>
        )}
      </div>

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
