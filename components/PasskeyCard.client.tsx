"use client";

import { useState } from "react";
import { authClient } from "../lib/auth-client";
import styles from "../styles/Settings.module.css";

export interface PasskeyInfo {
  id: string;
  name: string | null;
  aaguid: string | null;
  createdAt: string | null;
}

// Well-known authenticator AAGUIDs → provider names, so the list reads
// "iCloud Keychain" instead of "Passkey #1".
const AAGUID_NAMES: Record<string, string> = {
  "fbfc3007-154e-4ecc-8c0b-6e020557d7bd": "iCloud Keychain",
  "ea9b8d66-4d01-1d21-3ce4-b6b48cb575d4": "Google Password Manager",
  "adce0002-35bc-c60a-648b-0b25f1f05503": "Chrome on Mac",
  "08987058-cadc-4b81-b6e1-30de50dcbe96": "Windows Hello",
  "9ddd1817-af5a-4672-a2b9-3e3dd95000a9": "Windows Hello",
  "6028b017-b1d4-4c02-b4b3-afcdafc96bb2": "Windows Hello",
  "bada5566-a7aa-401f-bd96-45619a55120d": "1Password",
  "d548826e-79b4-db40-a3d8-11116f7e8349": "Bitwarden",
  "531126d6-e717-415c-9320-3d9aa6981239": "Dashlane",
  "53414d53-554e-4700-0000-000000000000": "Samsung Pass",
  "771b48fd-d3d4-4f74-9232-fc157ab0507a": "Edge on Mac",
};

const displayName = (passkey: PasskeyInfo): string =>
  passkey.name || (passkey.aaguid && AAGUID_NAMES[passkey.aaguid]) || "Passkey";

// Fixed locale + UTC keeps the server-rendered string identical on the client.
const addedOn = (iso: string | null): string =>
  iso
    ? `Added ${new Date(iso).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })}`
    : "";

/** The sign-in section on /settings: the user's passkeys, with add/remove. */
export default function PasskeyCard({ initial }: { initial: PasskeyInfo[] }) {
  const [passkeys, setPasskeys] = useState<PasskeyInfo[]>(initial);
  const [status, setStatus] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = async () => {
    const result = await authClient.passkey.listUserPasskeys();
    if (result?.data) {
      setPasskeys(
        result.data.map((p) => ({
          id: p.id,
          name: p.name ?? null,
          aaguid: (p as { aaguid?: string }).aaguid ?? null,
          createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : null,
        })),
      );
    }
  };

  const addPasskey = async () => {
    setStatus(null);
    setFailed(false);
    const result = await authClient.passkey.addPasskey();
    if (result?.error) {
      setStatus(result.error.message ?? "Could not add a passkey.");
      setFailed(true);
    } else {
      setStatus("Passkey added.");
      await refresh();
    }
  };

  const removePasskey = async (id: string) => {
    setStatus(null);
    setFailed(false);
    setBusyId(id);
    const result = await authClient.passkey.deletePasskey({ id });
    setBusyId(null);
    if (result?.error) {
      setStatus(result.error.message ?? "Could not remove that passkey.");
      setFailed(true);
    } else {
      setPasskeys((current) => current.filter((p) => p.id !== id));
    }
  };

  return (
    <div className={styles.card}>
      {passkeys.map((passkey, index) => (
        <div key={passkey.id}>
          {index > 0 && <div className={styles.divider} />}

          <div className={styles.row}>
            <div className={styles.rowText}>
              <span className={styles.rowLabel}>{displayName(passkey)}</span>

              <span className={styles.rowHint}>
                {addedOn(passkey.createdAt)}
              </span>
            </div>

            <button
              type="button"
              className={styles.secondaryButton}
              disabled={busyId === passkey.id}
              onClick={() => removePasskey(passkey.id)}
            >
              {busyId === passkey.id ? "Removing…" : "Remove"}
            </button>
          </div>
        </div>
      ))}

      {passkeys.length > 0 && <div className={styles.divider} />}

      <div className={styles.row}>
        <div className={styles.rowText}>
          <span className={styles.rowHint}>
            {passkeys.length === 0
              ? "Sign in with a passkey instead of email codes."
              : "Use multiple passkeys for different keychains — e.g. Google Passwords, 1Password, ..."}
          </span>
        </div>

        <button
          type="button"
          className={styles.secondaryButton}
          onClick={addPasskey}
        >
          {passkeys.length === 0 ? "Add a passkey" : "Add another"}
        </button>
      </div>

      {status && (
        <p className={failed ? styles.error : styles.status}>{status}</p>
      )}
    </div>
  );
}
