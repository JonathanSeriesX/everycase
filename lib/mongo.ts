import { MongoClient } from "mongodb";

// One client per process, cached across serverless invocations and dev HMR.
// maxPoolSize stays small so Vercel function instances don't exhaust the
// Atlas M0 connection limit (500).
const globalForMongo = globalThis as unknown as { mongoClient?: MongoClient };

export const mongoClient =
  globalForMongo.mongoClient ??
  new MongoClient(process.env.MONGODB_URI!, { maxPoolSize: 5 });

globalForMongo.mongoClient = mongoClient;

export const db = mongoClient.db("everycase");
