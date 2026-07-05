"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient, useSession } from "../lib/auth-client";
import { PersonIcon } from "./icons";
import chrome from "../styles/Chrome.module.css";

type View = "menu" | "email" | "otp";

const isPlausibleEmail = (value: string) => /^\S+@\S+\.\S+$/.test(value);

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

  // Server components (settings, collection pages) render per-session — they
  // must re-render whenever the session changes under them.
  const finishAuthChange = () => {
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
    if (sendError) {
      setError(sendError.message ?? "Could not send the code.");
      return false;
    }
    setView("otp");
    return true;
  };

  // The primary action: try the OS passkey prompt first; if the user has no
  // passkey (or dismisses it), fall back to emailing a code — which needs an
  // email address.
  const continueSignIn = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const passkey = await authClient.signIn.passkey();
    if (passkey && !passkey.error) {
      setBusy(false);
      finishAuthChange();
      return;
    }
    if (!isPlausibleEmail(email)) {
      setBusy(false);
      setError("No passkey? Enter your email and we'll send you a code.");
      return;
    }
    await sendCode();
    setBusy(false);
  };

  const emailCodeInstead = async () => {
    setError(null);
    if (!isPlausibleEmail(email)) {
      setError("Enter your email first.");
      return;
    }
    setBusy(true);
    await sendCode();
    setBusy(false);
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
    } else {
      finishAuthChange();
    }
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
                  onClick={() => setView("email")}
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
            <form className={chrome.profileForm} onSubmit={continueSignIn}>
              <p className={chrome.profileTitle}>Your email</p>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                autoComplete="username webauthn"
                className={chrome.profileInput}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <button
                type="submit"
                className={chrome.profileButtonPrimary}
                disabled={busy}
              >
                {busy ? "One moment…" : "Use a passkey"}
              </button>
              <button
                type="button"
                className={chrome.profileButtonSecondary}
                onClick={emailCodeInstead}
                disabled={busy}
              >
                Email me a code
              </button>
              {error && <p className={chrome.profileError}>{error}</p>}
            </form>
          ) : (
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
          )}
        </div>
      )}
    </div>
  );
}
