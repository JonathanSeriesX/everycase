import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "../../../lib/auth";
import { pool } from "../../../lib/db";

/**
 * DELETE /api/account — remove the signed-in user and everything they own.
 * Every owned table (session, account, passkey, collectionItems,
 * userDevices) references "user"("id") ON DELETE CASCADE, so deleting the
 * user row covers all of it; only verification rows (keyed by email, not
 * user id) need their own delete.
 */
export async function DELETE() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  // Better Auth's email-otp stores identifiers as `<type>-otp-<email>` with
  // a known, closed set of types — exact matches, so another user's email
  // can never match as a substring.
  await pool.query(`DELETE FROM "verification" WHERE "identifier" = ANY($1)`, [
    ["sign-in", "email-verification", "forget-password"].map(
      (type) => `${type}-otp-${session.user.email}`,
    ),
  ]);
  await pool.query(`DELETE FROM "user" WHERE "id" = $1`, [session.user.id]);

  return NextResponse.json({ ok: true });
}
