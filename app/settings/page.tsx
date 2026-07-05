import { headers } from "next/headers";
import type { Metadata } from "next";
import { ObjectId } from "mongodb";
import { auth } from "../../lib/auth";
import { db } from "../../lib/mongo";
import SettingsProfile from "../../components/SettingsProfile.client";
import PasskeyCard, {
  type PasskeyInfo,
} from "../../components/PasskeyCard.client";
import ThemeControl from "../../components/ThemeControl.client";
import CurrencyControl from "../../components/CurrencyControl.client";
import styles from "../../styles/Settings.module.css";

// Per-user page — rendered on demand.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false },
};

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  let profile = null;
  let passkeys: PasskeyInfo[] = [];
  if (session) {
    const userId = session.user.id;
    const userDoc = await db
      .collection("user")
      .findOne(
        ObjectId.isValid(userId)
          ? { _id: new ObjectId(userId) }
          : { id: userId },
      );
    profile = {
      name: typeof userDoc?.name === "string" ? userDoc.name : "",
      username:
        typeof userDoc?.username === "string" ? userDoc.username : null,
      collectionPublic: userDoc?.collectionPublic === true,
    };

    const passkeyDocs = await db
      .collection("passkey")
      .find({ userId })
      .sort({ createdAt: 1 })
      .toArray();
    passkeys = passkeyDocs.map((doc) => ({
      id: doc._id.toString(),
      name: typeof doc.name === "string" ? doc.name : null,
      aaguid: typeof doc.aaguid === "string" ? doc.aaguid : null,
      createdAt:
        doc.createdAt instanceof Date ? doc.createdAt.toISOString() : null,
    }));
  }

  return (
    <article className={styles.page}>
      <h1>Settings</h1>

      {profile ? (
        <>
          <SettingsProfile initial={profile} />

          <section className={styles.section}>
            <h2>Sign-in</h2>
            <PasskeyCard initial={passkeys} />
          </section>
        </>
      ) : (
        <section className={styles.section}>
          <h2>Profile</h2>
          <p>
            Sign in with the account button in the top-right corner to set
            your display name, username, and collection visibility.
          </p>
        </section>
      )}

      <section className={styles.section}>
        <h2>Appearance</h2>

        <div className={styles.card}>
          <div className={styles.row}>
            <div className={styles.rowText}>
              <span className={styles.rowLabel}>Theme</span>
            </div>
            <ThemeControl />
          </div>

          <div className={styles.divider} />

          <div className={styles.row}>
            <div className={styles.rowText}>
              <span className={styles.rowLabel}>Secondary currency</span>

              <span className={styles.rowHint}>
                Shown next to the US dollar on every price tag.
              </span>
            </div>
            <CurrencyControl />
          </div>
        </div>
      </section>
    </article>
  );
}
