import { Pool } from "pg";

// One pool per process, cached across serverless invocations and dev HMR.
// DATABASE_URL must point at Neon's -pooler endpoint (PgBouncer), so each
// Vercel function instance holding a few connections stays cheap; max stays
// small so a burst of instances doesn't pile up server connections behind
// the pooler.
const globalForPg = globalThis as unknown as { pgPool?: Pool };

export const pool =
  globalForPg.pgPool ??
  new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });

globalForPg.pgPool = pool;
