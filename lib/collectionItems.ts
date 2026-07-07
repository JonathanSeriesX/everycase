import { db } from "./mongo";
import { getAllCasesFromCSV, type CaseRecord } from "./getCasesFromCSV";
import {
  getAllDevices,
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
}

export interface LoadedCollection {
  owned: CaseRecord[];
  wanted: CaseRecord[];
  /** Owned devices in catalogue (release) order, each with its cases. */
  deviceGroups: DeviceGroup[];
  /** Owned cases that fit none of the owned devices. */
  unassigned: CaseRecord[];
}

/** A user's collection resolved to catalogue records, newest first. */
export async function loadCollection(
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

  // Devices resolve against the catalogue in reverse (release) order, so
  // the collection page reads newest device to oldest regardless of when
  // each was added.
  const catalogueOrder = new Map(
    getAllDevices().map((device, index) => [device.deviceId, index]),
  );
  const devices = deviceDocs
    .map((doc) => getDeviceById(doc.deviceId))
    .filter((device): device is DeviceRecord => Boolean(device))
    .sort(
      (a, b) =>
        (catalogueOrder.get(b.deviceId) ?? 0) -
        (catalogueOrder.get(a.deviceId) ?? 0),
    );
  const ownedDeviceIds = new Set(devices.map((device) => device.deviceId));

  const deviceGroups = devices.map((device) => ({
    device,
    cases: owned.filter((record) =>
      compatibleDeviceIds(record.model).has(device.deviceId),
    ),
  }));
  const unassigned = owned.filter((record) => {
    for (const id of compatibleDeviceIds(record.model)) {
      if (ownedDeviceIds.has(id)) return false;
    }
    return true;
  });

  return { owned, wanted, deviceGroups, unassigned };
}
