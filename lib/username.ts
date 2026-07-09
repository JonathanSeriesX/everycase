import { ObjectId } from "mongodb";
import { db } from "./mongo";

// Username rules, shared by the profile write route (validation) and the
// signup hook (default-handle assignment). Handles are 3–20 chars: letters,
// digits, - and _, starting with a letter or digit; stored lowercase.
export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9_-]{2,19}$/;

// Handles that would shadow routes or misrepresent the site.
export const RESERVED_USERNAMES = new Set([
  "about",
  "account",
  "admin",
  "administrator",
  "api",
  "apple",
  "case",
  "cases",
  "collection",
  "collections",
  "everycase",
  "help",
  "login",
  "logout",
  "me",
  "moderator",
  "official",
  "root",
  "settings",
  "signin",
  "signup",
  "support",
  "user",
  "users",
]);

const users = db.collection("user");

// The unique index is what makes the claim race-safe: assignDefaultUsername
// simply tries to set each candidate and lets a duplicate-key error bump it to
// the next one. Partial so users without a handle don't collide on `null`.
let indexReady: Promise<unknown> | undefined;
export const ensureUsernameIndex = () =>
  (indexReady ??= users.createIndex(
    { username: 1 },
    { unique: true, partialFilterExpression: { username: { $type: "string" } } },
  ));

/**
 * Give a freshly-created user a default handle from their email: local-part +
 * 69, then 64, 67, 420, then 1, 2, 3, … — claiming the first the unique index
 * accepts. Best-effort: swallows errors so it can never break signup.
 */
export async function assignDefaultUsername(
  userId: string,
  email: string,
): Promise<string | null> {
  // Email local-part, reduced to letters and digits and capped so any suffix
  // still fits the 20-char limit. Falls back to "user" if nothing survives.
  const base =
    (email.split("@")[0] ?? "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 15) ||
    "user";
  const filter = ObjectId.isValid(userId)
    ? { _id: new ObjectId(userId) }
    : { id: userId };

  // The fun ones first (hehe), then a plain sequence.
  const suffixes = [69, 64, 67, 420];
  for (let n = 1; n <= 1000; n++) suffixes.push(n);

  try {
    await ensureUsernameIndex();
    for (const suffix of suffixes) {
      const username = `${base}${suffix}`;
      if (!USERNAME_PATTERN.test(username)) continue; // too short/long — skip
      try {
        await users.updateOne(filter, { $set: { username } });
        return username;
      } catch (error) {
        if ((error as { code?: number }).code === 11000) continue; // taken
        throw error;
      }
    }
  } catch {
    // A missing handle is recoverable (the user can set one later); a broken
    // signup is not — so never let this throw.
  }
  return null;
}
