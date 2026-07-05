import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "../../../lib/auth";
import { collectionItems } from "../../../lib/collectionItems";
import { getAllCasesFromCSV } from "../../../lib/getCasesFromCSV";

// Collection items: one document per (user, case) — see lib/collectionItems.

const STATUSES = ["owned", "wanted"] as const;
type Status = (typeof STATUSES)[number];

// Fast-path shape check before the catalogue lookup.
const SKU_PATTERN = /^[A-Z0-9]{3,12}$/;
const MAX_ITEMS = 5000;

let indexReady: Promise<unknown> | undefined;
const ensureIndex = () =>
  (indexReady ??= collectionItems().createIndex(
    { userId: 1, sku: 1 },
    { unique: true },
  ));

let knownSkus: Set<string> | undefined;
const isCatalogueSku = (sku: string) => {
  knownSkus ??= new Set(getAllCasesFromCSV().map((record) => record.SKU));
  return knownSkus.has(sku);
};

const unauthorized = () =>
  NextResponse.json({ error: "Not signed in" }, { status: 401 });

async function getUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user.id ?? null;
}

/** GET /api/collection[?skus=A,B] — the user's items, optionally filtered. */
export async function GET(request: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const skusParam = new URL(request.url).searchParams.get("skus");
  const filter: Record<string, unknown> = { userId };
  if (skusParam !== null) {
    const skus = skusParam
      .split(",")
      .map((sku) => sku.trim().toUpperCase())
      .filter((sku) => SKU_PATTERN.test(sku));
    filter.sku = { $in: skus };
  }

  const docs = await collectionItems()
    .find(filter as { userId: string })
    .toArray();
  return NextResponse.json({
    items: docs.map((doc) => ({ sku: doc.sku, status: doc.status })),
  });
}

/** PUT /api/collection { sku, status } — add or change one item. */
export async function PUT(request: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const body = await request.json().catch(() => null);
  const sku =
    typeof body?.sku === "string" ? body.sku.trim().toUpperCase() : "";
  const status = body?.status as Status;
  if (
    !SKU_PATTERN.test(sku) ||
    !STATUSES.includes(status) ||
    !isCatalogueSku(sku)
  ) {
    return NextResponse.json({ error: "Invalid item" }, { status: 400 });
  }

  await ensureIndex();
  if ((await collectionItems().countDocuments({ userId })) >= MAX_ITEMS) {
    return NextResponse.json({ error: "Collection is full" }, { status: 400 });
  }

  await collectionItems().updateOne(
    { userId, sku },
    { $set: { status }, $setOnInsert: { createdAt: new Date() } },
    { upsert: true },
  );
  return NextResponse.json({ sku, status });
}

/** DELETE /api/collection?sku=A — remove one item. */
export async function DELETE(request: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const sku =
    new URL(request.url).searchParams.get("sku")?.trim().toUpperCase() ?? "";
  if (!SKU_PATTERN.test(sku)) {
    return NextResponse.json({ error: "Invalid item" }, { status: 400 });
  }

  await collectionItems().deleteOne({ userId, sku });
  return NextResponse.json({ sku, status: null });
}
