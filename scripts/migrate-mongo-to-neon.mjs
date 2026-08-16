// One-shot Mongo (Atlas) -> Neon Postgres migration for Better Auth + the
// collection tables. Idempotent: creates the schema if missing, then
// truncates and reloads every migrated table, so it can be re-run right
// before the deploy that switches the app over (catching writes that landed
// in Mongo after an earlier run).
//
//   node scripts/migrate-mongo-to-neon.mjs
//
// Reads MONGODB_URI and DATABASE_URL from the environment or .env.local.
// ObjectIds become their 24-char hex strings, so existing session cookies
// and passkeys keep working (user ids don't change).
import { MongoClient } from "mongodb";
import pg from "pg";
import { readFileSync } from "node:fs";

const envFile = (() => {
  try {
    return readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  } catch {
    return "";
  }
})();
const envVar = (name) =>
  process.env[name] ??
  envFile.match(new RegExp(`^${name}="?([^"\\n]+)"?$`, "m"))?.[1];

const mongoUri = envVar("MONGODB_URI");
const pgUrl = envVar("DATABASE_URL");
if (!mongoUri) throw new Error("MONGODB_URI missing");
if (!pgUrl) throw new Error("DATABASE_URL missing");

const DDL = `
CREATE TABLE IF NOT EXISTS "user" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "emailVerified" boolean NOT NULL DEFAULT false,
  "image" text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  "username" text UNIQUE,
  "collectionPublic" boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS "session" (
  "id" text PRIMARY KEY,
  "expiresAt" timestamptz NOT NULL,
  "token" text NOT NULL UNIQUE,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  "ipAddress" text,
  "userAgent" text,
  "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "session"("userId");

CREATE TABLE IF NOT EXISTS "account" (
  "id" text PRIMARY KEY,
  "accountId" text NOT NULL,
  "providerId" text NOT NULL,
  "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  "scope" text,
  "password" text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "account_userId_idx" ON "account"("userId");

CREATE TABLE IF NOT EXISTS "verification" (
  "id" text PRIMARY KEY,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expiresAt" timestamptz NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "verification_identifier_idx"
  ON "verification"("identifier");

CREATE TABLE IF NOT EXISTS "passkey" (
  "id" text PRIMARY KEY,
  "name" text,
  "publicKey" text NOT NULL,
  "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "credentialID" text NOT NULL,
  "counter" integer NOT NULL,
  "deviceType" text NOT NULL,
  "backedUp" boolean NOT NULL,
  "transports" text,
  "createdAt" timestamptz,
  "aaguid" text
);
CREATE INDEX IF NOT EXISTS "passkey_userId_idx" ON "passkey"("userId");
CREATE INDEX IF NOT EXISTS "passkey_credentialID_idx"
  ON "passkey"("credentialID");

CREATE TABLE IF NOT EXISTS "collectionItems" (
  "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "sku" text NOT NULL,
  "status" text NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("userId", "sku")
);

CREATE TABLE IF NOT EXISTS "userDevices" (
  "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "deviceId" text NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("userId", "deviceId")
);
`;

const hex = (v) => (typeof v === "string" ? v : v.toString("hex"));

const mongo = new MongoClient(mongoUri);
await mongo.connect();
const db = mongo.db("everycase");

const pool = new pg.Pool({ connectionString: pgUrl, max: 1 });
const client = await pool.connect();

try {
  await client.query(DDL);
  await client.query("BEGIN");
  await client.query(
    `TRUNCATE "user", "session", "account", "verification", "passkey",
       "collectionItems", "userDevices" CASCADE`,
  );

  const insert = async (table, columns, docs, row) => {
    for (const doc of docs) {
      const values = row(doc);
      await client.query(
        `INSERT INTO "${table}" (${columns.map((c) => `"${c}"`).join(", ")})
         VALUES (${columns.map((_, i) => `$${i + 1}`).join(", ")})`,
        values,
      );
    }
    console.log(`${table}: ${docs.length} rows`);
  };

  const users = await db.collection("user").find({}).toArray();
  await insert(
    "user",
    ["id", "name", "email", "emailVerified", "image", "createdAt",
     "updatedAt", "username", "collectionPublic"],
    users,
    (u) => [
      hex(u._id), u.name ?? "", u.email, u.emailVerified === true,
      u.image ?? null, u.createdAt, u.updatedAt,
      typeof u.username === "string" ? u.username : null,
      u.collectionPublic === true,
    ],
  );

  const sessions = await db.collection("session").find({}).toArray();
  await insert(
    "session",
    ["id", "expiresAt", "token", "createdAt", "updatedAt", "ipAddress",
     "userAgent", "userId"],
    sessions,
    (s) => [
      hex(s._id), s.expiresAt, s.token, s.createdAt, s.updatedAt,
      s.ipAddress ?? null, s.userAgent ?? null, hex(s.userId),
    ],
  );

  const accounts = await db.collection("account").find({}).toArray();
  await insert(
    "account",
    ["id", "accountId", "providerId", "userId", "accessToken",
     "refreshToken", "idToken", "accessTokenExpiresAt",
     "refreshTokenExpiresAt", "scope", "password", "createdAt", "updatedAt"],
    accounts,
    (a) => [
      hex(a._id), hex(a.accountId), a.providerId, hex(a.userId),
      a.accessToken ?? null, a.refreshToken ?? null, a.idToken ?? null,
      a.accessTokenExpiresAt ?? null, a.refreshTokenExpiresAt ?? null,
      a.scope ?? null, a.password ?? null, a.createdAt, a.updatedAt,
    ],
  );

  // Only unexpired codes matter; expired ones are dead weight.
  const verifications = await db
    .collection("verification")
    .find({ expiresAt: { $gt: new Date() } })
    .toArray();
  await insert(
    "verification",
    ["id", "identifier", "value", "expiresAt", "createdAt", "updatedAt"],
    verifications,
    (v) => [
      hex(v._id), v.identifier, v.value, v.expiresAt,
      v.createdAt ?? new Date(), v.updatedAt ?? new Date(),
    ],
  );

  const passkeys = await db.collection("passkey").find({}).toArray();
  await insert(
    "passkey",
    ["id", "name", "publicKey", "userId", "credentialID", "counter",
     "deviceType", "backedUp", "transports", "createdAt", "aaguid"],
    passkeys,
    (p) => [
      hex(p._id), p.name ?? null, p.publicKey, hex(p.userId),
      p.credentialID, p.counter, p.deviceType, p.backedUp === true,
      p.transports ?? null, p.createdAt ?? null, p.aaguid ?? null,
    ],
  );

  const items = await db.collection("collectionItems").find({}).toArray();
  await insert(
    "collectionItems",
    ["userId", "sku", "status", "createdAt"],
    items,
    (i) => [i.userId, i.sku, i.status, i.createdAt],
  );

  const devices = await db.collection("userDevices").find({}).toArray();
  await insert(
    "userDevices",
    ["userId", "deviceId", "createdAt"],
    devices,
    (d) => [d.userId, d.deviceId, d.createdAt],
  );

  await client.query("COMMIT");
  console.log("done");
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  throw error;
} finally {
  client.release();
  await pool.end();
  await mongo.close();
}
