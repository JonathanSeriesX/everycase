import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins/email-otp";
import { passkey } from "@better-auth/passkey";
import { dash } from "@better-auth/infra";
import { db } from "./mongo";

// Codes live long enough that "it will arrive eventually" holds, and while
// one is outstanding the send endpoint refuses to mint another (see the
// before hook) — which is also what keeps a stranger from burning Resend
// quota against a single address. Guessing is bounded by the plugin's
// attempt limit (3 by default), not the window, so the long validity does
// not widen brute force.
const OTP_EXPIRES_IN = 30 * 60; // seconds

async function sendOTPEmail(to: string, otp: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Finest Woven <login@users.everycase.org>",
      to,
      subject: `${otp} is your code`,
      text: `Your Finest Woven sign-in code is ${otp}\n\nIt expires in 30 minutes. If you didn't request this, you can safely ignore this email.`,
    }),
  });
  if (!res.ok) {
    throw new Error(`Resend ${res.status}: ${await res.text()}`);
  }
}

// Preview deployments trust exactly their own generated origin, so auth is
// testable there; production and local dev use BETTER_AUTH_URL. (Passkeys
// registered on a preview are scoped to that preview's hostname.)
const baseURL =
  process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.BETTER_AUTH_URL;

export const auth = betterAuth({
  appName: "Finest Woven",
  baseURL,
  database: mongodbAdapter(db),
  user: {
    // Profile fields managed by /api/profile (hence input: false — they are
    // not settable through Better Auth's own endpoints).
    additionalFields: {
      username: { type: "string", required: false, input: false },
      collectionPublic: {
        type: "boolean",
        required: false,
        input: false,
        defaultValue: false,
      },
    },
  },
  hooks: {
    // One outstanding code per address: while an unexpired OTP exists,
    // refuse to send another. The doc disappears on use, on exhausting the
    // attempt limit, and on expiry — any of those reopens sending.
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/email-otp/send-verification-otp") return;
      const email =
        typeof ctx.body?.email === "string" ? ctx.body.email.trim() : "";
      const type = typeof ctx.body?.type === "string" ? ctx.body.type : "";
      if (!email || !type) return;
      const existing = await db.collection("verification").findOne({
        identifier: `${type}-otp-${email}`,
        expiresAt: { $gt: new Date() },
      });
      if (existing) {
        const minutes = Math.max(
          1,
          Math.ceil((existing.expiresAt.getTime() - Date.now()) / 60_000),
        );
        throw new APIError("TOO_MANY_REQUESTS", {
          message: `A code is already on its way — it stays valid for ${minutes} more minute${minutes === 1 ? "" : "s"}.`,
        });
      }
    }),
  },
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        try {
          await sendOTPEmail(email, otp);
        } catch (error) {
          // The plugin stores the code before this runs; without cleanup a
          // failed send would leave a doc that blocks resends (see the
          // before hook) for a code that never went out.
          await db
            .collection("verification")
            .deleteMany({ identifier: `${type}-otp-${email}` })
            .catch(() => {});
          throw error;
        }
      },
      storeOTP: "hashed",
      expiresIn: OTP_EXPIRES_IN,
    }),
    passkey({
      rpID: "everycase.org",
      rpName: "Finest Woven",
    }),
    // Better Auth Dash (hosted dashboard); needs BETTER_AUTH_API_KEY.
    dash(),
    // Must stay last: rewrites Set-Cookie for Next.js server actions.
    nextCookies(),
  ],
  experimental: {
    joins: true, // Enable database joins for better performance
  },
  advanced: {
    ipAddress: {
      // For Vercel
      ipAddressHeaders: ["x-vercel-forwarded-for", "x-forwarded-for"],
    },
  },
});
