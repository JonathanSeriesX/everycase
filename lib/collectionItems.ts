import { db } from "./mongo";
import { getAllCasesFromCSV, type CaseRecord } from "./getCasesFromCSV";
import { sortCases } from "./catalogue";

/** A user's collection resolved to catalogue records, in catalogue order. */
export async function loadCollection(
  userId: string,
): Promise<{ owned: CaseRecord[]; wanted: CaseRecord[] }> {
  const docs = await db
    .collection("collectionItems")
    .find({ userId })
    .toArray();

  const bySku = new Map(
    getAllCasesFromCSV().map((record) => [record.SKU, record]),
  );
  const resolve = (status: string) =>
    sortCases(
      docs
        .filter((doc) => doc.status === status)
        .map((doc) => bySku.get(doc.sku))
        .filter((record): record is CaseRecord => Boolean(record)),
    );

  return { owned: resolve("owned"), wanted: resolve("wanted") };
}
