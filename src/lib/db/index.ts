import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "../env";
import * as schema from "./schema";

export type Database = NodePgDatabase<typeof schema>;

type GlobalDatabaseState = typeof globalThis & {
  __plagcheckDb?: Database;
  __plagcheckPool?: Pool;
};

const globalDatabaseState = globalThis as GlobalDatabaseState;

export function getDatabasePool(): Pool {
  globalDatabaseState.__plagcheckPool ??= new Pool({
    connectionString: env.DATABASE_URL,
    connectionTimeoutMillis: 2_000,
    max: 10
  });

  return globalDatabaseState.__plagcheckPool;
}

export function getDatabase(): Database {
  globalDatabaseState.__plagcheckDb ??= drizzle(getDatabasePool(), {
    schema
  });

  return globalDatabaseState.__plagcheckDb;
}

export async function checkDatabaseConnection(): Promise<{
  latencyMs: number;
}> {
  const startedAt = performance.now();
  await getDatabasePool().query("select 1");

  return {
    latencyMs: Math.round(performance.now() - startedAt)
  };
}

export async function closeDatabaseConnection(): Promise<void> {
  if (!globalDatabaseState.__plagcheckPool) {
    return;
  }

  await globalDatabaseState.__plagcheckPool.end();
  globalDatabaseState.__plagcheckPool = undefined;
  globalDatabaseState.__plagcheckDb = undefined;
}

export { schema };
