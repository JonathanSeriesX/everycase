"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { authClient, useSession } from "../lib/auth-client";
import { PersonIcon } from "./icons";
import chrome from "../styles/Chrome.module.css";

type Step = "email" | "otp";

export default function ProfileMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passkeyStatus, setPasskeyStatus] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const close = () => {
    setOpen(false);
    setStep("email");
    setOtp("");
    setError(null);
    setPasskeyStatus(null);
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
      setStep("otp");
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

  const signInWithPasskey = async () => {
    setBusy(true);
    setError(null);
    const result = await authClient.signIn.passkey();
    setBusy(false);
    if (result?.error) {
      setError(result.error.message ?? "Passkey sign-in failed.");
    } else {
      close();
    }
  };

  const addPasskey = async () => {
    setPasskeyStatus(null);
    const result = await authClient.passkey.addPasskey();
    setPasskeyStatus(
      result?.error
        ? (result.error.message ?? "Could not add a passkey.")
        : "Passkey added.",
    );
  };

  const signOut = async () => {
    await authClient.signOut();
    close();
  };

  return (
    <div className={chrome.profile} ref={containerRef}>
      <button
        type="button"
        className={`${chrome.iconButton} ${chrome.profileToggle}`}
        aria-label="Account"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => (open ? close() : setOpen(true))}
      >
        <PersonIcon />
        {session && <span className={chrome.profileDot} aria-hidden="true" />}
      </button>
      {open && (
        <div className={chrome.profileMenu} role="dialog" aria-label="Account">
          {session ? (
            <>
              <p className={chrome.profileEmail}>{session.user.email}</p>
              <Link
                href="/collection"
                className={chrome.profileMenuItem}
                onClick={close}
              >
                My collection
              </Link>
              <button
                type="button"
                className={chrome.profileMenuItem}
                onClick={addPasskey}
              >
                Add a passkey…
              </button>
              {passkeyStatus && (
                <p className={chrome.profileHint}>{passkeyStatus}</p>
              )}
              <button
                type="button"
                className={chrome.profileMenuItem}
                onClick={signOut}
              >
                Sign out
              </button>
            </>
          ) : step === "email" ? (
            <form className={chrome.profileForm} onSubmit={sendCode}>
              <p className={chrome.profileTitle}>Sign in</p>
              <input
                type="email"
                required
                autoFocus
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
                {busy ? "Sending…" : "Email me a code"}
              </button>
              <button
                type="button"
                className={chrome.profileButtonSecondary}
                onClick={signInWithPasskey}
                disabled={busy}
              >
                Use a passkey
              </button>
              {error && <p className={chrome.profileError}>{error}</p>}
              <p className={chrome.profileHint}>
                New here? The code creates your account.
              </p>
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
                  setStep("email");
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
