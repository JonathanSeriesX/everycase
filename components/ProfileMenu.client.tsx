"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { authClient, useSession } from "../lib/auth-client";
import { PersonIcon } from "./icons";
import chrome from "../styles/Chrome.module.css";

type View = "menu" | "email" | "otp";

export default function ProfileMenu() {
  const { data: session } = useSession();
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

  // Conditional passkey (WebAuthn autofill): armed while the email view is
  // open. If the OS has a matching passkey it offers it as soon as the user
  // engages the field; with no passkey stored, nothing appears and the
  // email → code flow is undisturbed. Resolves only when the user picks one.
  useEffect(() => {
    if (view !== "email" || session) return;
    let cancelled = false;
    (async () => {
      const available = await window.PublicKeyCredential
        ?.isConditionalMediationAvailable?.()
        .catch(() => false);
      if (!available) return;
      const result = await authClient.signIn.passkey({ autoFill: true });
      if (!cancelled && result && !result.error) close();
    })();
    return () => {
      cancelled = true;
    };
  }, [view, session]);

  const sendCode = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const { error: sendError } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "sign-in",
    });
    setBusy(false);
    if (sendError) {
      setError(sendError.message ?? "Could not send the code.");
    } else {
      setView("otp");
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
    } else {
      close();
    }
  };

  const signOut = async () => {
    await authClient.signOut();
    close();
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
                  Sign in
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
            <form className={chrome.profileForm} onSubmit={sendCode}>
              <p className={chrome.profileTitle}>My collection</p>
              <input
                type="email"
                required
                placeholder="you@example.com"
                autoComplete="email webauthn"
                className={chrome.profileInput}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <button
                type="submit"
                className={chrome.profileButtonPrimary}
                disabled={busy}
              >
                {busy ? "Sending…" : "Sign in / Sign up"}
              </button>
              {error && <p className={chrome.profileError}>{error}</p>}
            </form>
          ) : (
            <form className={chrome.profileForm} onSubmit={verifyCode}>
              <p className={chrome.profileTitle}>
                Enter the code sent to {email}
              </p>
              <input
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
