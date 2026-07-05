"use client";

import { useState } from "react";
import { authClient } from "../lib/auth-client";
import styles from "../styles/Settings.module.css";

/** The sign-in section on /settings: passkey enrollment. */
export default function PasskeyCard() {
  const [status, setStatus] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const addPasskey = async () => {
    setStatus(null);
    setFailed(false);
    const result = await authClient.passkey.addPasskey();
    if (result?.error) {
      setStatus(result.error.message ?? "Could not add a passkey.");
      setFailed(true);
    } else {
      setStatus("Passkey added — next sign-in on this device is one tap.");
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.row}>
        <div className={styles.rowText}>
          <span className={styles.rowLabel}>Passkey</span>

          <span className={failed ? styles.error : styles.rowHint}>
            {status ??
              "Sign in with Face ID or Touch ID instead of email codes."}
          </span>
        </div>

        <button
          type="button"
          className={styles.secondaryButton}
          onClick={addPasskey}
        >
          Add a passkey
        </button>
      </div>
    </div>
  );
}
