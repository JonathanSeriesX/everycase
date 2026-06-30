import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

const CSV_PATH = path.join(process.cwd(), "scripts", "similarities.csv");

let cachedGroupsBySku;

// The CSV stores group membership rather than every possible SKU pair. This
// keeps a group of n similar products to n rows instead of n * (n - 1).
function loadGroupsBySku() {
  if (cachedGroupsBySku) return cachedGroupsBySku;

  const rows = parse(fs.readFileSync(CSV_PATH, "utf-8"), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  const membersByGroup = new Map();
  const groupBySku = new Map();

  for (const row of rows) {
    const groupId = row.group_id;
    const sku = row.SKU;
    if (!groupId || !sku) continue;

    const existingGroup = groupBySku.get(sku);
    if (existingGroup && existingGroup !== groupId) {
      throw new Error(
        `SKU ${sku} belongs to multiple similarity groups: ${existingGroup}, ${groupId}`,
      );
    }

    const members = membersByGroup.get(groupId) ?? new Set();
    members.add(sku);
    membersByGroup.set(groupId, members);
    groupBySku.set(sku, groupId);
  }

  cachedGroupsBySku = new Map();
  for (const memberSet of membersByGroup.values()) {
    const members = [...memberSet];
    if (members.length < 2) continue;
    for (const sku of members) cachedGroupsBySku.set(sku, members);
  }

  return cachedGroupsBySku;
}

export function getSimilarSkus(sku) {
  const normalizedSku = String(sku || "").trim();
  const group = loadGroupsBySku().get(normalizedSku) ?? [];
  return group.filter((memberSku) => memberSku !== normalizedSku);
}
