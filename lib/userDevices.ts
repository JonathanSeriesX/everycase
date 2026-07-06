import { db } from "./mongo";

// One document per (user, device) — a device the user owns. Deliberately
// independent of collectionItems: a device is not deleted when its last
// linked case goes, and a case link never implies exclusive ownership.

export interface UserDeviceDoc {
  userId: string;
  deviceId: string;
  createdAt: Date;
}

export const userDevices = () => db.collection<UserDeviceDoc>("userDevices");

let indexReady: Promise<unknown> | undefined;
export const ensureUserDeviceIndex = () =>
  (indexReady ??= userDevices().createIndex(
    { userId: 1, deviceId: 1 },
    { unique: true },
  ));
