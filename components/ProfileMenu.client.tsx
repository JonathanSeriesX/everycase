"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient, SIGN_IN_EVENT, useSession } from "../lib/auth-client";
import { PersonIcon } from "./icons";
import chrome from "../styles/Chrome.module.css";

type View = "menu" | "email" | "otp" | "passkey";

const isPlausibleEmail = (value: string) => /^\S+@\S+\.\S+$/.test(value);

// Remember an outstanding sign-in code across popup closes and page reloads,
// so a user who clicks away mid-flow (or refreshes) lands back on the code
// entry instead of starting over. The window mirrors OTP_EXPIRES_IN in
// lib/auth.ts — the server keeps the same code valid for 30 minutes and
// refuses to mint another while it lives, so re-entering that code just works.
const PENDING_CODE_KEY = "fw:pending-otp";
const PENDING_CODE_TTL = 30 * 60 * 1000; // ms — mirrors OTP_EXPIRES_IN

type PendingCode = { email: string; sentAt: number };

const readPendingCode = (): PendingCode | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PENDING_CODE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingCode>;
    if (
      typeof parsed?.email !== "string" ||
      typeof parsed?.sentAt !== "number" ||
      Date.now() - parsed.sentAt >= PENDING_CODE_TTL
    ) {
      window.localStorage.removeItem(PENDING_CODE_KEY);
      return null;
    }
    return { email: parsed.email, sentAt: parsed.sentAt };
  } catch {
    return null;
  }
};

const writePendingCode = (email: string) => {
  if (typeof window === "undefined") return;
  try {
    const value: PendingCode = { email, sentAt: Date.now() };
    window.localStorage.setItem(PENDING_CODE_KEY, JSON.stringify(value));
  } catch {
    // Private mode / quota — losing the hint just means starting over.
  }
};

const clearPendingCode = () => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PENDING_CODE_KEY);
  } catch {
    // Ignore — a stale hint expires on its own within the TTL.
  }
};

export default function ProfileMenu() {
  const { data: session } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("menu");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const close = () => {
    setOpen(false);
    setView("menu");
    setOtp("");
    setError(null);
  };

  // Enter the sign-in flow. If a code is already outstanding for a remembered
  // address, skip the email step and drop the user straight on code entry.
  const openSignIn = () => {
    const pending = readPendingCode();
    if (pending) {
      setEmail(pending.email);
      setOtp("");
      setError(null);
      setView("otp");
    } else {
      setView("email");
    }
  };

  // Server components (settings, collection pages) render per-session — they
  // must re-render whenever the session changes under them.
  const finishAuthChange = () => {
    clearPendingCode();
    close();
    router.refresh();
  };

  // Close on outside click / Escape, mirroring the search box.
  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) close();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Other components can summon the sign-in flow (the collection card's
  // "I own it" while signed out) — jump straight to the email view.
  useEffect(() => {
    if (session) return;
    const onSummon = () => {
      setOpen(true);
      openSignIn();
    };
    window.addEventListener(SIGN_IN_EVENT, onSummon);
    return () => window.removeEventListener(SIGN_IN_EVENT, onSummon);
  }, [session]);

  // Conditional passkey (WebAuthn autofill), armed while the email view is
  // open: Safari/Chrome offer a stored passkey in the autofill UI when the
  // user engages the field. Complements the explicit button below.
  useEffect(() => {
    if (view !== "email" || session) return;
    let cancelled = false;
    (async () => {
      const available =
        await window.PublicKeyCredential?.isConditionalMediationAvailable?.().catch(
          () => false,
        );
      if (!available) return;
      const result = await authClient.signIn.passkey({ autoFill: true });
      if (!cancelled && result && !result.error) finishAuthChange();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, session]);

  const sendCode = async (): Promise<boolean> => {
    const { error: sendError } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "sign-in",
    });
    // A 429 means an unexpired code is already out there (see the before hook
    // in lib/auth.ts). That's not a dead end for the user — the code already
    // in their inbox still works, so move them straight to entering it.
    if (sendError && sendError.status !== 429) {
      setError(sendError.message ?? "Could not send the code.");
      return false;
    }
    // A code is now outstanding for this address (freshly sent, or a 429
    // meaning one already is) — remember it so an accidental close or reload
    // returns the user straight to code entry.
    writePendingCode(email);
    setView("otp");
    return true;
  };

  // The primary action: email a code, then let the user enter it. Needs a
  // plausible email address to send to.
  const continueWithEmail = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!isPlausibleEmail(email)) {
      setError("Enter your email and we'll send you a code.");
      return;
    }
    setBusy(true);
    await sendCode();
    setBusy(false);
  };

  const signInWithPasskey = async () => {
    setBusy(true);
    setError(null);
    const passkey = await authClient.signIn.passkey();
    setBusy(false);
    if (passkey && !passkey.error) {
      finishAuthChange();
    } else {
      setError("Couldn't use a passkey. Continue with your email instead.");
    }
  };

  const verifyCode = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const { error: verifyError } = await authClient.signIn.emailOtp({
      email,
      otp,
    });
    setBusy(false);
    if (verifyError) {
      setError(verifyError.message ?? "That code didn't work.");
      return;
    }
    // Signed in. Offer to set up a passkey so next time is one tap — but only
    // where the browser can actually create one.
    if (typeof window !== "undefined" && window.PublicKeyCredential) {
      setError(null);
      setView("passkey");
    } else {
      finishAuthChange();
    }
  };

  const createPasskey = async () => {
    setBusy(true);
    setError(null);
    const result = await authClient.passkey.addPasskey();
    setBusy(false);
    if (result?.error) {
      setError(result.error.message ?? "Could not add a passkey.");
      return;
    }
    finishAuthChange();
  };

  const signOut = async () => {
    await authClient.signOut();
    finishAuthChange();
  };

  return (
    <div className={chrome.profile} ref={containerRef}>
      <button
        type="button"
        className={chrome.iconButton}
        aria-label="Account"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => (open ? close() : setOpen(true))}
      >
        <PersonIcon />
      </button>
      {open && (
        <div className={chrome.profileMenu} role="dialog" aria-label="Account">
          {view === "menu" ? (
            session ? (
              <>
                <Link
                  href="/collection"
                  className={chrome.profileMenuItem}
                  onClick={close}
                >
                  My collection
                </Link>
                <Link
                  href="/settings"
                  className={chrome.profileMenuItem}
                  onClick={close}
                >
                  Settings
                </Link>
                <button
                  type="button"
                  className={chrome.profileMenuItem}
                  onClick={signOut}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className={chrome.profileMenuItem}
                  onClick={openSignIn}
                >
                  Sign in to start collecting
                </button>
                <Link
                  href="/settings"
                  className={chrome.profileMenuItem}
                  onClick={close}
                >
                  Settings
                </Link>
              </>
            )
          ) : view === "email" ? (
            <form className={chrome.profileForm} onSubmit={continueWithEmail}>
              <p className={chrome.profileTitle}>Sign in | sign up</p>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                autoComplete="username webauthn"
                // Deliberately NOT autofocused: focusing summons the
                // password-manager dropdown over the whole panel, and a
                // passkey user never needs the field at all.
                className={chrome.profileInput}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <button
                type="submit"
                className={chrome.profileButtonPrimary}
                disabled={busy}
              >
                {busy ? "One moment…" : "Continue with your email"}
              </button>
              <button
                type="button"
                className={chrome.profileButtonSecondary}
                onClick={signInWithPasskey}
                disabled={busy}
              >
                Log in with a passkey
              </button>
              {error && <p className={chrome.profileError}>{error}</p>}
            </form>
          ) : view === "otp" ? (
            <form className={chrome.profileForm} onSubmit={verifyCode}>
              <p className={chrome.profileTitle}>
                Enter the code sent to {email}
              </p>
              <input
                type="text"
                name="one-time-code"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                autoFocus
                placeholder="123456"
                autoComplete="one-time-code"
                className={chrome.profileInput}
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
              />
              <button
                type="submit"
                className={chrome.profileButtonPrimary}
                disabled={busy || otp.length < 6}
              >
                {busy ? "Signing in…" : "Sign in"}
              </button>
              <button
                type="button"
                className={chrome.profileButtonSecondary}
                onClick={() => {
                  setView("email");
                  setOtp("");
                  setError(null);
                }}
              >
                Back
              </button>
              {error && <p className={chrome.profileError}>{error}</p>}
            </form>
          ) : (
            <div className={chrome.profileForm}>
              <p className={chrome.profileTitle}>You&rsquo;re in!</p>
              <p className={chrome.profileHint}>
                You can now add a passkey for one-tap sign-in. You can also skip
                this step and do it later in Settings.{" "}
              </p>
              <button
                type="button"
                className={chrome.profileButtonPrimary}
                onClick={createPasskey}
                disabled={busy}
              >
                {busy ? "One moment…" : "Add a passkey"}
              </button>
              <button
                type="button"
                className={chrome.profileButtonSecondary}
                onClick={finishAuthChange}
                disabled={busy}
              >
                Not now
              </button>
              {error && <p className={chrome.profileError}>{error}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
