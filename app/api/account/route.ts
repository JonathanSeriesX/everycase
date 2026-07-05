import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "../../../lib/auth";
import { db } from "../../../lib/mongo";

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * DELETE /api/account — remove the signed-in user and everything they own:
 * collection, passkeys, sessions, linked accounts, pending codes, user doc.
 */
export async function DELETE() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const userId = session.user.id;
  // Better Auth's adapter stores userId as an ObjectId; our own collections
  // use the plain string. Match both wherever the type isn't ours.
  const userIdForms: (string | ObjectId)[] = ObjectId.isValid(userId)
    ? [userId, new ObjectId(userId)]
    : [userId];
  const byUserId = { userId: { $in: userIdForms } };

  await db.collection("collectionItems").deleteMany({ userId });
  await db.collection("passkey").deleteMany(byUserId);
  await db.collection("account").deleteMany(byUserId);
  await db.collection("session").deleteMany(byUserId);
  await db.collection("verification").deleteMany({
    identifier: { $regex: escapeRegex(session.user.email) },
  });
  await db.collection("user").deleteOne(
    ObjectId.isValid(userId)
      ? { _id: new ObjectId(userId) }
      : { _id: userId as never },
  );

  return NextResponse.json({ ok: true });
}
