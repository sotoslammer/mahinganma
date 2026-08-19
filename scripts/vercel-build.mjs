#!/usr/bin/env node
/**
 * Vercel build entrypoint.
 *
 * 1. Always generate the Prisma client (needs no database).
 * 2. Apply pending migrations when a connection string is present — so a fresh
 *    Neon database gets its Student/Waiver tables on the first preview deploy.
 * 3. Build the Next.js app.
 *
 * Migrations MUST use Neon's direct (non-pooled) URL. The pooler speaks a
 * limited protocol that breaks `prisma migrate deploy`.
 */
import { spawnSync } from "node:child_process";
import { config as loadEnv } from "dotenv";

// Local `npm run build` reads `.env`; on Vercel the platform already injects vars.
loadEnv();

function run(command, args, env = process.env) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: false, env });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function present(name) {
  return Boolean(process.env[name] && String(process.env[name]).trim());
}

/** Neon pooler hosts cannot run migrations; strip them out of the migrate URL. */
function isPooledUrl(url) {
  return /-pooler\./i.test(url) || /[?&]pgbouncer=true/i.test(url);
}

function ensureSsl(url) {
  if (/[?&]sslmode=/i.test(url)) return url;
  return url.includes("?") ? `${url}&sslmode=require` : `${url}?sslmode=require`;
}

const runtimeUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_POOLED ||
  "";

const migrateCandidates = [
  process.env.DATABASE_URL_UNPOOLED,
  process.env.POSTGRES_URL_NON_POOLING,
  process.env.DIRECT_URL,
  // Last resort: only if the runtime URL itself is not a pooler.
  runtimeUrl && !isPooledUrl(runtimeUrl) ? runtimeUrl : "",
].filter((value) => Boolean(value && String(value).trim()));

console.log("[build] Env present:", {
  DATABASE_URL: present("DATABASE_URL"),
  DATABASE_URL_UNPOOLED: present("DATABASE_URL_UNPOOLED"),
  POSTGRES_URL: present("POSTGRES_URL"),
  POSTGRES_URL_NON_POOLING: present("POSTGRES_URL_NON_POOLING"),
  POSTGRES_PRISMA_URL: present("POSTGRES_PRISMA_URL"),
  DIRECT_URL: present("DIRECT_URL"),
  ADMIN_PASSWORD: present("ADMIN_PASSWORD"),
  ADMIN_SESSION_SECRET: present("ADMIN_SESSION_SECRET"),
});

run("npx", ["prisma", "generate"]);

if (migrateCandidates.length === 0) {
  console.warn(
    "[build] No DATABASE_URL (or Neon/Postgres equivalent) is set — skipping " +
      "`prisma migrate deploy`. Signup and /admin will fail at runtime until " +
      "you add the Neon connection string to this Vercel environment and redeploy.",
  );
} else {
  const migrateUrl = ensureSsl(migrateCandidates[0]);
  if (isPooledUrl(migrateUrl)) {
    console.error(
      "[build] Refusing to run migrations against a pooled Neon URL " +
        "(-pooler / pgbouncer). Set DATABASE_URL_UNPOOLED (or POSTGRES_URL_NON_POOLING) " +
        "to the direct connection string from the Neon console, then redeploy.",
    );
    process.exit(1);
  }

  console.log("[build] Applying Prisma migrations against the direct database URL…");

  // Neon free tier can take a moment to wake; one retry covers the cold start.
  const migrateEnv = { ...process.env, DATABASE_URL: migrateUrl };
  let migrated = false;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
      stdio: "inherit",
      shell: false,
      env: migrateEnv,
    });
    if (result.status === 0) {
      migrated = true;
      break;
    }
    console.warn(`[build] migrate deploy attempt ${attempt} failed (exit ${result.status}).`);
    if (attempt === 1) {
      console.warn("[build] Waiting 5s for Neon to wake, then retrying…");
      spawnSync("sleep", ["5"]);
    }
  }
  if (!migrated) {
    console.error(
      "[build] prisma migrate deploy failed. Check that DATABASE_URL_UNPOOLED is the " +
        "Neon direct URL (no -pooler), includes sslmode=require, and that the project is awake.",
    );
    process.exit(1);
  }
}

run("npx", ["next", "build"]);
