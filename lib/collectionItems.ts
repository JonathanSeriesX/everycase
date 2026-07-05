import { db } from "./mongo";
import { getAllCasesFromCSV, type CaseRecord } from "./getCasesFromCSV";

// One document per (user, case): { userId, sku, status, createdAt }. The
// unique index on (userId, sku) is the source of truth for "at most one
// status per case"; createdAt exists solely so pages can sort by freshness.

export interface CollectionItemDoc {
  userId: string;
  sku: string;
  status: "owned" | "wanted";
  createdAt: Date;
}

export const collectionItems = () =>
  db.collection<CollectionItemDoc>("collectionItems");

/** A user's collection resolved to catalogue records, newest first. */
export async function loadCollection(
  userId: string,
): Promise<{ owned: CaseRecord[]; wanted: CaseRecord[] }> {
  const docs = await collectionItems()
    .find({ userId })
    .sort({ createdAt: -1 })
    .toArray();

  const bySku = new Map(
    getAllCasesFromCSV().map((record) => [record.SKU, record]),
  );
  const resolve = (status: string) =>
    docs
      .filter((doc) => doc.status === status)
      .map((doc) => bySku.get(doc.sku))
      .filter((record): record is CaseRecord => Boolean(record));

  return { owned: resolve("owned"), wanted: resolve("wanted") };
}
