import { Suspense } from "react";
import { headers } from "next/headers";
import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "../../lib/auth";
import PasskeyCard, {
  type PasskeyInfo,
} from "../../components/PasskeyCard.client";
import DeleteAccount from "../../components/DeleteAccount.client";
import ThemeControl from "../../components/ThemeControl.client";
import CurrencyControl from "../../components/CurrencyControl.client";
import styles from "../../styles/Settings.module.css";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false },
};

// The session-dependent half of the page — streamed behind the static shell
// so navigating to Settings is instant; the appearance section below never
// waits on the session lookup.
async function AccountSections() {
  const session = await auth.api.getSession({ headers: await headers() });

  let passkeys: PasskeyInfo[] = [];
  if (session) {
    // Through Better Auth's own API (not a raw query), so this keeps
    // working whatever the adapter's storage details are.
    const passkeyList = await auth.api.listPasskeys({
      headers: await headers(),
    });
    passkeys = passkeyList.map((p) => ({
      id: p.id,
      name: p.name ?? null,
      aaguid: (p as { aaguid?: string }).aaguid ?? null,
      createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : null,
    }));
  }

  if (!session) {
    return (
      <section className={styles.section}>
        <h2>Account</h2>
        <p>
          Sign in with the account button in the top-right corner to manage your
          passkeys and account. Your display name, username, and collection
          sharing live on your <Link href="/collection">collection page</Link>.
        </p>
      </section>
    );
  }

  return (
    <>
      <section className={styles.section}>
        <h2>Passkeys</h2>
        <PasskeyCard initial={passkeys} />
      </section>

      <DeleteAccount />
    </>
  );
}

export default function SettingsPage() {
  return (
    <article className={styles.page}>
      <h1>Settings</h1>

      <Suspense>
        <AccountSections />
      </Suspense>

      <section className={styles.section}>
        <h2>Appearance</h2>

        <div className={styles.card}>
          <div className={styles.row}>
            {/* rowTextCompact: no 14rem floor — a lone short label must not
                push the control onto its own line on narrow viewports. */}
            <div className={`${styles.rowText} ${styles.rowTextCompact}`}>
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
