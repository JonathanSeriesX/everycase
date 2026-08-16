// Dump every collection in the everycase Mongo DB to JSON files (EJSON
// relaxed-ish: ObjectId -> {$oid}, Date -> {$date} so nothing is lossy).
import { MongoClient, BSON } from "mongodb";
const { EJSON } = BSON;
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

// Read MONGODB_URI from the environment, falling back to .env.local (values
// there may be quoted).
import { readFileSync } from "node:fs";
let uri = process.env.MONGODB_URI;
if (!uri) {
  const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const match = env.match(/^MONGODB_URI="?([^"\n]+)"?$/m);
  uri = match?.[1];
}
if (!uri) throw new Error("MONGODB_URI missing");
const outDir = process.argv[2];
if (!outDir) throw new Error("usage: node dump-mongo.mjs <outDir>");

const client = new MongoClient(uri);
await client.connect();
const db = client.db("everycase");

await mkdir(outDir, { recursive: true });
const collections = await db.listCollections().toArray();
for (const { name } of collections) {
  const docs = await db.collection(name).find({}).toArray();
  const file = path.join(outDir, `${name}.json`);
  await writeFile(file, EJSON.stringify(docs, null, 2));
  console.log(`${name}: ${docs.length} docs -> ${file}`);
}
await client.close();
