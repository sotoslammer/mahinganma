import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Prefer Neon's direct (non-pooled) URL for migrations.
 *
 * The pooled Neon host is for runtime queries; Prisma migrations need a direct
 * session connection. Vercel Marketplace / Neon typically inject both.
 *
 * Read through `process.env` rather than Prisma's `env()` helper: `env()` throws
 * at config-load time when the variable is missing, which would break
 * `prisma generate` (and therefore `npm install` and `next build`) on machines
 * that have no database configured yet.
 */
const datasourceUrl = (() => {
  const raw =
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DIRECT_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    "";
  if (!raw) return "";
  // Migrations need TLS to Neon; some console copies omit sslmode.
  if (/[?&]sslmode=/i.test(raw)) return raw;
  return raw.includes("?") ? `${raw}&sslmode=require` : `${raw}?sslmode=require`;
})();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: datasourceUrl,
  },
});
