import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type Database = ReturnType<typeof drizzle<typeof schema>>;

let cached: Database | null | undefined;

export function getDb(): Database | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (cached) return cached;
  cached = drizzle(neon(url), { schema });
  return cached;
}

export function requireDb(): Database {
  const db = getDb();
  if (!db) {
    throw new Error("DATABASE_URL is not configured.");
  }
  return db;
}

export type { Database };
