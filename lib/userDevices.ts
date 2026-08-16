import { pool } from "./db";

// One row per (user, device) — a device the user owns. Deliberately
// independent of collectionItems: a device is not deleted when its last
// linked case goes, and a case link never implies exclusive ownership.
// The primary key on ("userId", "deviceId") is what makes adds race-safe.

/** The user's owned device ids (catalogue order is applied by callers). */
export async function listUserDeviceIds(userId: string): Promise<string[]> {
  const { rows } = await pool.query<{ deviceId: string }>(
    `SELECT "deviceId" FROM "userDevices" WHERE "userId" = $1`,
    [userId],
  );
  return rows.map((row) => row.deviceId);
}

/** Record that the user owns this device (no-op if already recorded). */
export async function addUserDevice(
  userId: string,
  deviceId: string,
): Promise<void> {
  await pool.query(
    `INSERT INTO "userDevices" ("userId", "deviceId")
     VALUES ($1, $2)
     ON CONFLICT ("userId", "deviceId") DO NOTHING`,
    [userId, deviceId],
  );
}

/** Remove one owned device. */
export async function removeUserDevice(
  userId: string,
  deviceId: string,
): Promise<void> {
  await pool.query(
    `DELETE FROM "userDevices" WHERE "userId" = $1 AND "deviceId" = $2`,
    [userId, deviceId],
  );
}
