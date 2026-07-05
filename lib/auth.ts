import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins/email-otp";
import { passkey } from "@better-auth/passkey";
import { dash } from "@better-auth/infra";
import { db } from "./mongo";

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
      text: `Your Finest Woven sign-in code is ${otp}\n\nIt expires in 5 minutes. If you didn't request this, you can safely ignore this email.`,
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
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp }) {
        await sendOTPEmail(email, otp);
      },
      storeOTP: "hashed",
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
