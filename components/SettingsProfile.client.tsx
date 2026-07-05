"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import styles from "../styles/Settings.module.css";

interface Profile {
  name: string;
  username: string | null;
  collectionPublic: boolean;
}

/**
 * The Profile and Public collection sections on /settings. One component
 * because they share state (going public needs the freshly-saved username),
 * but rendered as two separate cards.
 */
export default function SettingsProfile({ initial }: { initial: Profile }) {
  const [name, setName] = useState(initial.name);
  const [username, setUsername] = useState(initial.username ?? "");
  const [saved, setSaved] = useState<Profile>(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [visibilityError, setVisibilityError] = useState<string | null>(null);

  const dirty = name !== saved.name || username !== (saved.username ?? "");

  const patch = async (body: Record<string, unknown>): Promise<Profile> => {
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error ?? "Could not save — try again.");
    return data as Profile;
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const data = await patch({
        name: name.trim(),
        username: username.trim() === "" ? null : username.trim(),
      });
      setSaved(data);
      setName(data.name);
      setUsername(data.username ?? "");
      setMessage("Saved.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // The switch saves immediately — no Save button for a boolean.
  const togglePublic = async (next: boolean) => {
    const previous = saved;
    setSaved({ ...saved, collectionPublic: next });
    setVisibilityError(null);
    try {
      const data = await patch({ collectionPublic: next });
      setSaved(data);
    } catch (err) {
      setSaved(previous);
      setVisibilityError((err as Error).message);
    }
  };

  const publicPath = saved.username ? `/collections/${saved.username}` : null;

  return (
    <>
      <section className={styles.section}>
        <h2>Profile</h2>

        <form className={styles.card} onSubmit={save}>
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

          <div className={styles.actions}>
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={busy || !dirty}
            >
              {busy ? "Saving…" : "Save"}
            </button>

            {message && !dirty && (
              <span className={styles.status}>{message}</span>
            )}

            {error && <span className={styles.error}>{error}</span>}
          </div>
        </form>
      </section>

      <section className={styles.section}>
        <div className={styles.card}>
          <div className={styles.row}>
            <div className={styles.rowText}>
              <span className={styles.rowLabel}>Share your collection</span>

              <span className={styles.rowHint}>
                {saved.collectionPublic && publicPath ? (
                  <>
                    Live at{" "}
                    <Link href={publicPath}>everycase.org{publicPath}</Link>
                  </>
                ) : publicPath ? (
                  `Anyone with the link will see it at everycase.org${publicPath}`
                ) : (
                  "Pick a username first — it becomes your collection's address."
                )}
              </span>
            </div>

            {/* A label, not a span: Safari won't hit-test the invisible
                checkbox, but label activation works everywhere. */}
            <label className={styles.switch}>
              <input
                type="checkbox"
                role="switch"
                aria-label="Share your collection"
                checked={saved.collectionPublic}
                disabled={!saved.username}
                onChange={(event) => togglePublic(event.target.checked)}
              />
              <span className={styles.switchTrack} aria-hidden="true" />
            </label>
          </div>

          {visibilityError && <p className={styles.error}>{visibilityError}</p>}
        </div>
      </section>
    </>
  );
}
