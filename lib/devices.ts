import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { getCompatibleModels } from "./getCompatibleModels";

// devices.csv is the device catalogue: one row per model × colour, in
// release order. It backs the "your devices" feature — users own devices,
// and collection items can be linked to them.

export interface DeviceRecord {
  deviceId: string;
  imageKey: string;
  /** Overrides imageKey for tile/thumbnail artwork, like cases' alt_thumbnail. */
  altThumbnail: string;
  kind: string;
  model: string;
  colour: string;
  season: string;
  releaseDate: string;
}

/** The everypreview code for a device's artwork; "" when there is none. */
export const deviceThumbnail = (device: DeviceRecord): string =>
  device.altThumbnail || device.imageKey;

/**
 * Human-facing model name. devices.csv stores the join-friendly form that
 * matches models.csv compatibility ("iPad Pro 9.7-inch", "MacBook 12"); the UI
 * shows screen sizes with the ″ prime ("iPad Pro 9.7″", "MacBook 12″"). Only
 * screen-size numbers get the prime — iPhone/iPad generation numbers ("iPad 2",
 * "iPhone 15") are untouched.
 */
export function displayModelName(model: string): string {
  const withPrime = model.replace(/-inch/g, "″");
  return /^MacBook\b/.test(withPrime) && /[0-9]$/.test(withPrime)
    ? `${withPrime}″`
    : withPrime;
}

const DEVICES_PATH = path.join(process.cwd(), "database", "devices.csv");

let cachedDevices: DeviceRecord[] | undefined;
let cachedById: Map<string, DeviceRecord> | undefined;

/** Every device, in devices.csv (release) order. */
export function getAllDevices(): DeviceRecord[] {
  if (cachedDevices) return cachedDevices;

  const csvData = fs.readFileSync(DEVICES_PATH, "utf-8");
  const rows: Record<string, string>[] = parse(csvData, {
    columns: true,
    skip_empty_lines: true,
  });

  cachedDevices = rows
    .map((row) => ({
      deviceId: (row.device_id || "").trim(),
      imageKey: (row.image_key || "").trim(),
      altThumbnail: (row.alt_thumbnail || "").trim(),
      kind: (row.kind || "").trim(),
      model: (row.model || "").trim(),
      colour: (row.colour || "").trim(),
      season: (row.season || "").trim(),
      releaseDate: (row.release_date || "").trim(),
    }))
    .filter((device) => device.deviceId);

  return cachedDevices;
}

export function getDeviceById(deviceId: string): DeviceRecord | undefined {
  cachedById ??= new Map(
    getAllDevices().map((device) => [device.deviceId, device]),
  );
  return cachedById.get(deviceId);
}

// models.csv speaks a slightly different dialect from devices.csv ("iPad Pro
// 11″ 1st gen" vs "iPad Pro 11-inch (1st gen)"), and is not even internally
// consistent for older iPads. Rather than rewrite either CSV, translate the
// compatibility-target names into devices.csv vocabulary here. Targets with
// no entry and no exact match simply have no devices (AirTags, MacBooks, …).
const MODEL_ALIASES: Record<string, string> = {
  "iPad 9.7″ 1st gen": "iPad",
  "iPad 9.7″ 2nd gen": "iPad 2",
  "the new iPad (3)": "iPad (3rd gen)",
  "iPad 4": "iPad (4th gen)",
  "iPad 9.7″ 5th gen": "iPad (5th gen)",
  "iPad 9.7″ 6th gen": "iPad (6th gen)",
  "iPad 7th gen": "iPad (7th gen)",
  "iPad 8th gen": "iPad (8th gen)",
  "iPad 9th gen": "iPad (9th gen)",
  "iPad 10.9″ 10th gen": "iPad (10th gen)",
  "iPad 11″ (A16)": "iPad (A16)",
  "iPad Air 1": "iPad Air",
  "iPad Air 3": "iPad Air (3rd gen)",
  "iPad Air 4th gen": "iPad Air (4th gen)",
  "iPad Air 5th gen": "iPad Air (5th gen)",
  "iPad Air 11″ (M2)": "iPad Air 11-inch (M2)",
  "iPad Air 11″ (M3)": "iPad Air 11-inch (M3)",
  "iPad Air 13″ (M2)": "iPad Air 13-inch (M2)",
  "iPad Air 13″ (M3)": "iPad Air 13-inch (M3)",
  "iPad Pro 9.7″": "iPad Pro 9.7-inch",
  "iPad Pro 10.5″": "iPad Pro 10.5-inch",
  "iPad Pro 11″ 1st gen": "iPad Pro 11-inch (1st gen)",
  "iPad Pro 11″ 2nd gen": "iPad Pro 11-inch (2nd gen)",
  "iPad Pro 11″ 3rd gen (M1)": "iPad Pro 11-inch (3rd gen)",
  "iPad Pro 11″ 4th gen (M2)": "iPad Pro 11-inch (4th gen)",
  "iPad Pro 11″ (M4)": "iPad Pro 11-inch (M4)",
  "iPad Pro 12.9″ 1st gen": "iPad Pro 12.9-inch (1st gen)",
  "iPad Pro 12.9″ 2nd gen": "iPad Pro 12.9-inch (2nd gen)",
  "iPad Pro 12.9″ 3rd gen": "iPad Pro 12.9-inch (3rd gen)",
  "iPad Pro 12.9″ 4th gen": "iPad Pro 12.9-inch (4th gen)",
  "iPad Pro 12.9″ 5th gen (M1)": "iPad Pro 12.9-inch (5th gen)",
  "iPad Pro 12.9″ 6th gen (M2)": "iPad Pro 12.9-inch (6th gen)",
  "iPad Pro 13″ (M4)": "iPad Pro 13-inch (M4)",
  "iPad mini 1": "iPad mini",
  "iPad mini 5": "iPad mini (5th gen)",
  "iPad mini 6": "iPad mini (6th gen)",
  "iPhone SE (2016)": "iPhone SE 1st gen",
  "iPhone SE (2020)": "iPhone SE 2nd gen",
  "iPhone SE (2022)": "iPhone SE 3rd gen",
  "Apple Pencil (1st generation)": "Apple Pencil (1st gen)",
  "MacBook 12″ (2015–2017)": "MacBook 12",
  "MacBook Air 13″": "MacBook Air 13",
  "MacBook Pro 13″": "MacBook Pro 13",
  "MacBook Pro 15″ (2016–2019)": "MacBook Pro 15",
  "MacBook Pro 16″ (2019)": "MacBook Pro 16",
  // Not real devices: the shared homes for MagSafe accessories (wallets,
  // chargers) and Lightning docks in collections — see the implicit groups
  // in lib/collectionItems.
  "MagSafe iPhone": "MagSafe Accessories",
  "Lightning iPhone": "Lightning Accessories",
};

// Collection pages list the owner's real devices newest-first, then the
// accessory homes (single-device models and the dummy devices) in this
// fixed editorial order.
const TAIL_KINDS = ["Apple Pencil", "AirTag", "MagSafe", "Lightning"];

const parseReleaseDate = (value: string): number => {
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : 0;
};

let cachedCatalogueIndex: Map<string, number> | undefined;
const catalogueIndex = (deviceId: string): number => {
  cachedCatalogueIndex ??= new Map(
    getAllDevices().map((device, index) => [device.deviceId, index]),
  );
  return cachedCatalogueIndex.get(deviceId) ?? 0;
};

/**
 * Order for collection-page device groups: real devices by release date,
 * newest first (devices.csv order breaks same-day ties); accessory kinds
 * trail in TAIL_KINDS order.
 */
export function compareDevicesForCollection(
  a: DeviceRecord,
  b: DeviceRecord,
): number {
  const tailA = TAIL_KINDS.indexOf(a.kind);
  const tailB = TAIL_KINDS.indexOf(b.kind);
  if (tailA !== tailB) {
    if (tailA === -1) return -1;
    if (tailB === -1) return 1;
    return tailA - tailB;
  }
  if (tailA !== -1) return 0;
  return (
    parseReleaseDate(b.releaseDate) - parseReleaseDate(a.releaseDate) ||
    catalogueIndex(a.deviceId) - catalogueIndex(b.deviceId)
  );
}

/**
 * Devices a case fits, in catalogue order: the case's compatible models
 * (per models.csv) resolved to every matching devices.csv row.
 */
export function getCompatibleDevices(caseModel: string): DeviceRecord[] {
  const wanted = new Set(
    getCompatibleModels(caseModel).map(
      (model) => MODEL_ALIASES[model] ?? model,
    ),
  );
  if (wanted.size === 0) return [];
  return getAllDevices().filter((device) => wanted.has(device.model));
}
