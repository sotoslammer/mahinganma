#!/usr/bin/env node
/**
 * Vercel build entrypoint.
 *
 * 1. Always generate the Prisma client (needs no database).
 * 2. Apply pending migrations when a connection string is present — so a fresh
 *    Neon database gets its Student/Waiver tables on the first preview deploy.
 * 3. Build the Next.js app.
 *
 * Migrations are skipped (with a clear warning) when no URL is configured, so a
 * misconfigured project still produces a useful build log instead of hanging on
 * an empty connection string.
 */
import { spawnSync } from "node:child_process";
import { config as loadEnv } from "dotenv";

// Local `npm run build` reads `.env`; on Vercel the platform already injects vars.
loadEnv();

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: false });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const databaseUrl =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_POOLED;

run("npx", ["prisma", "generate"]);

if (databaseUrl) {
  console.log("[build] Applying Prisma migrations…");
  run("npx", ["prisma", "migrate", "deploy"]);
} else {
  console.warn(
    "[build] No DATABASE_URL (or Neon/Postgres equivalent) is set — skipping " +
      "`prisma migrate deploy`. Signup and /admin will fail at runtime until " +
      "you add the Neon connection string to this Vercel environment and redeploy.",
  );
}

run("npx", ["next", "build"]);
