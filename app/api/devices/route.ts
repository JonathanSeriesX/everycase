import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "../../../lib/auth";
import {
  deviceThumbnail,
  getAllDevices,
  getCompatibleDevices,
  getDeviceById,
  type DeviceRecord,
} from "../../../lib/devices";
import { ensureUserDeviceIndex, userDevices } from "../../../lib/userDevices";
import { getAllCasesFromCSV } from "../../../lib/getCasesFromCSV";

// The user's owned devices — see lib/userDevices. Cases are never linked to
// devices explicitly; grouping is derived from compatibility, so adding or
// removing a device is just that one document. Devices normally enter via
// the "which device do you have?" window (PUT, first compatible owned case)
// and stay until their owner explicitly removes them (DELETE, or a colour
// swap replacing one via PUT's replaceDeviceId).

const DEVICE_ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,63}$/;
const SKU_PATTERN = /^[A-Z0-9]{3,12}$/;
const MAX_DEVICES = 500;

let modelBySku: Map<string, string> | undefined;
const catalogueModel = (sku: string) => {
  modelBySku ??= new Map(
    getAllCasesFromCSV().map((record) => [record.SKU, record.model]),
  );
  return modelBySku.get(sku);
};

const unauthorized = () =>
  NextResponse.json({ error: "Not signed in" }, { status: 401 });

async function getUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user.id ?? null;
}

const publicShape = (device: DeviceRecord) => ({
  deviceId: device.deviceId,
  model: device.model,
  colour: device.colour,
  thumbnail: deviceThumbnail(device),
});

/**
 * GET /api/devices[?sku=A] — the user's devices in catalogue order, plus
 * (when a catalogue SKU is given) every device that case is compatible with,
 * for the "which device do you have?" window on case pages.
 */
export async function GET(request: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const docs = await userDevices().find({ userId }).toArray();
  const ownedIds = new Set(docs.map((doc) => doc.deviceId));
  const devices = getAllDevices()
    .filter((device) => ownedIds.has(device.deviceId))
    .map(publicShape);

  const sku =
    new URL(request.url).searchParams.get("sku")?.trim().toUpperCase() ?? "";
  const model = SKU_PATTERN.test(sku) ? catalogueModel(sku) : undefined;
  const compatible =
    model !== undefined ? getCompatibleDevices(model).map(publicShape) : [];

  return NextResponse.json({ devices, compatible });
}

/**
 * PUT /api/devices { deviceId, replaceDeviceId? } — the user owns this
 * device. With replaceDeviceId, the old device is removed in the same
 * request (the "change colour" swap), so the client never has to sequence
 * two calls that could fail halfway.
 */
export async function PUT(request: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const body = await request.json().catch(() => null);
  const deviceId =
    typeof body?.deviceId === "string" ? body.deviceId.trim() : "";
  if (!DEVICE_ID_PATTERN.test(deviceId) || !getDeviceById(deviceId)) {
    return NextResponse.json({ error: "Invalid device" }, { status: 400 });
  }
  const replaceDeviceId =
    typeof body?.replaceDeviceId === "string" ? body.replaceDeviceId.trim() : "";
  if (replaceDeviceId && !DEVICE_ID_PATTERN.test(replaceDeviceId)) {
    return NextResponse.json({ error: "Invalid device" }, { status: 400 });
  }

  await ensureUserDeviceIndex();
  if ((await userDevices().countDocuments({ userId })) >= MAX_DEVICES) {
    return NextResponse.json({ error: "Too many devices" }, { status: 400 });
  }

  await userDevices().updateOne(
    { userId, deviceId },
    { $setOnInsert: { userId, deviceId, createdAt: new Date() } },
    { upsert: true },
  );
  if (replaceDeviceId && replaceDeviceId !== deviceId) {
    await userDevices().deleteOne({ userId, deviceId: replaceDeviceId });
  }
  return NextResponse.json({ deviceId });
}

/** DELETE /api/devices?deviceId=x — remove one device. Its cases stay in
 * the collection and simply stop grouping under it. */
export async function DELETE(request: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const deviceId =
    new URL(request.url).searchParams.get("deviceId")?.trim() ?? "";
  if (!DEVICE_ID_PATTERN.test(deviceId)) {
    return NextResponse.json({ error: "Invalid device" }, { status: 400 });
  }

  await userDevices().deleteOne({ userId, deviceId });
  return NextResponse.json({ deviceId, removed: true });
}
