import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";

export const authClient = createAuthClient({
  plugins: [emailOTPClient(), passkeyClient()],
});

export const { useSession, signIn, signOut } = authClient;

// Summons the navbar's sign-in flow from anywhere (the collection card on
// case pages) — beats a static "sign in with the button above" note that
// reflows the card and never dismisses. ProfileMenu listens.
export const SIGN_IN_EVENT = "finestwoven:sign-in";
export const requestSignIn = () =>
  window.dispatchEvent(new Event(SIGN_IN_EVENT));
