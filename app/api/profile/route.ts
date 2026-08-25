import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "../../../lib/auth";
import { pool } from "../../../lib/db";
import { RESERVED_USERNAMES, USERNAME_PATTERN } from "../../../lib/username";

// Profile fields: display name (Better Auth's `name`), the URL handle
// (`username`, unique, lowercase) and the `collectionPublic` flag gating
// /collections/<username>. Handle rules (pattern, reserved set) live in
// lib/username, shared with the signup default-handle assignment; the
// unique constraint on "user"."username" is part of the schema.

export interface Profile {
  name: string;
  username: string | null;
  collectionPublic: boolean;
}

interface ProfileRow {
  name: string | null;
  username: string | null;
  collectionPublic: boolean | null;
}

const toProfile = (row: ProfileRow | undefined): Profile => ({
  name: typeof row?.name === "string" ? row.name : "",
  username: typeof row?.username === "string" ? row.username : null,
  collectionPublic: row?.collectionPublic === true,
});

const readProfile = async (userId: string) => {
  const { rows } = await pool.query<ProfileRow>(
    `SELECT "name", "username", "collectionPublic"
     FROM "user" WHERE "id" = $1`,
    [userId],
  );
  return rows[0];
};

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  return NextResponse.json(toProfile(await readProfile(session.user.id)));
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

  const sets: { column: string; value: string | boolean | null }[] = [];
  const set = (column: string, value: string | boolean | null) => {
    const existing = sets.find((entry) => entry.column === column);
    if (existing) existing.value = value;
    else sets.push({ column, value });
  };

  if ("name" in body) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name || name.length > 50) {
      return NextResponse.json(
        { error: "Display name must be 1–50 characters." },
        { status: 400 },
      );
    }
    set("name", name);
  }

  let clearsUsername = false;
  if ("username" in body) {
    if (body.username === null || body.username === "") {
      set("username", null);
      set("collectionPublic", false);
      clearsUsername = true;
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
      set("username", username);
    }
  }

  if ("collectionPublic" in body && !clearsUsername) {
    if (typeof body.collectionPublic !== "boolean") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    set("collectionPublic", body.collectionPublic);
  }

  if (sets.length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  // Going public requires a handle — either the one being set right now or
  // one already on the account.
  const settingUsername = sets.some(
    (entry) => entry.column === "username" && entry.value !== null,
  );
  const goingPublic = sets.some(
    (entry) => entry.column === "collectionPublic" && entry.value === true,
  );
  if (goingPublic && !settingUsername) {
    const current = await readProfile(session.user.id);
    if (typeof current?.username !== "string") {
      return NextResponse.json(
        { error: "Pick a username before making your collection public." },
        { status: 400 },
      );
    }
  }

  const assignments = sets
    .map((entry, i) => `"${entry.column}" = $${i + 2}`)
    .join(", ");
  try {
    await pool.query(
      `UPDATE "user" SET ${assignments}, "updatedAt" = now() WHERE "id" = $1`,
      [session.user.id, ...sets.map((entry) => entry.value)],
    );
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json(
        { error: "That username is taken." },
        { status: 409 },
      );
    }
    throw error;
  }

  return NextResponse.json(toProfile(await readProfile(session.user.id)));
}
