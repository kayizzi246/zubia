import "server-only";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * One Postgres pool for the whole app.
 *
 * Next.js reloads modules on every edit in development, which would leak a
 * new pool each time, so the pool is cached on globalThis. In production the
 * module is evaluated once and the cache is simply unused.
 */
const globalForDb = globalThis as unknown as {
  zubiaPool?: Pool;
  zubiaDb?: NodePgDatabase<typeof schema>;
};

/**
 * Read lazily rather than captured at module load, so a script that loads
 * its .env after importing this module still sees the value.
 */
function databaseUrl(): string {
  return process.env.DATABASE_URL ?? "";
}

/** False until DATABASE_URL is set, so the site can fall back to samples. */
export function isDatabaseConfigured(): boolean {
  return Boolean(databaseUrl());
}

function createPool(): Pool {
  const url = databaseUrl();
  if (!url) {
    throw new Error(
      "DATABASE_URL is missing from web/.env.local. Copy web/.env.example and run `docker compose up -d`.",
    );
  }

  return new Pool({
    connectionString: url,
    // Each Next.js server process keeps its own pool, so this stays small.
    // Postgres defaults to 100 connections in total.
    max: 10,
    idleTimeoutMillis: 30_000,
    // Fail fast rather than hanging a page render when the database is down.
    connectionTimeoutMillis: 10_000,
    // Managed Postgres usually requires TLS; a local Docker container has
    // none. Set DATABASE_SSL=1 in production.
    ssl:
      process.env.DATABASE_SSL === "1"
        ? { rejectUnauthorized: true }
        : undefined,
  });
}

function getPool(): Pool {
  if (!globalForDb.zubiaPool) {
    const pool = createPool();
    // Without a listener, a dropped backend connection crashes the process.
    pool.on("error", (err) => {
      console.error("Postgres pool error:", err.message);
    });
    globalForDb.zubiaPool = pool;
  }
  return globalForDb.zubiaPool;
}

type Database = NodePgDatabase<typeof schema>;

function getDb(): Database {
  if (!globalForDb.zubiaDb) {
    globalForDb.zubiaDb = drizzle(getPool(), { schema });
  }
  return globalForDb.zubiaDb;
}

/**
 * The query builder.
 *
 * A lazy proxy, not a plain `drizzle(...)` call, because importing this
 * module must not require DATABASE_URL to be set. The public site falls back
 * to sample listings when there is no database, and that fallback has to
 * survive the import: building the pool eagerly would throw before any code
 * got the chance to check isDatabaseConfigured().
 *
 * Nothing connects until the first query.
 */
export const db = new Proxy({} as Database, {
  get(_target, property, receiver) {
    return Reflect.get(getDb(), property, receiver);
  },
});

export { schema };
