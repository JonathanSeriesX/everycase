import { cache } from "react";
import { db } from "./mongo";
import { getAllCasesFromCSV, type CaseRecord } from "./getCasesFromCSV";
import {
  compareDevicesForCollection,
  getCompatibleDevices,
  getDeviceById,
  type DeviceRecord,
} from "./devices";
import { userDevices } from "./userDevices";

// One document per (user, case): { userId, sku, status, createdAt }. The
// unique index on (userId, sku) is the source of truth for "at most one
// status per case"; createdAt exists solely so pages can sort by freshness.
//
// Devices (lib/userDevices) are NOT linked to cases explicitly — a case
// groups under every owned device it fits, derived from the compatibility
// tables at read time. Devices are first-class: usually registered by the
// "which device do you have?" window on a case page, they stay until the
// owner removes them, whatever happens to the cases.

export interface CollectionItemDoc {
  userId: string;
  sku: string;
  status: "owned" | "wanted";
  createdAt: Date;
}

export const collectionItems = () =>
  db.collection<CollectionItemDoc>("collectionItems");

// Compatible device ids per case model, cached — the collection loader hits
// the same few models over and over.
const compatCache = new Map<string, Set<string>>();
const compatibleDeviceIds = (model: string): Set<string> => {
  let ids = compatCache.get(model);
  if (!ids) {
    ids = new Set(getCompatibleDevices(model).map((d) => d.deviceId));
    compatCache.set(model, ids);
  }
  return ids;
};

/** One owned device plus the owned cases that fit it (possibly none —
 * a device with no cases renders as a bare device tile). */
export interface DeviceGroup {
  device: DeviceRecord;
  cases: CaseRecord[];
  /** Derived, not owned: cases whose model fits exactly one catalogue
   * device (AirTag, Apple Pencil, the MagSafe Accessories stand-in) group
   * under it automatically, with no unlink controls. */
  implicit?: boolean;
}

export interface LoadedCollection {
  owned: CaseRecord[];
  wanted: CaseRecord[];
  /** Owned devices in catalogue (release) order, each with its cases. */
  deviceGroups: DeviceGroup[];
  /** Owned cases that fit none of the owned devices. */
  unassigned: CaseRecord[];
}

/** A user's collection resolved to catalogue records, newest first.
 * Request-cached: generateMetadata and the page share one load. */
export const loadCollection = cache(async function loadCollection(
  userId: string,
): Promise<LoadedCollection> {
  const [docs, deviceDocs] = await Promise.all([
    collectionItems().find({ userId }).sort({ createdAt: -1 }).toArray(),
    userDevices().find({ userId }).toArray(),
  ]);

  const bySku = new Map(
    getAllCasesFromCSV().map((record) => [record.SKU, record]),
  );
  const resolve = (status: string) =>
    docs
      .filter((doc) => doc.status === status)
      .map((doc) => bySku.get(doc.sku))
      .filter((record): record is CaseRecord => Boolean(record));

  const owned = resolve("owned");
  const wanted = resolve("wanted");

  const devices = deviceDocs
    .map((doc) => getDeviceById(doc.deviceId))
    .filter((device): device is DeviceRecord => Boolean(device));
  const ownedDeviceIds = new Set(devices.map((device) => device.deviceId));

  const deviceGroups: DeviceGroup[] = devices.map((device) => ({
    device,
    cases: owned.filter((record) =>
      compatibleDeviceIds(record.model).has(device.deviceId),
    ),
  }));

  // Cases that fit exactly one catalogue device link to it automatically —
  // there is nothing to ask the owner. Everything else that fits none of
  // the owned devices stays unassigned.
  const implicitCases = new Map<string, CaseRecord[]>();
  const unassigned: CaseRecord[] = [];
  for (const record of owned) {
    const fits = compatibleDeviceIds(record.model);
    if ([...fits].some((id) => ownedDeviceIds.has(id))) continue;
    const only = fits.size === 1 ? [...fits][0] : undefined;
    const device = only !== undefined ? getDeviceById(only) : undefined;
    if (only !== undefined && device) {
      (implicitCases.get(only) ??
        implicitCases.set(only, []).get(only)!).push(record);
    } else {
      unassigned.push(record);
    }
  }
  deviceGroups.push(
    ...[...implicitCases.entries()].map(([deviceId, cases]) => ({
      device: getDeviceById(deviceId)!,
      cases,
      implicit: true,
    })),
  );
  // Real devices newest to oldest by release date, accessory homes
  // (Pencil, AirTag, MagSafe, Lightning) trailing in fixed order.
  deviceGroups.sort((a, b) => compareDevicesForCollection(a.device, b.device));

  return { owned, wanted, deviceGroups, unassigned };
});
