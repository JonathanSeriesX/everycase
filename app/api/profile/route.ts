import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "../../../lib/auth";
import { db } from "../../../lib/mongo";
import {
  ensureUsernameIndex,
  RESERVED_USERNAMES,
  USERNAME_PATTERN,
} from "../../../lib/username";

// Profile fields: display name (Better Auth's `name`), the URL handle
// (`username`, unique, lowercase) and the `collectionPublic` flag gating
// /collections/<username>. Handle rules (pattern, reserved set, unique index)
// live in lib/username, shared with the signup default-handle assignment.

const users = db.collection("user");

// The Mongo adapter stores users under an ObjectId; sessions carry it as a
// hex string.
const userFilter = (id: string) =>
  ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id };

export interface Profile {
  name: string;
  username: string | null;
  collectionPublic: boolean;
}

const toProfile = (doc: Record<string, unknown> | null): Profile => ({
  name: typeof doc?.name === "string" ? doc.name : "",
  username: typeof doc?.username === "string" ? doc.username : null,
  collectionPublic: doc?.collectionPublic === true,
});

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const doc = await users.findOne(userFilter(session.user.id));
  return NextResponse.json(toProfile(doc));
}

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const sets: Record<string, unknown> = {};
  const unsets: Record<string, ""> = {};

  if ("name" in body) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name || name.length > 50) {
      return NextResponse.json(
        { error: "Display name must be 1–50 characters." },
        { status: 400 },
      );
    }
    sets.name = name;
  }

  if ("username" in body) {
    if (body.username === null || body.username === "") {
      unsets.username = "";
      sets.collectionPublic = false;
    } else {
      const username =
        typeof body.username === "string"
          ? body.username.trim().toLowerCase()
          : "";
      if (!USERNAME_PATTERN.test(username)) {
        return NextResponse.json(
          {
            error:
              "Usernames are 3–20 characters: letters, digits, - and _, starting with a letter or digit.",
          },
          { status: 400 },
        );
      }
      if (RESERVED_USERNAMES.has(username)) {
        return NextResponse.json(
          { error: "That username is reserved." },
          { status: 400 },
        );
      }
      sets.username = username;
    }
  }

  if ("collectionPublic" in body && !("collectionPublic" in sets)) {
    if (typeof body.collectionPublic !== "boolean") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    sets.collectionPublic = body.collectionPublic;
  }

  if (Object.keys(sets).length === 0 && Object.keys(unsets).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const filter = userFilter(session.user.id);

  // Going public requires a handle — either the one being set right now or
  // one already on the account.
  if (sets.collectionPublic === true && !sets.username) {
    const current = await users.findOne(filter);
    if (typeof current?.username !== "string" && !("username" in sets)) {
      return NextResponse.json(
        { error: "Pick a username before making your collection public." },
        { status: 400 },
      );
    }
  }

  await ensureUsernameIndex();
  try {
    await users.updateOne(filter, {
      $set: { ...sets, updatedAt: new Date() },
      ...(Object.keys(unsets).length > 0 ? { $unset: unsets } : {}),
    });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      return NextResponse.json(
        { error: "That username is taken." },
        { status: 409 },
      );
    }
    throw error;
  }

  const doc = await users.findOne(filter);
  return NextResponse.json(toProfile(doc));
}
