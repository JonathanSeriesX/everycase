import { headers } from "next/headers";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { auth } from "../../../lib/auth";
import { pool } from "../../../lib/db";
import { collectionTag, type CollectionItem } from "../../../lib/collectionItems";
import { getAllCasesFromCSV } from "../../../lib/getCasesFromCSV";

// Collection items: one row per (user, case) — see lib/collectionItems.
// Devices are registered separately (/api/devices, offered by the client's
// "which device do you have?" window) and are never touched here: an owned
// case without a matching device simply lands in the "not linked to a
// device" section, and devices stay until their owner removes them.

const STATUSES = ["owned", "wanted"] as const;
type Status = (typeof STATUSES)[number];

// Fast-path shape check before the catalogue lookup. No size cap: writes
// are upserts on the (userId, sku) primary key against catalogue-validated
// SKUs, so a user's collection is structurally bounded by catalogue size.
const SKU_PATTERN = /^[A-Z0-9]{3,12}$/;

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

/** GET /api/collection[?skus=A,B] — the user's items, optionally filtered. */
export async function GET(request: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const skusParam = new URL(request.url).searchParams.get("skus");
  let rows: CollectionItem[];
  if (skusParam !== null) {
    const skus = skusParam
      .split(",")
      .map((sku) => sku.trim().toUpperCase())
      .filter((sku) => SKU_PATTERN.test(sku));
    ({ rows } = await pool.query<CollectionItem>(
      `SELECT "sku", "status" FROM "collectionItems"
       WHERE "userId" = $1 AND "sku" = ANY($2)`,
      [userId, skus],
    ));
  } else {
    ({ rows } = await pool.query<CollectionItem>(
      `SELECT "sku", "status" FROM "collectionItems" WHERE "userId" = $1`,
      [userId],
    ));
  }

  return NextResponse.json({
    items: rows.map((row) => ({ sku: row.sku, status: row.status })),
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
  const model = SKU_PATTERN.test(sku) ? catalogueModel(sku) : undefined;
  if (model === undefined || !STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid item" }, { status: 400 });
  }

  // createdAt is set on first insert only, so a later status flip keeps the
  // item's place in the newest-first ordering.
  await pool.query(
    `INSERT INTO "collectionItems" ("userId", "sku", "status")
     VALUES ($1, $2, $3)
     ON CONFLICT ("userId", "sku") DO UPDATE SET "status" = EXCLUDED."status"`,
    [userId, sku, status],
  );
  // Route handlers can't use updateTag (Server-Action-only), and the "max"
  // profile is stale-while-revalidate — a router.refresh() right after this
  // write would still be served the old collection. { expire: 0 } hard-expires
  // the tagged entries so the very next read sees this write.
  revalidateTag(collectionTag(userId), { expire: 0 });
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

  await pool.query(
    `DELETE FROM "collectionItems" WHERE "userId" = $1 AND "sku" = $2`,
    [userId, sku],
  );
  // Route handlers can't use updateTag (Server-Action-only), and the "max"
  // profile is stale-while-revalidate — a router.refresh() right after this
  // write would still be served the old collection. { expire: 0 } hard-expires
  // the tagged entries so the very next read sees this write.
  revalidateTag(collectionTag(userId), { expire: 0 });
  return NextResponse.json({ sku, status: null });
}
