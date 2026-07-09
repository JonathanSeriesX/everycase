"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import styles from "../styles/Settings.module.css";

interface Profile {
  name: string;
  username: string | null;
  collectionPublic: boolean;
}

const patchProfile = async (body: Record<string, unknown>): Promise<Profile> => {
  const res = await fetch("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error ?? "Could not save — try again.");
  return data as Profile;
};

/**
 * The "Public access" tile on the owner's /collection page: display name and
 * username (one Save) above the share switch, all in a single card. Name and
 * username share the form because going public needs a freshly-saved handle;
 * the switch saves on its own, optimistically.
 */
export default function PublicAccessCard({ initial }: { initial: Profile }) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [username, setUsername] = useState(initial.username ?? "");
  const [saved, setSaved] = useState<Profile>(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [visibilityError, setVisibilityError] = useState<string | null>(null);

  const dirty = name !== saved.name || username !== (saved.username ?? "");

  const saveProfile = useMutation({
    mutationFn: patchProfile,
    onSuccess: (data) => {
      setSaved(data);
      setName(data.name);
      setUsername(data.username ?? "");
      setMessage("Saved.");
      // Refresh the App Router cache so the H1 and public link pick up the
      // freshly-saved name/username without a stale re-mount.
      router.refresh();
    },
    onError: (err) => setError(err.message),
  });

  // The switch saves immediately — no Save button for a boolean. Optimistic,
  // rolled back on failure.
  const saveVisibility = useMutation({
    mutationFn: (next: boolean) => patchProfile({ collectionPublic: next }),
    onMutate: (next) => {
      const previous = saved;
      setSaved({ ...saved, collectionPublic: next });
      setVisibilityError(null);
      return { previous };
    },
    onSuccess: (data) => {
      setSaved(data);
      router.refresh();
    },
    onError: (err, _next, context) => {
      if (context) setSaved(context.previous);
      setVisibilityError(err.message);
    },
  });

  const save = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    // The button press kept focus (see onPointerDown) so the tap reached us;
    // now drop it ourselves so the keyboard closes on a successful save.
    if (typeof document !== "undefined") {
      const focused = document.activeElement;
      if (focused instanceof HTMLElement) focused.blur();
    }
    saveProfile.mutate({
      name: name.trim(),
      username: username.trim() === "" ? null : username.trim(),
    });
  };

  const publicPath = saved.username ? `/collections/${saved.username}` : null;

  return (
    <section className={styles.section}>
      <div className={styles.card}>
        <form onSubmit={save}>
          {/* Wide viewports keep Save to the right of both fields; under
              600px the row stacks (see .identityRow). */}
          <div className={styles.identityRow}>
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

            <div className={styles.actions}>
              <button
                type="submit"
                className={styles.primaryButton}
                disabled={saveProfile.isPending || !dirty}
                // iOS otherwise spends the first tap dismissing the keyboard —
                // blurring the focused field before the click can land, so the
                // submit never fires. Keeping focus lets the tap reach the
                // button; save() then blurs to close the keyboard.
                onPointerDown={(event) => event.preventDefault()}
              >
                {saveProfile.isPending ? "Saving…" : "Save"}
              </button>

              {message && !dirty && (
                <span className={styles.status}>{message}</span>
              )}

              {error && <span className={styles.error}>{error}</span>}
            </div>
          </div>
        </form>

        <div className={styles.divider} />

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
              onChange={(event) => saveVisibility.mutate(event.target.checked)}
            />
            <span className={styles.switchTrack} aria-hidden="true" />
          </label>
        </div>

        {visibilityError && <p className={styles.error}>{visibilityError}</p>}
      </div>
    </section>
  );
}
