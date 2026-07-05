"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import styles from "../styles/ProfileSettings.module.css";

interface Profile {
  name: string;
  username: string | null;
  collectionPublic: boolean;
}

/**
 * The profile block on /collection: display name, username, and the
 * public-collection switch. Server passes the current values; saves go
 * through /api/profile.
 */
export default function ProfileSettings({ initial }: { initial: Profile }) {
  const [name, setName] = useState(initial.name);
  const [username, setUsername] = useState(initial.username ?? "");
  const [isPublic, setIsPublic] = useState(initial.collectionPublic);
  const [saved, setSaved] = useState<Profile>(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dirty =
    name !== saved.name ||
    username !== (saved.username ?? "") ||
    isPublic !== saved.collectionPublic;

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          username: username.trim() === "" ? null : username.trim(),
          collectionPublic: isPublic,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Could not save — try again.");
        return;
      }
      setSaved(data);
      setName(data.name);
      setUsername(data.username ?? "");
      setIsPublic(data.collectionPublic);
      setMessage("Saved.");
    } catch {
      setError("Could not save — try again.");
    } finally {
      setBusy(false);
    }
  };

  const publicPath = saved.username ? `/collections/${saved.username}` : null;

  return (
    <form className={styles.settings} onSubmit={save}>
      <div className={styles.fields}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Display name</span>
          <input
            type="text"
            className={styles.input}
            value={name}
            maxLength={50}
            placeholder="How you're shown"
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Username</span>
          <input
            type="text"
            className={styles.input}
            value={username}
            maxLength={20}
            placeholder="your-handle"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            onChange={(event) =>
              setUsername(event.target.value.toLowerCase())
            }
          />
        </label>
      </div>
      <label className={styles.toggleRow}>
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(event) => setIsPublic(event.target.checked)}
        />
        <span>
          Make my collection public
          {publicPath && saved.collectionPublic ? (
            <>
              {" — "}
              <Link href={publicPath} className={styles.publicLink}>
                {`everycase.org${publicPath}`}
              </Link>
            </>
          ) : (
            username.trim() === "" && isPublic && (
              <span className={styles.hint}> (needs a username)</span>
            )
          )}
        </span>
      </label>
      <div className={styles.actions}>
        <button
          type="submit"
          className={styles.saveButton}
          disabled={busy || !dirty}
        >
          {busy ? "Saving…" : "Save"}
        </button>
        {message && !dirty && <span className={styles.saved}>{message}</span>}
        {error && <span className={styles.error}>{error}</span>}
      </div>
    </form>
  );
}
